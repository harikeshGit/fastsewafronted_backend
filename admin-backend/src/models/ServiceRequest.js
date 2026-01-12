const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema(
    {
        category: { type: String, required: true, lowercase: true, trim: true },
        city: { type: String, trim: true },

        customerName: { type: String, trim: true },
        customerPhone: { type: String, trim: true },
        customerEmail: { type: String, trim: true, lowercase: true },

        description: { type: String, trim: true },
        details: { type: String, trim: true },
        budget: { type: String, trim: true },

        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', index: true },
        status: {
            type: String,
            enum: ['NEW', 'ASSIGNED', 'COMPLETED', 'CANCELLED'],
            default: 'NEW'
        }
    },
    { timestamps: true }
);

ServiceRequestSchema.index({ category: 1, city: 1, status: 1 });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
