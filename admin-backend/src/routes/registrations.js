const express = require('express');
const Registration = require('../models/Registration');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();

// Get all registrations (admin only)
router.get('/', requireAdmin, async (req, res) => {
    try {
        const registrations = await Registration.find().sort({ createdAt: -1 });
        res.json(registrations);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

// Create registration (public)
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, address, serviceInterest } = req.body;
        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'name, email, and phone required' });
        }
        const registration = await Registration.create({ name, email, phone, address, serviceInterest });
        res.status(201).json(registration);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: 'Failed to create registration' });
    }
});

// Delete registration (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const registration = await Registration.findByIdAndDelete(req.params.id);
        if (!registration) return res.status(404).json({ error: 'Not found' });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete registration' });
    }
});

module.exports = router;
