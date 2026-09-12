require('dotenv').config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'ailea_dev_jwt_secret_change_in_production';
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const { seedDatabase } = require('./seed/data');

const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const emergencyRoutes = require('./routes/emergency');
const servicesRoutes = require('./routes/services');
const contactsRoutes = require('./routes/contacts');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

let boot;
async function ensureReady() {
  if (!boot) {
    boot = (async () => {
      await connectDB();
      const seedResult = await seedDatabase({ reset: false });
      if (seedResult.seeded) {
        console.log(`Seeded ${seedResult.services} emergency services + demo user`);
      }
    })();
  }
  return boot;
}

app.use(async (_req, _res, next) => {
  try {
    await ensureReady();
    next();
  } catch (error) {
    next(error);
  }
});

app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  })
);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    product: 'AILEA',
    tagline: 'Help When Every Second Matters.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/contacts', contactsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = { app, ensureReady };
