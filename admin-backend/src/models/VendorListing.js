const mongoose = require('mongoose');

const VendorListingSchema = new mongoose.Schema(
    {
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
        category: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        city: { type: String, trim: true },
        priceMin: { type: Number, min: 0 },
        priceMax: { type: Number, min: 0 },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

VendorListingSchema.index({ category: 1, city: 1, isActive: 1 });

module.exports = mongoose.model('VendorListing', VendorListingSchema);
