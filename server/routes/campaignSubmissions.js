const express = require('express');
const router = express.Router();
const CampaignSubmission = require('../models/CampaignSubmission');

// Create new submission
router.post('/', async (req, res) => {
    try {
        const submission = new CampaignSubmission(req.body);
        await submission.save();
        res.status(201).json(submission);
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ error: 'Failed to create submission' });
    }
});

// Get all submissions
router.get('/', async (req, res) => {
    try {
        const submissions = await CampaignSubmission.find().sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

module.exports = router; 