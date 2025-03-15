const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  referralAmount: {
    type: Number,
    default: 10 // Default ₹10 per successful referral
  },
  payoutSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    minAmount: {
      type: Number,
      default: 10
    },
    maxDaily: {
      type: Number,
      default: 5000
    },
    scheduleTime: {
      type: String,
      default: '14:00'
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', SettingsSchema); 