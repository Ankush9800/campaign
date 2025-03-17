const express = require('express');
const router = express.Router();
const Payout = require('../models/Payout');
const User = require('../models/User');
const axios = require('axios');

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
    
    const payout = new Payout({
      user: userId,
      amount,
      paymentMethod,
      status: 'pending',
      source: 'manual'
    });
    
    await payout.save();
    
    // Update the user's payoutStatus to 'processing'
    await User.findByIdAndUpdate(userId, { payoutStatus: 'processing' });
    
    res.status(201).json(payout);
  } catch (err) {
    console.error('Error creating payout:', err);
    res.status(500).json({ error: 'Server error' });
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
router.put('/:payoutId/reject', async (req, res) => {
  try {
    const { payoutId } = req.params;
    
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
    
    // Update user's payout status if needed
    await User.findByIdAndUpdate(payout.user, { 
      payoutStatus: 'rejected',
      lastPayoutRejectionReason: req.body.reason || 'Rejected by admin'
    });
    
    res.json({ success: true, payout });
  } catch (err) {
    console.error('Error rejecting payout:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;