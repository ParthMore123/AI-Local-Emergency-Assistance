const express = require('express');
const { body, validationResult } = require('express-validator');
const EmergencyRequest = require('../models/EmergencyRequest');
const EmergencyContact = require('../models/EmergencyContact');
const EmergencyService = require('../models/EmergencyService');
const { protect } = require('../middleware/auth');
const { classifyWithOptionalLLM } = require('../services/aiClassifier');
const { enrichWithDistance } = require('../services/geo');

const router = express.Router();

const STATUS_FLOW = [
  'request_sent',
  'service_notified',
  'en_route',
  'arriving_soon',
  'help_arrived',
  'completed',
];

function pushStatus(request, status, note) {
  request.status = status;
  request.statusHistory = request.statusHistory || [];
  request.statusHistory.push({ status, note, at: new Date().toISOString() });
}

router.post(
  '/sos',
  protect,
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { lat, lng, description = 'SOS activated', label, confirm } = req.body;
      if (!confirm) {
        return res.status(400).json({
          message: 'SOS confirmation required',
          requiresConfirmation: true,
        });
      }

      const analysis = await classifyWithOptionalLLM(description);
      const types = analysis.recommendedServices || ['hospital', 'ambulance', 'police'];
      const services = await EmergencyService.find({ type: { $in: types } }).limit(40);
      const nearby = enrichWithDistance(services, lat, lng);
      const primary = nearby[0];

      const contacts = await EmergencyContact.find({
        userId: req.user._id,
        notifyOnSos: true,
      }).sort({ priority: 1 });

      const request = await EmergencyRequest.create({
        userId: req.user._id,
        emergencyType: analysis.emergencyType,
        description,
        priority: analysis.priority === 'critical' ? 'critical' : 'high',
        location: { lat, lng, label: label || 'Current location' },
        selectedService: primary
          ? {
              serviceId: primary._id,
              name: primary.name,
              type: primary.type,
              phone: primary.phone,
            }
          : undefined,
        isSos: true,
        source: 'sos',
        contactsNotified: contacts.map((c) => ({
          contactId: c._id,
          name: c.name,
          phone: c.phone,
          notifiedAt: new Date(),
        })),
        statusHistory: [
          {
            status: 'request_sent',
            note: 'SOS activated by user',
            at: new Date(),
          },
        ],
      });

      // Simulated progression toward notified status for MVP tracking UX
      pushStatus(request, 'service_notified', primary ? `Notified ${primary.name}` : 'No nearby service found');
      await request.save();

      res.status(201).json({
        request,
        analysis,
        nearbyServices: nearby.slice(0, 6),
        fallbackNumbers: {
          medical: '108 / 102',
          police: '100',
          fire: '101',
          note: 'If services cannot be reached through AILEA, call these numbers directly.',
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'SOS activation failed', error: error.message });
    }
  }
);

router.get('/status/:id', protect, async (req, res) => {
  try {
    const request = await EmergencyRequest.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    // Demo auto-progress for active SOS/requests (not cancelled/completed)
    if (!['cancelled', 'completed'].includes(request.status)) {
      const ageMs = Date.now() - new Date(request.updatedAt).getTime();
      const idx = STATUS_FLOW.indexOf(request.status);
      if (idx >= 0 && idx < STATUS_FLOW.length - 1 && ageMs > 20_000) {
        pushStatus(request, STATUS_FLOW[idx + 1], 'Status updated');
        await request.save();
      }
    }

    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch status', error: error.message });
  }
});

router.put('/cancel/:id', protect, async (req, res) => {
  try {
    const request = await EmergencyRequest.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }
    if (['completed', 'cancelled'].includes(request.status)) {
      return res.status(400).json({ message: `Request already ${request.status}` });
    }

    pushStatus(request, 'cancelled', 'Cancelled by user');
    await request.save();
    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: 'Unable to cancel request', error: error.message });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.type) filter.emergencyType = req.query.type;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    const history = await EmergencyRequest.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch history', error: error.message });
  }
});

router.post(
  '/request',
  protect,
  body('emergencyType').isIn(['medical', 'security', 'fire', 'general']),
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { emergencyType, description = '', lat, lng, label, serviceId } = req.body;
      let selectedService;

      if (serviceId) {
        const service = await EmergencyService.findById(serviceId);
        if (service) {
          selectedService = {
            serviceId: service._id,
            name: service.name,
            type: service.type,
            phone: service.phone,
          };
        }
      }

      const request = await EmergencyRequest.create({
        userId: req.user._id,
        emergencyType,
        description,
        location: { lat, lng, label },
        selectedService,
        source: 'manual',
        statusHistory: [{ status: 'request_sent', note: 'Help requested', at: new Date() }],
      });

      res.status(201).json({ request });
    } catch (error) {
      res.status(500).json({ message: 'Unable to create request', error: error.message });
    }
  }
);

module.exports = router;
