const express = require('express');
const { requireAdmin } = require('../middleware/requireAdmin');
const Vendor = require('../models/Vendor');
const VendorPayout = require('../models/VendorPayout');

const router = express.Router();

router.get('/vendors', requireAdmin, async (req, res) => {
    const vendors = await Vendor.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ vendors });
});

router.post('/vendors/:id/approve', requireAdmin, async (req, res) => {
    const vendor = await Vendor.findByIdAndUpdate(
        req.params.id,
        {
            status: 'APPROVED',
            rejectionReason: null,
            approvedBy: req.adminUser._id,
            approvedAt: new Date()
        },
        { new: true }
    ).select('-password');

    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Vendor approved', vendor });
});

router.post('/vendors/:id/reject', requireAdmin, async (req, res) => {
    const { reason } = req.body || {};

    const vendor = await Vendor.findByIdAndUpdate(
        req.params.id,
        {
            status: 'REJECTED',
            rejectionReason: reason || 'Rejected by admin',
            approvedBy: null,
            approvedAt: null
        },
        { new: true }
    ).select('-password');

    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Vendor rejected', vendor });
});

router.post('/vendors/payouts/:payoutId/verify', requireAdmin, async (req, res) => {
    const payout = await VendorPayout.findByIdAndUpdate(
        req.params.payoutId,
        {
            verificationStatus: 'VERIFIED',
            verifiedBy: req.adminUser._id,
            verifiedAt: new Date()
        },
        { new: true }
    );

    if (!payout) return res.status(404).json({ error: 'Payout record not found' });
    res.json({ message: 'Payout verified', payout });
});

module.exports = router;
