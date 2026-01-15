const express = require('express');
const { requireAdmin } = require('../middleware/requireAdmin');
const Vendor = require('../models/Vendor');
const VendorPayout = require('../models/VendorPayout');
const VendorListing = require('../models/VendorListing');
const ServiceRequest = require('../models/ServiceRequest');

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

// Block/Unblock vendor
router.patch('/vendors/:id/active', requireAdmin, async (req, res) => {
    try {
        const { isActive } = req.body || {};
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive must be a boolean' });
        }

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

        res.json({
            message: isActive ? 'Vendor unblocked' : 'Vendor blocked',
            vendor
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update vendor status' });
    }
});

// Delete vendor account
router.delete('/vendors/:id', requireAdmin, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id).select('_id');
        if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

        await Promise.all([
            VendorListing.deleteMany({ vendor: vendor._id }),
            VendorPayout.deleteMany({ vendor: vendor._id }),
            ServiceRequest.updateMany({ vendor: vendor._id }, { $set: { vendor: null, status: 'NEW' } })
        ]);

        await Vendor.deleteOne({ _id: vendor._id });

        res.json({ message: 'Vendor deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete vendor' });
    }
});

module.exports = router;
