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

// Debug: test DB connection and network
app.get('/api/debug', async (req, res) => {
  const result = { database: 'unknown', dns: 'unknown', host: '', dbUrl: '' };
  const dbUrl = process.env.DATABASE_URL || 'not set';
  result.dbUrl = dbUrl.replace(/\/\/[^:]+:([^@]+)@/, '//user:****@').substring(0, 100);
  result.host = dbUrl.match(/@([^:\/]+)/)?.[1] || 'unknown';
  try {
    const p = req.app.get('prisma');
    await p.$connect();
    await p.$queryRaw`SELECT 1 as connected`;
    const userCount = await p.user.count();
    result.database = 'connected';
    result.userCount = userCount;
  } catch (e) {
    result.database = 'error';
    result.message = e.message.substring(0, 200);
  }
  res.json(result);
});

// Routes
app.use('/api/auth', authRoutes);

// Seed endpoint (triggers seeding via HTTP to Vercel Postgres-compatible route)
app.post('/api/seed', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const p = req.app.get('prisma');
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Clean existing data
    await p.activityLog.deleteMany(); await p.sale.deleteMany(); await p.orderItem.deleteMany();
    await p.order.deleteMany(); await p.customer.deleteMany(); await p.staff.deleteMany();
    await p.inventoryItem.deleteMany(); await p.menuItem.deleteMany(); await p.menuCategory.deleteMany();
    await p.table.deleteMany(); await p.user.deleteMany();

    // Users
    const admin = await p.user.create({ data: { name:'Admin User', email:'admin@restaurant.com', password:hashedPassword, role:'admin', phone:'+1-555-0100' }});
    await p.user.create({ data: { name:'Sarah Manager', email:'sarah@restaurant.com', password:hashedPassword, role:'manager', phone:'+1-555-0101' }});
    await p.user.create({ data: { name:'John Waiter', email:'john@restaurant.com', password:hashedPassword, role:'staff', phone:'+1-555-0102' }});

    // Tables
    for (const t of [{number:1,capacity:2,location:'window'},{number:2,capacity:2,location:'window'},{number:3,capacity:4,location:'indoor'},{number:4,capacity:4,location:'indoor'},{number:5,capacity:6,location:'indoor'},{number:6,capacity:4,location:'outdoor'},{number:7,capacity:4,location:'outdoor'},{number:8,capacity:8,location:'indoor'},{number:9,capacity:2,location:'bar'},{number:10,capacity:6,location:'window'}])
      await p.table.create({ data: t });

    // Menu categories
    const cats = await Promise.all([
      p.menuCategory.create({ data:{name:'Appetizers',description:'Starters',sortOrder:1}}),
      p.menuCategory.create({ data:{name:'Main Course',description:'Entrees',sortOrder:2}}),
      p.menuCategory.create({ data:{name:'Pasta',description:'Pasta',sortOrder:3}}),
      p.menuCategory.create({ data:{name:'Beverages',description:'Drinks',sortOrder:4}}),
      p.menuCategory.create({ data:{name:'Desserts',description:'Sweets',sortOrder:5}}),
    ]);

    // Menu items
    const items = await Promise.all([
      p.menuItem.create({ data:{name:'Bruschetta',price:8.99,categoryId:cats[0].id,isPopular:true}}),
      p.menuItem.create({ data:{name:'Calamari',price:12.99,categoryId:cats[0].id,isPopular:true}}),
      p.menuItem.create({ data:{name:'Garlic Bread',price:5.99,categoryId:cats[0].id}}),
      p.menuItem.create({ data:{name:'Grilled Salmon',price:24.99,categoryId:cats[1].id,isPopular:true}}),
      p.menuItem.create({ data:{name:'Steak Frites',price:32.99,categoryId:cats[1].id}}),
      p.menuItem.create({ data:{name:'Chicken Parmesan',price:18.99,categoryId:cats[1].id,isPopular:true}}),
      p.menuItem.create({ data:{name:'Spaghetti Carbonara',price:16.99,categoryId:cats[2].id,isPopular:true}}),
      p.menuItem.create({ data:{name:'Fettuccine Alfredo',price:15.99,categoryId:cats[2].id}}),
      p.menuItem.create({ data:{name:'Soft Drink',price:2.99,categoryId:cats[3].id}}),
      p.menuItem.create({ data:{name:'Coffee',price:3.99,categoryId:cats[3].id}}),
      p.menuItem.create({ data:{name:'Tiramisu',price:8.99,categoryId:cats[4].id,isPopular:true}}),
      p.menuItem.create({ data:{name:'Panna Cotta',price:7.99,categoryId:cats[4].id}}),
    ]);

    // Staff
    await p.staff.create({ data:{name:'John Waiter',email:'john@restaurant.com',role:'waiter',shift:'morning',salary:32000}});
    await p.staff.create({ data:{name:'Maria Chef',role:'chef',shift:'evening',salary:48000}});
    await p.staff.create({ data:{name:'David Host',role:'host',shift:'morning',salary:28000}});

    // Inventory
    await p.inventoryItem.create({ data:{name:'Tomatoes',category:'produce',quantity:25,unit:'kg',minStock:10}});
    await p.inventoryItem.create({ data:{name:'Chicken Breast',category:'meat',quantity:15,unit:'kg',minStock:10}});
    await p.inventoryItem.create({ data:{name:'Lettuce',category:'produce',quantity:3,unit:'kg',minStock:5}});

    // Customers
    const [c1] = await Promise.all([
      p.customer.create({ data:{name:'Alice Johnson',email:'alice@email.com',totalVisits:15,totalSpent:450.5,lastVisit:new Date(),isVip:true}}),
      p.customer.create({ data:{name:'Bob Smith',email:'bob@email.com',totalVisits:8,totalSpent:210,lastVisit:new Date()}}),
      p.customer.create({ data:{name:'Carol Davis',email:'carol@email.com',totalVisits:22,totalSpent:890.75,lastVisit:new Date(),isVip:true}}),
    ]);

    // Sample orders
    for (let i = 0; i < 5; i++) {
      const subtotal = items[i].price * 2; const tax = subtotal * 0.05; const sc = subtotal * 0.10;
      await p.order.create({ data:{orderNumber:i+1,tableId:(await p.table.findFirst({where:{number:i+1}})).id,customerId:c1.id,userId:admin.id,status:'completed',type:'dine-in',subtotal,tax,serviceCharge:sc,total:subtotal+tax+sc,paymentMethod:'cash',paymentStatus:'paid',items:{create:[{menuItemId:items[i].id,quantity:2,unitPrice:items[i].price,subtotal:items[i].price*2}]}}});
    }

    res.json({ message: 'Database seeded successfully! Demo accounts: admin@restaurant.com / password123' });
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
