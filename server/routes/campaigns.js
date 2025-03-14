const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const authController = require('../controllers/authController'); // Import authController

// Get all campaigns
router.get('/', (req, res) => {
  // Return mock campaigns data
  res.json([
    {
      _id: '1',
      name: 'Test Campaign 1',
      description: 'This is a test campaign',
      trackingUrl: 'https://example.com/campaign1',
      payoutRate: 100,
      status: 'active'
    },
    {
      _id: '2',
      name: 'Test Campaign 2',
      description: 'This is another test campaign',
      trackingUrl: 'https://example.com/campaign2',
      payoutRate: 150,
      status: 'paused'
    }
  ]);
});

// Create campaign (admin-only)
router.post('/', authController.isAdmin, async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET single campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;