const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Payout = require('../models/Payout');
const hiqmobiService = require('../services/hiqmobiService');
const admin = require('../middleware/admin');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Conversion = require('../models/Conversion');

// Admin login route - no middleware protection
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login successful',
      token,
      user: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin logout route - no middleware protection
router.post('/logout', (req, res) => {
  // Since we're using JWT, we don't need to do anything server-side
  res.json({ message: 'Logged out successfully' });
});

// Protect all routes below with admin middleware
router.use(admin);

// Verify admin token
router.get('/verify', (req, res) => {
  // If we get here, the admin middleware has already verified the token
  res.json({ verified: true });
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Get total payouts from conversions
    const totalPayoutsResult = await Conversion.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$payout' } } }
    ]);
    const totalPayouts = totalPayoutsResult[0]?.total || 0;

    // Get unique active users (users with completed conversions in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsersResult = await Conversion.distinct('phone', {
      status: 'completed',
      created_at: { $gte: thirtyDaysAgo }
    });
    const activeUsers = activeUsersResult.length;

    // Get average payout
    const avgPayoutResult = await Conversion.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$payout' } } }
    ]);
    const avgPayout = avgPayoutResult[0]?.avg || 0;

    res.json({
      totalPayouts,
      activeUsers,
      avgPayout
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get HiQmobi conversions with pagination
router.get('/conversions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    const conversions = await hiqmobiService.fetchConversions({
      page,
      limit,
      status,
      startDate,
      endDate
    });
    
    // Get stats for these conversions
    const stats = {
      total: conversions.length,
      completed: conversions.filter(c => c.status === 'completed').length,
      pending: conversions.filter(c => c.status === 'pending').length,
      rejected: conversions.filter(c => c.status === 'rejected').length,
      totalPayout: conversions.reduce((sum, c) => sum + (c.payout || 0), 0)
    };
    
    res.json({
      conversions,
      stats,
      page,
      limit
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversions' });
  }
});

// Get user's process details
router.get('/user/:phone/processes', async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    const processDetails = await hiqmobiService.getUserProcessDetails(phone);
    res.json(processDetails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user process details' });
  }
});

