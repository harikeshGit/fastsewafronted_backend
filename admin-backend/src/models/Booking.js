const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    service: { type: String, required: true }, // construction, security, legal, etc.
    phone: { type: String, required: true },
    email: { type: String },
    description: { type: String },
    status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'completed', 'cancelled'] },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
