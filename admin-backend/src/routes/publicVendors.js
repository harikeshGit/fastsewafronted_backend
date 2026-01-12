const express = require('express');
const VendorListing = require('../models/VendorListing');
const Vendor = require('../models/Vendor');

const router = express.Router();

router.get('/vendors', async (req, res) => {
    const category = req.query.category ? String(req.query.category).toLowerCase().trim() : null;
    const city = req.query.city ? String(req.query.city).trim() : null;

    const match = { isActive: true };
    if (category) match.category = category;
    if (city) match.city = city;

    const results = await VendorListing.aggregate([
        { $match: match },
        {
            $lookup: {
                from: 'vendors',
                localField: 'vendor',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        { $unwind: '$vendor' },
        {
            $match: {
                'vendor.status': 'APPROVED',
                'vendor.isActive': true
            }
        },
        {
            $group: {
                _id: '$vendor._id',
                vendor: { $first: '$vendor' },
                listings: {
                    $push: {
                        _id: '$_id',
                        category: '$category',
                        title: '$title',
                        description: '$description',
                        city: '$city',
                        priceMin: '$priceMin',
                        priceMax: '$priceMax',
                        createdAt: '$createdAt'
                    }
                }
            }
        },
        { $sort: { 'vendor.createdAt': -1 } }
    ]);

    const payload = results.map((r) => ({
        vendor: {
            _id: r.vendor._id,
            id: r.vendor._id,
            name: r.vendor.name,
            businessName: r.vendor.businessName || null,
            ownerName: r.vendor.ownerName || null,
            email: r.vendor.email,
            phone: r.vendor.phone || null,
            serviceCategories: r.vendor.serviceCategories || [],
            serviceCategory: (r.vendor.serviceCategories || [])[0] || null,
            city: r.vendor.city || null
        },
        listings: r.listings
    }));

    const listingMatch = { isActive: true };
    if (category) listingMatch.category = category;
    if (city) listingMatch.city = city;

    const legacyListingsRaw = await VendorListing.find(listingMatch)
        .populate('vendor', 'name businessName ownerName email phone city serviceCategories status isActive')
        .sort({ createdAt: -1 });

    const listings = legacyListingsRaw
        .filter((l) => l.vendor && l.vendor.status === 'APPROVED' && l.vendor.isActive)
        .map((l) => {
            const obj = l.toObject({ virtuals: false });
            obj.serviceCategory = obj.category;
            obj.priceFrom = obj.priceMin;
            obj.priceTo = obj.priceMax;
            if (obj.vendor) {
                obj.vendor.serviceCategory = (obj.vendor.serviceCategories || [])[0] || null;
            }
            return obj;
        });

    res.json({ listings, vendors: payload });
});

module.exports = router;
