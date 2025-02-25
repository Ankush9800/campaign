const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST - Create or update user
router.post('/', async (req, res) => {
  try {
    const { phone, upiId, campaignId } = req.body;

    // Validate inputs
    if (!phone || !upiId || !campaignId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Upsert: Update UPI ID if same user (same phone + campaign), else create new
    const user = await User.findOneAndUpdate(
      { phone, campaignId }, // Query: Unique combination of phone + campaign
      { $set: { upiId } },    // Update: Set new UPI ID
      { upsert: true, new: true } // Options: Create if not found
    );

    res.status(201).json(user);
  } catch (err) {
    console.error('Error:', err.message);

    // Handle duplicate key errors for other fields (if any)
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