require('dotenv').config();
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
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

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

async function start() {
  await connectDB();
  const seedResult = await seedDatabase({ reset: false });
  if (seedResult.seeded) {
    console.log(`Seeded ${seedResult.services} emergency services + demo user`);
  }

  app.listen(PORT, () => {
    console.log(`AILEA API listening on http://localhost:${PORT}`);
    console.log('Demo login: demo@ailea.app / demo1234');
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
