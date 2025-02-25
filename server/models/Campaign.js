const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  trackingUrl: { type: String, required: true },
  payoutRate: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['active', 'paused'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Campaign', campaignSchema);