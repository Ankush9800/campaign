const express = require('express');
const router = express.Router();
const Payout = require('../models/Payout');
const User = require('../models/User');
const axios = require('axios');
const mongoose = require('mongoose');

// Get all payouts
router.get('/', async (req, res) => {
  try {
    const payouts = await Payout.find().populate('user', 'phone upiId');
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create payout request
router.post('/', async (req, res) => {
  try {
    const { userId, amount, paymentMethod } = req.body;
    
    if (!userId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // First check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate a unique ID for manual payouts to avoid duplicate key errors
    const uniqueId = `manual_${new Date().getTime()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const payout = new Payout({
      user: userId,
      amount,
      paymentMethod,
      status: 'pending',
      source: 'manual',
      conversionId: uniqueId // Add a unique conversion ID for each manual payout
    });
    
    await payout.save();
    
    // Try to update the user's status
    try {
      await User.findByIdAndUpdate(userId, { payoutStatus: 'processing' });
    } catch (userError) {
      console.error('Error updating user status:', userError);
      // Continue even if user update fails
    }
    
    res.status(201).json(payout);
  } catch (err) {
    console.error('Error creating payout:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Process automatic payout
router.post('/auto-process', async (req, res) => {
  try {
    const { payoutId } = req.body;
    
    const payout = await Payout.findById(payoutId).populate('user');
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }
    
    if (payout.status === 'paid') {
      return res.status(400).json({ error: 'Payout already processed' });
    }
    
    // Here you would integrate with a payment gateway
    // This is a placeholder for the actual payment processing logic
    try {
      // Simulate successful payment
      const paymentSuccessful = true;
      
      if (paymentSuccessful) {
        payout.status = 'paid';
        payout.processedAt = Date.now();
        await payout.save();
        
        // Update user's payout status
        await User.findByIdAndUpdate(payout.user._id, { payoutStatus: 'paid' });
        
        return res.json({ success: true, payout });
      } else {
        return res.status(400).json({ error: 'Payment failed' });
      }
    } catch (paymentError) {
      return res.status(500).json({ error: 'Payment gateway error', details: paymentError.message });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Process manual payout
router.post('/manual-process', async (req, res) => {
  try {
    const { payoutId, transactionId } = req.body;
    
    if (!payoutId || !transactionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }
    
    if (payout.status === 'paid') {
      return res.status(400).json({ error: 'Payout already processed' });
    }
    
    // Update payout status
    payout.status = 'paid';
    payout.transactionId = transactionId;
    payout.processedAt = Date.now();
    await payout.save();
    
    // Update user's payout status
    await User.findByIdAndUpdate(payout.user, { payoutStatus: 'paid' });
    
    res.json({ success: true, payout });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject payout
router.post('/:payoutId/reject', async (req, res) => {
  try {
    const { payoutId } = req.params;
    
    if (!payoutId || !mongoose.Types.ObjectId.isValid(payoutId)) {
      return res.status(400).json({ error: 'Invalid payout ID format' });
    }
    
    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }
    
    if (payout.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Only pending payouts can be rejected',
        currentStatus: payout.status
      });
    }
    
    // Update payout status
    payout.status = 'rejected';
    payout.rejectedAt = Date.now();
    payout.rejectionReason = req.body.reason || 'Rejected by admin';
    await payout.save();
    
    // Check if the user exists before updating
    if (payout.user) {
      try {
        const user = await User.findById(payout.user);
        if (user) {
          user.payoutStatus = 'rejected';
          user.lastPayoutRejectionReason = req.body.reason || 'Rejected by admin';
          await user.save();
        } else {
          console.warn(`User not found for payout ${payoutId}. User ID: ${payout.user}`);
        }
      } catch (userError) {
        console.error('Error updating user after payout rejection:', userError);
        // Continue even if user update fails
      }
    } else {
      console.warn(`No user associated with payout ${payoutId}`);
    }
    
    res.json({ success: true, payout });
  } catch (err) {
    console.error('Error rejecting payout:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;