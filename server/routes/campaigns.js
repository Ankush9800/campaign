const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const authController = require('../controllers/authController'); // Import authController
const mongoose = require('mongoose');

// Get all campaigns - now fetches from the database
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create campaign (admin-only)
router.post('/', authController.isAdmin, async (req, res) => {
  try {
    // Create slug from name if not provided
    if (!req.body.slug) {
      req.body.slug = req.body.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + 
        '-' + Math.random().toString(36).substring(2, 8);
    }
    
    const campaign = new Campaign(req.body);
    await campaign.save();
    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update campaign - works with both ID and slug
router.put('/:identifier', async (req, res) => {
  try {
    let campaign;
    
    // Check if the identifier is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      campaign = await Campaign.findByIdAndUpdate(
        req.params.identifier,
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      // If not a valid ObjectId, treat as slug
      campaign = await Campaign.findOneAndUpdate(
        { slug: req.params.identifier },
        req.body,
        { new: true, runValidators: true }
      );
    }

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete campaign - works with both ID and slug
router.delete('/:identifier', async (req, res) => {
  try {
    let campaign;
    
    // Check if the identifier is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      campaign = await Campaign.findByIdAndDelete(req.params.identifier);
    } else {
      // If not a valid ObjectId, treat as slug
      campaign = await Campaign.findOneAndDelete({ slug: req.params.identifier });
    }
    
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET single campaign - works with both ID and slug
router.get('/:identifier', async (req, res) => {
  try {
    let campaign;
    
    // Check if the identifier is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(req.params.identifier)) {
      campaign = await Campaign.findById(req.params.identifier);
    } else {
      // If not a valid ObjectId, treat as slug
      campaign = await Campaign.findOne({ slug: req.params.identifier });
    }
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Add a status flag for inactive/paused campaigns
    const response = campaign.toObject();
    response.isActive = campaign.status === 'active';
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;