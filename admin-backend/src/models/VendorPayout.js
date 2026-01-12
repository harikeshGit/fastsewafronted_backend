const mongoose = require('mongoose');

const VendorPayoutSchema = new mongoose.Schema(
    {
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, unique: true, index: true },

        accountHolderName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        ifsc: { type: String, trim: true, uppercase: true },
        bankName: { type: String, trim: true },
        branch: { type: String, trim: true },
        upiId: { type: String, trim: true },

        verificationStatus: { type: String, enum: ['UNVERIFIED', 'VERIFIED'], default: 'UNVERIFIED' },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        verifiedAt: { type: Date }
    },
    { timestamps: true }
);

module.exports = mongoose.model('VendorPayout', VendorPayoutSchema);
