const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/admin');
const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    key: String,
    value: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now }
});

const Setting = mongoose.model('Setting', SettingSchema);

router.get('/', async (req, res) => {
    try {
        const settings = await Setting.find();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/', adminAuth, async (req, res) => {
    try {
        const { key, value } = req.body;
        const setting = await Setting.findOneAndUpdate(
            { key },
            { key, value, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
