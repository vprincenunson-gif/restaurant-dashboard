require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { PrismaClient } = require('@prisma/client');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const tableRoutes = require('./routes/tables');
const inventoryRoutes = require('./routes/inventory');
const staffRoutes = require('./routes/staff');
const customerRoutes = require('./routes/customers');
const saleRoutes = require('./routes/sales');
const analyticsRoutes = require('./routes/analytics');
const menuRoutes = require('./routes/menu');

const app = express();
const prisma = new PrismaClient();

// Make prisma available to routes
app.set('prisma', prisma);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);

// Seed endpoint (one-time use)
app.post('/api/seed', async (req, res) => {
  try {
    const { execSync } = require('child_process');
    execSync('node prisma/seed.js', { cwd: __dirname + '/..', env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }, stdio: 'pipe' });
    res.json({ message: 'Database seeded successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed', details: err.message });
  }
});
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/menu', menuRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
// Start server (only in non-serverless environments)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Restaurant Dashboard API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
