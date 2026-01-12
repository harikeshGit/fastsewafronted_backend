const express = require('express');
const ServiceRequest = require('../models/ServiceRequest');

const router = express.Router();

// Public endpoint to create a service request (e.g., from chatbot or service pages)
router.post('/', async (req, res) => {
    const {
        category,
        city,
        customerName,
        customerPhone,
        customerEmail,
        description,
        vendorId
    } = req.body || {};

    if (!category) {
        return res.status(400).json({ error: 'category is required' });
    }

    const request = new ServiceRequest({
        category,
        city,
        customerName,
        customerPhone,
        customerEmail,
        description,
        vendor: vendorId || null
    });

    await request.save();
    res.status(201).json(request);
});

module.exports = router;
