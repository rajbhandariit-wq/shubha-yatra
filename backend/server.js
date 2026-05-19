require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./src/models');

const authRoutes = require('./src/routes/auth');
const customerRoutes = require('./src/routes/customer');
const providerRoutes = require('./src/routes/provider');
const adminRoutes = require('./src/routes/admin');
const paymentRoutes = require('./src/routes/payment');
const billingRoutes = require('./src/routes/billing');
const notificationRoutes = require('./src/routes/notifications');
const driverRoutes        = require('./src/routes/driver');
const { getPublicTracking } = require('./src/controllers/driverController');
const { start: startScheduler } = require('./src/jobs/payoutScheduler');
const { start: startCleanup } = require('./src/jobs/scheduleCleanup');

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/driver', driverRoutes);
app.get('/api/track/:scheduleId', getPublicTracking);

app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'Shubha Yatra API' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Database synced');
  startScheduler();
  startCleanup();
  app.listen(PORT, () => console.log(`🚌 Shubha Yatra API running on port ${PORT}`));
}).catch(err => {
  console.error('❌ DB connection error:', err.message);
  console.error(err)
  process.exit(1);
});
