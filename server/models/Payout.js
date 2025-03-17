const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'paid', 'failed', 'rejected'], 
    default: 'pending' 
  },
  paymentMethod: { 
    type: String,
    enum: ['automatic', 'manual'],
    required: true 
  },
  transactionId: {
    type: String,
    sparse: true
  },
  processedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  // HiQmobi integration fields
  conversionId: {
    type: String,
    sparse: true,
    index: true
  },
  source: {
    type: String,
    enum: ['manual', 'hiqmobi', 'webhook'],
    default: 'manual'
  },
  conversionData: {
    type: mongoose.Schema.Types.Mixed
  },
  instantProcess: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create a compound index on source and conversionId to ensure uniqueness
payoutSchema.index({ source: 1, conversionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payout', payoutSchema);