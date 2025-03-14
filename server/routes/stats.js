const express = require('express');
const router = express.Router();
const Conversion = require('../models/Conversion');
const Campaign = require('../models/Campaign');

// Public stats endpoint for home page
router.get('/', async (req, res) => {
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
      createdAt: { $gte: thirtyDaysAgo }
    });
    const activeUsers = activeUsersResult.length;

    // Get average payout
    const avgPayoutResult = await Conversion.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$payout' } } }
    ]);
    const avgPayout = avgPayoutResult[0]?.avg || 0;

    // Get active campaigns count
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });

    res.json({
      totalPayouts,
      activeUsers,
      avgPayout,
      campaigns: activeCampaigns
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats', 
      totalPayouts: 0,
      activeUsers: 0,
      avgPayout: 0,
      campaigns: 0
    });
  }
});

module.exports = router; 