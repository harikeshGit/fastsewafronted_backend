const express = require('express');
const Announcement = require('../models/Announcement');

const router = express.Router();

// List all announcements
router.get('/', async (req, res) => {
    try {
        const docs = await Announcement.find().sort({ createdAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch' });
    }
});

// Create announcement
router.post('/', async (req, res) => {
    try {
        const { title, message, active } = req.body;
        if (!title || !message) return res.status(400).json({ error: 'title and message required' });
        const doc = await Announcement.create({ title, message, active: Boolean(active) });
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create' });
    }
});

// Update announcement
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, active } = req.body;
        const doc = await Announcement.findByIdAndUpdate(id, { title, message, active }, { new: true });
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

// Delete announcement
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Announcement.findByIdAndDelete(id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

module.exports = router;
