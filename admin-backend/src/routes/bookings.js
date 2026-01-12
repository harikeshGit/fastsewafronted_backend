const express = require('express');
const Booking = require('../models/Booking');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all bookings (admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Create booking (public)
router.post('/', async (req, res) => {
    try {
        const { clientName, service, phone, email, description } = req.body;
        if (!clientName || !service || !phone) {
            return res.status(400).json({ error: 'clientName, service, and phone required' });
        }
        const booking = await Booking.create({ clientName, service, phone, email, description });
        res.status(201).json(booking);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Update booking status (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!booking) return res.status(404).json({ error: 'Not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// Delete booking (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Not found' });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});

module.exports = router;
