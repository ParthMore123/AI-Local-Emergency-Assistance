const express = require('express');
const { body, validationResult } = require('express-validator');
const EmergencyService = require('../models/EmergencyService');
const { protect } = require('../middleware/auth');
const { classifyWithOptionalLLM, parseSearchIntent } = require('../services/aiClassifier');
const { enrichWithDistance } = require('../services/geo');

const router = express.Router();

router.post(
  '/analyze-emergency',
  protect,
  body('message').trim().notEmpty().withMessage('Emergency description is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const analysis = await classifyWithOptionalLLM(req.body.message);
      const lat = Number(req.body.lat);
      const lng = Number(req.body.lng);

      let nearby = [];
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const types = analysis.recommendedServices || [];
        const query = types.length ? { type: { $in: types } } : {};
        const services = await EmergencyService.find(query).limit(50);
        nearby = enrichWithDistance(services, lat, lng).slice(0, 8);
      }

      res.json({
        analysis,
        nearbyServices: nearby,
      });
    } catch (error) {
      res.status(500).json({ message: 'AI analysis failed', error: error.message });
    }
  }
);

router.post(
  '/search',
  protect,
  body('query').trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const intent = parseSearchIntent(req.body.query);
      const analysis = await classifyWithOptionalLLM(req.body.query);
      const lat = Number(req.body.lat);
      const lng = Number(req.body.lng);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({ message: 'lat and lng are required for search' });
      }

      const filter = {};
      if (intent.types?.length) {
        filter.type = { $in: intent.types };
      } else if (analysis.recommendedServices?.length) {
        filter.type = { $in: analysis.recommendedServices };
      }
      if (intent.openNow) {
        filter.availability = 'open';
      }

      const services = await EmergencyService.find(filter).limit(80);
      let results = enrichWithDistance(services, lat, lng);

      // Relevance: preferred types first, then distance
      if (intent.types?.length) {
        results = results.sort((a, b) => {
          const aScore = intent.types.includes(a.type) ? 0 : 1;
          const bScore = intent.types.includes(b.type) ? 0 : 1;
          if (aScore !== bScore) return aScore - bScore;
          return a.distanceKm - b.distanceKm;
        });
      }

      res.json({
        intent,
        analysis,
        results: results.slice(0, 20),
      });
    } catch (error) {
      res.status(500).json({ message: 'AI search failed', error: error.message });
    }
  }
);

module.exports = router;
