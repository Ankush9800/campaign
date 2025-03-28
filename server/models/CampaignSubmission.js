const mongoose = require('mongoose');

const campaignSubmissionSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        trim: true
    },
    upiId: {
        type: String,
        required: true,
        trim: true
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    campaignName: {
        type: String,
        required: true,
        trim: true
    },
    redirectUrl: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CampaignSubmission', campaignSubmissionSchema); 