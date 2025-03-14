const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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
  origin: 'http://localhost:3000', // Frontend URL
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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
  createSampleCampaignsIfNone();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Connection URI:', process.env.MONGODB_URI ? 
    `${process.env.MONGODB_URI.substring(0, 20)}...` : 'MONGODB_URI is not defined');
  console.log('To fix this, ensure your IP address is whitelisted in MongoDB Atlas Network Access settings.');
});

// Function to create sample campaigns if none exist
async function createSampleCampaignsIfNone() {
  try {
    const Campaign = require('./models/Campaign');
    const campaignsCount = await Campaign.countDocuments();
    
    if (campaignsCount === 0) {
      console.log('No campaigns found in database, creating sample campaigns...');
      
      const sampleCampaigns = [
        {
          name: 'Amazon Gift Card Offer',
          description: 'Complete a short survey and get an Amazon gift card worth ₹500',
          trackingUrl: 'https://offers.example.com/amazon-gift',
          shareUrl: 'https://taskwala.in/offers/amazon',
          payoutRate: 150,
          status: 'active',
          details: '<p>Complete the following steps:</p><ol><li>Download the Amazon app</li><li>Sign up with a new account</li><li>Complete your profile</li></ol>'
        },
        {
          name: 'Paytm Cash Bonus',
          description: 'Sign up for Paytm and get instant ₹100 cash bonus',
          trackingUrl: 'https://offers.example.com/paytm-bonus',
          shareUrl: 'https://taskwala.in/offers/paytm',
          payoutRate: 120,
          status: 'active'
        },
        {
          name: 'PhonePe Referral',
          description: 'Refer a friend to PhonePe and earn ₹75 per successful referral',
          trackingUrl: 'https://offers.example.com/phonepe-refer',
          shareUrl: 'https://taskwala.in/offers/phonepe',
          payoutRate: 75,
          status: 'active'
        }
      ];
      
      await Campaign.insertMany(sampleCampaigns);
      console.log('Successfully created sample campaigns');
    }
  } catch (error) {
    console.error('Error creating sample campaigns:', error);
  }
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Auth endpoint available at http://localhost:${PORT}/api/auth/admin/login`);
});