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

// Get all submissions with pagination and filters
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const search = req.query.search;
        
        const skip = (page - 1) * limit;
        
        // Build query object
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { phone: { $regex: search, $options: 'i' } },
                { upiId: { $regex: search, $options: 'i' } },
                { campaignName: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Execute query
        const [submissions, totalCount] = await Promise.all([
            CampaignSubmission.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            CampaignSubmission.countDocuments(query)
        ]);
        
        // Calculate stats
        const allSubmissions = await CampaignSubmission.find().lean();
        const stats = {
            total: totalCount,
            pending: allSubmissions.filter(s => s.status === 'pending').length,
            completed: allSubmissions.filter(s => s.status === 'completed').length,
            rejected: allSubmissions.filter(s => s.status === 'rejected').length
        };
        
        res.json({
            data: submissions,
            stats,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            total: totalCount
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Update submission status
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const submission = await CampaignSubmission.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json(submission);
    } catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({ error: 'Failed to update submission' });
    }
});

module.exports = router; 