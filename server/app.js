const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const { clientUrl, uploadsDir } = require('./config');
const { seedIfNeeded } = require('../models/seed');
const authRoutes = require('../routes/authRoutes');
const menuRoutes = require('../routes/menuRoutes');
const orderRoutes = require('../routes/orderRoutes');
const customerRoutes = require('../routes/customerRoutes');
const routeRoutes = require('../routes/routeRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const uploadRoutes = require('../routes/uploadRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const areasRoutes = require('../routes/areasRoutes');
const promotionsRoutes = require('../routes/promotionsRoutes');
const settingsRoutes = require('../routes/settingsRoutes');
const adminRoutes = require('../routes/adminRoutes');

const app = express();

seedIfNeeded();

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
app.use((error, req, res, next) => {
  const status = error.status || 500;
  res.status(status).json({ message: error.message || 'Server error' });
});

module.exports = app;
