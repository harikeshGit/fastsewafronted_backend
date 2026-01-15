const express = require('express');
const { requireAdmin } = require('../middleware/requireAdmin');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

const router = express.Router();

// List all users (active + blocked)
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Block/Unblock user
router.patch('/users/:id/active', requireAdmin, async (req, res) => {
    try {
        const { isActive } = req.body || {};
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive must be a boolean' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            message: isActive ? 'User unblocked' : 'User blocked',
            user
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Delete user account
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('email');
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Best-effort cleanup of records that store customerEmail
        if (user.email) {
            await ServiceRequest.deleteMany({ customerEmail: String(user.email).toLowerCase().trim() });
        }

        await User.deleteOne({ _id: req.params.id });

        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
