const mongoose = require('mongoose');

const howItWorksStepSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' }
});

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  offerId: { type: String, required: true },
  payout: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  description: String,
  requirements: [String],
  trackingUrl: { type: String, required: true },
  payoutRate: { type: Number, required: true, min: 0 },
  shareUrl: { type: String },
  details: { type: String },
  imageUrl: { type: String },
  slug: { type: String },
  howItWorks: {
    type: [howItWorksStepSchema],
    default: [
      { title: 'Enter your details', description: 'Fill in your mobile number and UPI ID' },
      { title: 'Complete offer requirements', description: 'Follow the instructions on the next page' },
      { title: 'Get paid', description: 'Receive your payout directly to your UPI ID' }
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate a share URL if one doesn't exist
campaignSchema.pre('save', function(next) {
  if (!this.shareUrl && this.trackingUrl) {
    // Create a shortened or formatted share URL based on the tracking URL
    this.shareUrl = this.trackingUrl;
  }
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);