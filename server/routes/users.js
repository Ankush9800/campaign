const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Remove all auth middleware
router.post('/', async (req, res) => { // Removed isAdmin middleware
  try {
    const { phone, upiId, campaignId } = req.body;
    
    if (!phone || !upiId || !campaignId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOneAndUpdate(
      { phone, campaignId },
      { $set: { upiId } },
      { upsert: true, new: true }
    );

    res.status(201).json(user);
  } catch (err) {
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