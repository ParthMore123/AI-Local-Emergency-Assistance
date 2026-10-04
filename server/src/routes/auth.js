const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, signToken } = require('../middleware/auth');

const router = express.Router();

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return false;
  }
  return true;
}

router.post(
  '/register',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isString(),
  async (req, res) => {
    try {
      if (!handleValidation(req, res)) return;

      const { name, email, password, phone } = req.body;
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        phone,
        passwordHash,
      });

      const token = signToken(user._id);
      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          preferences: user.preferences,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed', error: error.message });
    }
  }
);

function sanitizeUser(user) {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.otp;
  return obj;
}

router.post(
  '/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    try {
      if (!handleValidation(req, res)) return;

      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!user.passwordHash) {
        if (user.email === 'demo@ailea.app') {
          user.passwordHash = await bcrypt.hash('demo1234', 10);
          await user.save();
        } else {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = signToken(user._id);
      res.json({
        token,
        user: sanitizeUser(user),
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  }
);

router.post(
  '/forgot-password',
  body('email').isEmail(),
  async (req, res) => {
    try {
      if (!handleValidation(req, res)) return;
      const user = await User.findOne({ email: req.body.email.toLowerCase() });

      // Always return success to avoid email enumeration
      if (!user) {
        return res.json({
          message: 'If an account exists, a reset OTP has been generated.',
          demoOtp: null,
        });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      user.otp = {
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
      await user.save();

      res.json({
        message: 'If an account exists, a reset OTP has been generated.',
        // Exposed only in development for local MVP testing
        demoOtp: process.env.NODE_ENV === 'production' ? null : code,
      });
    } catch (error) {
      res.status(500).json({ message: 'Unable to process request', error: error.message });
    }
  }
);

router.post(
  '/verify-otp',
  body('email').isEmail(),
  body('otp').isLength({ min: 4 }),
  body('newPassword').isLength({ min: 6 }),
  async (req, res) => {
    try {
      if (!handleValidation(req, res)) return;
      const { email, otp, newPassword } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user || !user.otp?.code || user.otp.code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
      if (user.otp.expiresAt < new Date()) {
        return res.status(400).json({ message: 'OTP expired' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.otp = undefined;
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'OTP verification failed', error: error.message });
    }
  }
);

router.get('/me', protect, async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

router.put(
  '/profile',
  protect,
  body('name').optional().trim().notEmpty(),
  body('phone').optional().isString(),
  async (req, res) => {
    try {
      if (!handleValidation(req, res)) return;
      const { name, phone, preferences, location } = req.body;
      if (name) req.user.name = name;
      if (phone !== undefined) req.user.phone = phone;
      if (preferences) {
        req.user.preferences = { ...(req.user.preferences || {}), ...preferences };
      }
      if (location?.lat != null && location?.lng != null) {
        req.user.location = {
          lat: location.lat,
          lng: location.lng,
          label: location.label || req.user.location?.label,
          updatedAt: new Date(),
        };
      }
      await req.user.save();
      res.json({ user: sanitizeUser(req.user) });
    } catch (error) {
      res.status(500).json({ message: 'Profile update failed', error: error.message });
    }
  }
);

module.exports = router;
