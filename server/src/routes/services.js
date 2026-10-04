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

    let services = await EmergencyService.find(filter).limit(100);

    if (req.query.q) {
      const q = String(req.query.q).toLowerCase().trim();
      services = services.filter((s) => {
        const nameMatch = s.name && s.name.toLowerCase().includes(q);
        const addrMatch = s.address && s.address.toLowerCase().includes(q);
        const cityMatch = s.city && s.city.toLowerCase().includes(q);
        const typeMatch = s.type && s.type.toLowerCase().includes(q);
        const facilityMatch = Array.isArray(s.facilities) && s.facilities.some((f) => f.toLowerCase().includes(q));
        const descMatch = s.description && s.description.toLowerCase().includes(q);
        return nameMatch || addrMatch || cityMatch || typeMatch || facilityMatch || descMatch;
      });
    }

    const requestedRadius = req.query.radiusKm ? Number(req.query.radiusKm) : 60;
    const enriched = enrichWithDistance(services, lat, lng);
    let results = enriched.filter((s) => s.distanceKm <= requestedRadius);
    // If none within requested radius (e.g. state-level view), provide closest services
    if (results.length === 0 && enriched.length > 0) {
      results = enriched.slice(0, 10);
    }

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
