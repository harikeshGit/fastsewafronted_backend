const express = require('express');
const Vendor = require('../models/Vendor');
const { generateVendorToken } = require('../middleware/authVendor');

const router = express.Router();

function isLikelyAadhaar(value) {
    return typeof value === 'string' && /^[0-9]{12}$/.test(value.replace(/\s+/g, ''));
}

function isLikelyPAN(value) {
    return typeof value === 'string' && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.trim().toUpperCase());
}

router.post('/register', async (req, res) => {
    const {
        name,
        businessName,
        ownerName,
        email,
        phone,
        password,
        confirmPassword,
        aadhaar,
        aadhaarNumber,
        pan,
        panNumber,
        gst,
        gstNumber,
        businessTurnoverDeclaration,
        turnoverBelowLimit,
        experienceYears,
        serviceCategories,
        serviceCategory,
        city
    } = req.body || {};

    const resolvedName = name || businessName || ownerName;
    const resolvedAadhaar = aadhaar || aadhaarNumber;
    const resolvedPan = pan || panNumber;
    const resolvedGst = gst || gstNumber;
    const resolvedCategories = Array.isArray(serviceCategories) && serviceCategories.length
        ? serviceCategories
        : serviceCategory
            ? [serviceCategory]
            : [];

    if (!resolvedName || !email || !password || !resolvedAadhaar || !resolvedPan || !resolvedCategories.length) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if ((confirmPassword ?? password) !== password) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!isLikelyAadhaar(resolvedAadhaar)) {
        return res.status(400).json({ error: 'Invalid Aadhaar number' });
    }

    if (!isLikelyPAN(resolvedPan)) {
        return res.status(400).json({ error: 'Invalid PAN number' });
    }

    try {
        const existing = await Vendor.findOne({ email: String(email).toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const vendor = new Vendor({
            name: resolvedName,
            businessName,
            ownerName,
            email,
            phone,
            password,
            aadhaar: String(resolvedAadhaar).replace(/\s+/g, ''),
            pan: String(resolvedPan).toUpperCase().trim(),
            gst: resolvedGst,
            businessTurnoverDeclaration,
            turnoverBelowLimit: Boolean(turnoverBelowLimit),
            experienceYears: experienceYears !== undefined && experienceYears !== null ? Number(experienceYears) : undefined,
            serviceCategories: resolvedCategories,
            city,
            status: 'PENDING_VERIFICATION'
        });

        await vendor.save();

        res.status(201).json({
            message: 'Vendor registered successfully. Awaiting admin approval.',
            vendor: {
                _id: vendor._id,
                id: vendor._id,
                name: vendor.name,
                businessName: vendor.businessName || null,
                ownerName: vendor.ownerName || null,
                email: vendor.email,
                status: vendor.status,
                serviceCategories: vendor.serviceCategories,
                serviceCategory: vendor.serviceCategories?.[0] || null,
                city: vendor.city
            }
        });
    } catch (err) {
        const msg = err?.message || 'Failed to register vendor';
        res.status(500).json({ error: msg });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const vendor = await Vendor.findOne({ email: String(email).toLowerCase().trim(), isActive: true });
        if (!vendor) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const ok = await vendor.comparePassword(password);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateVendorToken(vendor._id);
        res.json({
            token,
            message: 'Login successful',
            vendor: {
                _id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                status: vendor.status,
                rejectionReason: vendor.rejectionReason || null,
                serviceCategories: vendor.serviceCategories,
                city: vendor.city
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
