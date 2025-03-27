const mongoose = require('mongoose');

const ConversionSchema = new mongoose.Schema({
    clickId: { type: String, unique: true },
    affClickId: { type: String },
    phone: String,
    upiId: String,
    status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
    payout: Number,
    offerId: String,
    offerName: String,
    campaignName: String,
    ip: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: { type: String, default: 'hiqmobi' },
    processedAt: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversion', ConversionSchema);
