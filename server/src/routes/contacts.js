const express = require('express');
const { body, validationResult } = require('express-validator');
const EmergencyContact = require('../models/EmergencyContact');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ userId: req.user._id }).sort({
      priority: 1,
      createdAt: -1,
    });
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch contacts', error: error.message });
  }
});

router.post(
  '/',
  protect,
  body('name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const contact = await EmergencyContact.create({
        userId: req.user._id,
        name: req.body.name,
        phone: req.body.phone,
        relationship: req.body.relationship || 'Other',
        priority: req.body.priority || 1,
        notifyOnSos: req.body.notifyOnSos !== false,
      });

      res.status(201).json({ contact });
    } catch (error) {
      res.status(500).json({ message: 'Unable to create contact', error: error.message });
    }
  }
);

router.put('/:id', protect, async (req, res) => {
  try {
    const contact = await EmergencyContact.findOne({ _id: req.params.id, userId: req.user._id });
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const fields = ['name', 'phone', 'relationship', 'priority', 'notifyOnSos'];
    for (const field of fields) {
      if (req.body[field] !== undefined) contact[field] = req.body[field];
    }
    await contact.save();
    res.json({ contact });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update contact', error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const contact = await EmergencyContact.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete contact', error: error.message });
  }
});

module.exports = router;
