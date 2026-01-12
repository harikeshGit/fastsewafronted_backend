const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');

const VENDOR_JWT_SECRET = process.env.VENDOR_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const generateVendorToken = (vendorId) => {
    return jwt.sign({ vendorId, role: 'vendor' }, VENDOR_JWT_SECRET, { expiresIn: '7d' });
};

const verifyVendorToken = (token) => {
    try {
        return jwt.verify(token, VENDOR_JWT_SECRET);
    } catch {
        return null;
    }
};

const authVendor = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyVendorToken(token);
    const vendorId = decoded?.vendorId || decoded?.id || decoded?._id;
    if (!vendorId) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.isActive) {
        return res.status(403).json({ error: 'Vendor account not active' });
    }

    req.vendor = {
        vendorId: vendor._id,
        status: vendor.status,
        vendor
    };
    next();
};

module.exports = { authVendor, generateVendorToken };
