const express = require('express');
const { authVendor } = require('../middleware/authVendor');
const Vendor = require('../models/Vendor');
const VendorListing = require('../models/VendorListing');
const VendorPayout = require('../models/VendorPayout');
const ServiceRequest = require('../models/ServiceRequest');

const router = express.Router();

router.get('/me', authVendor, async (req, res) => {
    const vendor = await Vendor.findById(req.vendor.vendorId).select('-password');
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const obj = vendor.toObject();
    obj.id = obj._id;
    obj.serviceCategory = Array.isArray(obj.serviceCategories) ? obj.serviceCategories[0] : null;
    res.json(obj);
});

router.get('/listings', authVendor, async (req, res) => {
    const listings = await VendorListing.find({ vendor: req.vendor.vendorId }).sort({ createdAt: -1 });
    const normalized = listings.map((l) => {
        const obj = l.toObject();
        obj.priceFrom = obj.priceMin;
        obj.priceTo = obj.priceMax;
        obj.serviceCategory = obj.category;
        return obj;
    });
    res.json({ listings: normalized });
});

router.post('/listings', authVendor, async (req, res) => {
    const { category, serviceCategory, title, description, details, city, priceMin, priceMax, priceFrom, priceTo, isActive } = req.body || {};

    const resolvedCategory = (category || serviceCategory);
    const resolvedPriceMin = priceMin !== undefined ? priceMin : priceFrom;
    const resolvedPriceMax = priceMax !== undefined ? priceMax : priceTo;

    if (!resolvedCategory || !title) {
        return res.status(400).json({ error: 'category and title are required' });
    }

    if (!city) {
        return res.status(400).json({ error: 'city is required' });
    }

    const listing = new VendorListing({
        vendor: req.vendor.vendorId,
        category: String(resolvedCategory).toLowerCase().trim(),
        title,
        description: description ?? details,
        city,
        priceMin: resolvedPriceMin,
        priceMax: resolvedPriceMax,
        isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    await listing.save();
    const obj = listing.toObject();
    obj.priceFrom = obj.priceMin;
    obj.priceTo = obj.priceMax;
    obj.serviceCategory = obj.category;
    res.status(201).json({ message: 'Listing created', listing: obj });
});

router.put('/listings/:id', authVendor, async (req, res) => {
    const { id } = req.params;

    const update = { ...req.body };
    if (update.serviceCategory && !update.category) update.category = update.serviceCategory;
    if (update.category) update.category = String(update.category).toLowerCase().trim();
    if (update.details && update.description === undefined) update.description = update.details;
    if (update.priceFrom !== undefined && update.priceMin === undefined) update.priceMin = update.priceFrom;
    if (update.priceTo !== undefined && update.priceMax === undefined) update.priceMax = update.priceTo;

    const listing = await VendorListing.findOneAndUpdate(
        { _id: id, vendor: req.vendor.vendorId },
        update,
        { new: true }
    );

    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    const obj = listing.toObject();
    obj.priceFrom = obj.priceMin;
    obj.priceTo = obj.priceMax;
    obj.serviceCategory = obj.category;
    res.json({ message: 'Listing updated', listing: obj });
});

router.delete('/listings/:id', authVendor, async (req, res) => {
    const { id } = req.params;
    const deleted = await VendorListing.findOneAndDelete({ _id: id, vendor: req.vendor.vendorId });
    if (!deleted) return res.status(404).json({ error: 'Listing not found' });
    res.json({ message: 'Listing deleted' });
});

router.get('/payout', authVendor, async (req, res) => {
    const payout = await VendorPayout.findOne({ vendor: req.vendor.vendorId });
    if (!payout) return res.json({ payout: null });
    const obj = payout.toObject();
    obj.status = obj.verificationStatus;
    res.json({ payout: obj });
});

router.post('/payout', authVendor, async (req, res) => {
    const {
        accountHolderName,
        accountNumber,
        ifsc,
        bankName,
        branch,
        upiId
    } = req.body || {};

    const payout = await VendorPayout.findOneAndUpdate(
        { vendor: req.vendor.vendorId },
        {
            vendor: req.vendor.vendorId,
            accountHolderName,
            accountNumber,
            ifsc,
            bankName,
            branch,
            upiId,
            verificationStatus: 'UNVERIFIED',
            verifiedAt: null,
            verifiedBy: null
        },
        { upsert: true, new: true }
    );

    const obj = payout.toObject();
    obj.status = obj.verificationStatus;
    res.json({ message: 'Payout details saved', payout: obj });
});

router.get('/requests', authVendor, async (req, res) => {
    const requests = await ServiceRequest.find({ vendor: req.vendor.vendorId }).sort({ createdAt: -1 });
    res.json({ requests });
});

module.exports = router;
