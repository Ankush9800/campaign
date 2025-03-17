const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Campaign = require('../models/Campaign');

// Create or update a user
router.post('/', async (req, res) => { 
  try {
    const { phone, upiId, campaignId } = req.body;
    
    if (!phone || !upiId || !campaignId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // First check if the campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const user = await User.findOneAndUpdate(
      { phone, campaignId },
      { $set: { upiId } },
      { upsert: true, new: true }
    );

    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating/updating user:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'User already exists for this campaign' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET - Retrieve all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// PATCH - Update a user's payout status
router.patch('/:userId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { payoutStatus: status },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// PATCH - Update a user's campaign
router.patch('/:userId/campaign', async (req, res) => {
  try {
    const { campaignId } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({ message: 'Campaign ID is required' });
    }
    
    // Verify that the campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { campaignId },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error updating user campaign:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE - Delete a user by ID
router.delete('/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;