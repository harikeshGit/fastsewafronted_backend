const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    authProvider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    authProviderId: { type: String },
    emailVerified: { type: Boolean, default: false },
    emailOtpHash: { type: String },
    emailOtpExpiresAt: { type: Date },
    password: {
        type: String,
        required: function () {
            return (this.authProvider || 'local') === 'local';
        },
    },
    role: { type: String, required: true, enum: ['user', 'admin'], default: 'user' },
    userType: { type: String, enum: ['customer', 'provider', 'vendor'] }, // For regular users
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.password) {
        return;
    }
    if (!this.isModified('password')) {
        return;
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password) {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
