const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const Campaign = require('../models/Campaign');
const Settings = require('../models/Settings');
const Conversion = require('../models/Conversion');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../middleware/authenticate');

// Generate a short, unique referral code
function generateReferralCode() {
  // Create a shorter ID using first 8 chars of UUID + timestamp
  const shortId = uuidv4().split('-')[0];
  const timestamp = Date.now().toString(36).slice(-4);
  return `${shortId}${timestamp}`;
}

// Create a new referral link
router.post('/generate', async (req, res) => {
  try {
    const { referrerId, campaignId } = req.body;
    
    if (!referrerId || !campaignId) {
      return res.status(400).json({ message: 'Referrer ID and Campaign ID are required' });
    }

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Use campaign's referral amount instead of global settings
    const referralAmount = campaign.referralAmount || 0;
    
    // Generate a unique referral code
    const referralCode = generateReferralCode();
    
    // Create the referral record
    const newReferral = await Referral.create({
      referrerId,
      campaignId,
      referralCode,
      amount: referralAmount
    });
    
    // Return the referral details
    return res.status(201).json({
      referral: {
        id: newReferral._id,
        referralCode: newReferral.referralCode,
        amount: newReferral.amount,
        campaignId: newReferral.campaignId,
        campaignName: campaign.name,
        referralLink: `${req.protocol}://${req.get('host')}/campaigns/${campaign.slug || campaign._id}?ref=${referralCode}`
      }
    });
  } catch (error) {
    console.error('Error generating referral:', error);
    return res.status(500).json({ message: 'Failed to generate referral link', error: error.message });
  }
});

// Track referral click
router.get('/track/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;
    const { userId } = req.query; // User who clicked (optional)
    
    // Find the referral
    const referral = await Referral.findOne({ referralCode });
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }
    
    // Increment click count
    referral.clickCount += 1;
    
    // If user ID is provided, track this specific user
    if (userId && userId !== referral.referrerId) { // Don't track if user clicks their own referral
      // Check if this user already exists in the referredUsers array
      const existingUser = referral.referredUsers.find(u => u.userId === userId);
      
      if (!existingUser) {
        // Add new referred user
        referral.referredUsers.push({
          userId,
          status: 'clicked',
          createdAt: new Date()
        });
      }
    }
    
    await referral.save();
    
    // Get campaign info
    const campaign = await Campaign.findById(referral.campaignId);
    
    // Return redirect URL to campaign
    return res.status(200).json({
      redirectUrl: `/campaigns/${campaign.slug || campaign._id}`,
      campaignId: campaign._id,
      campaignName: campaign.name
    });
  } catch (error) {
    console.error('Error tracking referral:', error);
    return res.status(500).json({ message: 'Failed to track referral', error: error.message });
  }
});

// Update conversion from referral
router.post('/conversion', async (req, res) => {
  try {
    const { referralCode, userId, conversionId } = req.body;
    
    if (!referralCode || !userId || !conversionId) {
      return res.status(400).json({ message: 'Referral code, user ID, and conversion ID are required' });
    }
    
    // Find the referral
    const referral = await Referral.findOne({ referralCode });
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }
    
    // Find the referred user
    const userIndex = referral.referredUsers.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      // Add user if not found
      referral.referredUsers.push({
        userId,
        conversionId,
        status: 'converted',
        createdAt: new Date()
      });
    } else {
      // Update existing user
      referral.referredUsers[userIndex].conversionId = conversionId;
      referral.referredUsers[userIndex].status = 'converted';
    }
    
    // Increment conversion count
    referral.conversionCount += 1;
    
    // Update total earned
    referral.totalEarned += referral.amount;
    
    await referral.save();
    
    return res.status(200).json({
      success: true,
      message: 'Referral conversion recorded successfully',
      referral
    });
  } catch (error) {
    console.error('Error recording referral conversion:', error);
    return res.status(500).json({ message: 'Failed to record referral conversion', error: error.message });
  }
});

// Get user's referrals
router.get('/user/:referrerId', async (req, res) => {
  try {
    const { referrerId } = req.params;
    
    const referrals = await Referral.find({ referrerId })
      .populate('campaignId', 'name slug imageUrl')
      .sort({ createdAt: -1 });
    
    // Format referrals with campaign details and stats
    const formattedReferrals = await Promise.all(referrals.map(async (referral) => {
      // Get the campaign
      const campaign = referral.campaignId;
      
      return {
        id: referral._id,
        referralCode: referral.referralCode,
        campaignId: campaign._id,
        campaignName: campaign.name,
        campaignImage: campaign.imageUrl,
        referralLink: `${req.protocol}://${req.get('host')}/campaigns/${campaign.slug || campaign._id}?ref=${referral.referralCode}`,
        clickCount: referral.clickCount,
        conversionCount: referral.conversionCount,
        amount: referral.amount,
        totalEarned: referral.totalEarned,
        createdAt: referral.createdAt
      };
    }));
    
    // Calculate total stats
    const totalClicks = referrals.reduce((sum, ref) => sum + ref.clickCount, 0);
    const totalConversions = referrals.reduce((sum, ref) => sum + ref.conversionCount, 0);
    const totalEarned = referrals.reduce((sum, ref) => sum + ref.totalEarned, 0);
    
    return res.status(200).json({
      referrals: formattedReferrals,
      stats: {
        totalReferrals: referrals.length,
        totalClicks,
        totalConversions,
        totalEarned,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Error fetching user referrals:', error);
    return res.status(500).json({ message: 'Failed to fetch referrals', error: error.message });
  }
});

// Admin route to get all referrals
router.get('/admin/all', authenticate, async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate('campaignId', 'name slug')
      .sort({ createdAt: -1 });
    
    return res.status(200).json(referrals);
  } catch (error) {
    console.error('Error fetching all referrals:', error);
    return res.status(500).json({ message: 'Failed to fetch referrals', error: error.message });
  }
});

// Admin route to update referral amount
router.post('/admin/settings', authenticate, async (req, res) => {
  try {
    const { referralAmount } = req.body;
    
    if (isNaN(referralAmount) || referralAmount < 0) {
      return res.status(400).json({ message: 'Valid referral amount is required' });
    }
    
    const settings = await Settings.getSettings();
    settings.referralAmount = referralAmount;
    settings.updatedAt = new Date();
    
    await settings.save();
    
    return res.status(200).json({
      message: 'Referral settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating referral settings:', error);
    return res.status(500).json({ message: 'Failed to update referral settings', error: error.message });
  }
});

module.exports = router; 