// Manually process new conversions
router.post('/process-conversions', async (req, res) => {
  try {
    const { instantPayments } = req.body;
    
    const newConversions = await Conversion.find({ status: 'pending' });
    
    for (const conversion of newConversions) {
      const user = await User.findOne({ phone: conversion.phone });
      if (user) {
        conversion.userId = user._id;
        conversion.status = 'completed';
        await conversion.save();

        if (instantPayments) {
          await Payout.create({
            user: user._id,
            amount: conversion.payout,
            conversion: conversion._id,
            status: 'pending'
          });
        }
      }
    }

    res.json({ 
      message: 'Conversion processing completed',
      processed: newConversions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payout history with conversion details
router.get('/payouts', async (req, res) => {
  try {
    const payouts = await Payout.find()
      .populate('user')
      .sort({ createdAt: -1 })
      .limit(100);
    
    // Include conversion information for each payout
    const payoutsWithDetails = payouts.map(payout => {
      const payoutObject = payout.toObject();
      
      // Add summary of conversion data if available
      if (payout.source && payout.source.startsWith('hiqmobi') && payout.conversionData) {
        payoutObject.conversionSummary = {
          offerId: payout.conversionData.offer_id,
          offerName: payout.conversionData.offer_name,
          status: payout.conversionData.status,
          timestamp: payout.conversionData.created_at
        };
      }
      
      return payoutObject;
    });
    
    res.json(payoutsWithDetails);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts data' });
  }
});

// HiQmobi proxy endpoint
router.get('/hiqmobi/conversions', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const API_TOKEN = process.env.HIQMOBI_API_TOKEN || '15t01kbcjzi35of3ua1j55eilvpkwtboqi6i';
    
    console.log(`Fetching real HiQmobi data with token ${API_TOKEN.substring(0, 5)}...`);
    console.log(`Request params: page=${page}, limit=${limit}, status=${status || 'all'}`);
    
    const apiUrl = `https://api.hiqmobi.com/api/conversion`;
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, {
      params: {
        api_token: API_TOKEN,
        page,
        limit,
        ...(status && { status })
      }
    });

    console.log(`HiQmobi API response status: ${response.status}`);
    console.log(`HiQmobi API response success: ${response.data?.success}`);
    console.log(`HiQmobi API data count: ${response.data?.data?.length || 0}`);
    
    if (response.data && Array.isArray(response.data.data)) {
      // Log sample data to understand the structure
      if (response.data.data.length > 0) {
        console.log('Sample conversion data:', JSON.stringify(response.data.data[0], null, 2));
      }
      
      // Format the conversion data
      const formattedData = response.data.data
        .filter(conv => conv.clickid || conv.id) // Accept either clickid or id field
        .map(conv => ({
          id: conv.clickid || conv.id || 'unknown',
          phone: conv.p1 || conv.phone || 'unknown',
          upi_id: conv.p2 || conv.upi_id || '',
          p3: conv.p3 || '', // Add campaign name from p3 parameter
          status: conv.status || 'pending',
          payout: conv.payout || 100,
          offer_id: conv.offerid || conv.offer_id || 0,
          offer_name: conv.goalName || conv.offer_name || 'Unknown Offer',
          ip: conv.ip || '',
          created_at: conv.created_at || new Date().toISOString()
        }));

      console.log(`Formatted ${formattedData.length} conversions from HiQmobi API`);
      
      // Store conversions in MongoDB for tracking
      let storedCount = 0;
      for (const conv of formattedData) {
        try {
          await Conversion.findOneAndUpdate(
            { clickId: conv.id },
            {
              phone: conv.phone,
              upiId: conv.upi_id,
              campaignName: conv.p3,
              status: conv.status,
              payout: conv.payout,
              offerId: conv.offer_id,
              offerName: conv.offer_name,
              ip: conv.ip,
              createdAt: conv.created_at
            },
            { upsert: true, new: true }
          );
          storedCount++;
        } catch (convError) {
          console.error('Error storing conversion:', convError);
        }
      }
      console.log(`Successfully stored/updated ${storedCount} conversions in database`);
      
      // Calculate stats
      const stats = {
        total: formattedData.length || 0,
        pending: formattedData.filter(c => c.status === 'pending').length || 0,
        completed: formattedData.filter(c => c.status === 'completed').length || 0,
        rejected: formattedData.filter(c => c.status === 'rejected').length || 0,
        totalPayout: formattedData.reduce((sum, c) => sum + (c.payout || 0), 0) || 0
      };
      
      res.json({
        data: formattedData,
        stats,
        page: parseInt(page),
        limit: parseInt(limit),
        stored: storedCount
      });
    } else {
      console.log('Invalid or empty response from HiQmobi API:', response.data);
      // Return empty array with default stats
      res.json({
        data: [],
        stats: {
          total: 0,
          pending: 0,
          completed: 0,
          rejected: 0,
          totalPayout: 0
        },
        page: parseInt(page),
        limit: parseInt(limit),
        message: 'No conversion data available from HiQmobi API'
      });
    }
  } catch (error) {
    console.error('HiQmobi API Error:', error.message);
    console.error('Error details:', error.response?.data || 'No error details available');
    
    // Return empty data with default stats
    res.json({ 
      data: [],
      stats: {
        total: 0,
        pending: 0,
        completed: 0,
        rejected: 0,
        totalPayout: 0
      },
      error: 'Failed to fetch conversions',
      message: error.message 
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    // Try to get real settings from the database
    // You'll need to create a Settings model and collection
    // For now, return a default configuration
    res.json({
      autoPayout: {
        enabled: process.env.AUTO_PAYOUT_ENABLED === 'true',
        minAmount: parseInt(process.env.AUTO_PAYOUT_MIN_AMOUNT || 10),
        maxDaily: parseInt(process.env.AUTO_PAYOUT_MAX_DAILY || 5000),
        scheduleTime: '14:00'
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.get('/cashfree-status', async (req, res) => {
  try {
    // Return real Cashfree configuration status
    // You'll need to implement actual Cashfree integration logic
    const isConfigured = !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
    
    res.json({
      isConfigured,
      lastUpdated: new Date().toISOString(),
      mode: process.env.NODE_ENV === 'production' ? 'PROD' : 'TEST'
    });
  } catch (error) {
    console.error('Error checking Cashfree status:', error);
    res.status(500).json({ error: 'Failed to check Cashfree status' });
  }
});

// Get conversions from MongoDB with pagination and filters
router.get('/db-conversions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;
    
    const skip = (page - 1) * limit;
    
    // Build query object
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: 'i' } },
        { upiId: { $regex: search, $options: 'i' } },
        { offerName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute the query
    const [conversions, totalCount] = await Promise.all([
      Conversion.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversion.countDocuments(query)
    ]);
    
    // Transform the data to match the client's expected format
    const formattedConversions = conversions.map(conv => ({
      id: conv.clickId,
      phone: conv.phone,
      upi_id: conv.upiId,
      p3: conv.campaignName,
      status: conv.status,
      payout: conv.payout,
      offer_id: conv.offerId,
      offer_name: conv.offerName,
      ip: conv.ip,
      created_at: conv.createdAt
    }));
    
    // Calculate stats
    const allConversions = await Conversion.find().lean();
    const stats = {
      total: totalCount || 0,
      pending: allConversions.filter(c => c.status === 'pending').length || 0,
      completed: allConversions.filter(c => c.status === 'completed').length || 0,
      rejected: allConversions.filter(c => c.status === 'rejected').length || 0,
      totalPayout: allConversions.reduce((sum, c) => sum + (c.payout || 0), 0) || 0
    };
    
    res.json({
      data: formattedConversions,
      stats,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      total: totalCount
    });
  } catch (error) {
    console.error('Error fetching conversions from MongoDB:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversions from database',
      message: error.message,
      data: [],
      stats: {
        total: 0,
        pending: 0,
        completed: 0,
        rejected: 0,
        totalPayout: 0
      }
    });
  }
});

module.exports = router;