const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  referrerId: {
    type: String,
    required: true, // Phone number or ID of user who referred
    index: true
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  upiId: {
    type: String,
    default: ''
  },
  referredUsers: [{
    userId: String, // Phone number or ID of referred user
    conversionId: String, // ID of the conversion if completed
    status: {
      type: String,
      enum: ['clicked', 'converted', 'paid'],
      default: 'clicked'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  clickCount: {
    type: Number,
    default: 0
  },
  conversionCount: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    default: 0 // This will be set from the global referral amount setting
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Referral', ReferralSchema); 