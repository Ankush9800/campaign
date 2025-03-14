const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const campaignRoutes = require('./routes/campaigns');
const usersRouter = require('./routes/users');
const payoutRoutes = require('./routes/payouts');
const settingsRoutes = require('./routes/settings');

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://taskwalaoffer.netlify.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Body parsing middleware
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Log headers for API routes
  if (req.url.includes('/api/')) {
    console.log('Authorization:', req.headers.authorization ? `Bearer ${req.headers.authorization.split(' ')[1].substring(0, 10)}...` : 'None');
  }
  
  if (req.method !== 'GET') {
    console.log('Body:', typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2));
    if (req.rawBody) {
      console.log('Raw Body:', req.rawBody.toString());
    }
  }
  console.log('=== End Request ===\n');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRoutes);

// Admin routes (including login)
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n=== Error ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('=== End Error ===\n');
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Start server with MongoDB connection
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();