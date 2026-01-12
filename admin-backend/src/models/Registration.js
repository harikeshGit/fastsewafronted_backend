const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String },
    serviceInterest: { type: String },
    registrationDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
