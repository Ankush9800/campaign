const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  upiId: { type: String, required: true },
  campaignId: { type: String, required: true },
  payoutStatus: { type: String, default: 'pending' }, // Add this field
  // Add other fields if needed
});

// Compound unique index: One user per phone + campaign
userSchema.index({ phone: 1, campaignId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);