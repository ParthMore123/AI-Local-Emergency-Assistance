const express = require('express');
const EmergencyService = require('../models/EmergencyService');
const { protect } = require('../middleware/auth');
const { enrichWithDistance } = require('../services/geo');

const router = express.Router();

router.get('/nearby', protect, async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query params are required' });
    }

    const filter = {};
    if (req.query.type) {
      const types = String(req.query.type)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (types.length) filter.type = { $in: types };
    }
    if (req.query.availability) {
      filter.availability = req.query.availability;
    }

    const services = await EmergencyService.find(filter).limit(100);
    const radiusKm = Number(req.query.radiusKm) || 25;
    const results = enrichWithDistance(services, lat, lng).filter((s) => s.distanceKm <= radiusKm);

    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch nearby services', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const service = await EmergencyService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    let payload = service.toObject();

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      payload = enrichWithDistance([service], lat, lng)[0];
    }

    res.json({ service: payload });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch service', error: error.message });
  }
});

module.exports = router;
