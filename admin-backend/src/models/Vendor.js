const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SERVICE_CATEGORIES = [
    'construction',
    'security',
    'medical',
    'repair',
    'land',
    'legal',
    'material',
    'finance'
];

const VendorSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        businessName: { type: String, trim: true },
        ownerName: { type: String, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
        },
        phone: { type: String, trim: true },
        password: { type: String, required: true },

        aadhaar: { type: String, required: true, trim: true },
        pan: { type: String, required: true, uppercase: true, trim: true },
        gst: { type: String, trim: true },
        businessTurnoverDeclaration: { type: String, trim: true },
        turnoverBelowLimit: { type: Boolean, default: false },
        experienceYears: { type: Number, min: 0 },

        serviceCategories: {
            type: [String],
            required: true,
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message: 'At least one service category is required'
            }
        },
        city: { type: String, trim: true },

        status: {
            type: String,
            enum: ['PENDING_VERIFICATION', 'APPROVED', 'REJECTED'],
            default: 'PENDING_VERIFICATION'
        },
        rejectionReason: { type: String, trim: true },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        approvedAt: { type: Date },

        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

VendorSchema.pre('validate', function () {
    if (Array.isArray(this.serviceCategories)) {
        this.serviceCategories = this.serviceCategories
            .map((c) => (typeof c === 'string' ? c.toLowerCase().trim() : c))
            .filter(Boolean);

        for (const cat of this.serviceCategories) {
            if (!SERVICE_CATEGORIES.includes(cat)) {
                this.invalidate('serviceCategories', `Invalid service category: ${cat}`);
                break;
            }
        }
    }
});

VendorSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

VendorSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

VendorSchema.statics.SERVICE_CATEGORIES = SERVICE_CATEGORIES;

module.exports = mongoose.model('Vendor', VendorSchema);
