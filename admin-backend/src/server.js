require('dotenv').config();
const dns = require('dns');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const announcementRoutes = require('./routes/announcements');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const registrationRoutes = require('./routes/registrations');
const exportRoutes = require('./routes/exports');
const vendorAuthRoutes = require('./routes/vendorAuth');
const vendorRoutes = require('./routes/vendor');
const adminVendorRoutes = require('./routes/adminVendors');
const publicVendorRoutes = require('./routes/publicVendors');
const serviceRequestRoutes = require('./routes/serviceRequests');
const Admin = require('./models/Admin');

const app = express();

// Prefer IPv4 DNS results first to avoid NAT64/IPv6 connectivity issues with Atlas.
// (Common on some ISPs/hotspots/corporate networks.)
try {
    dns.setDefaultResultOrder('ipv4first');
} catch {
    // Older Node versions may not support this; safe to ignore.
}

// The static frontend currently relies on inline <script> blocks and inline onclick handlers.
// Helmet's default CSP blocks those (`script-src 'self'` + `script-src-attr 'none'`), which
// prevents dashboard/login UI code from running (e.g., logout buttons do nothing).
// We relax CSP to allow inline scripts/handlers while still keeping other Helmet protections.
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                'script-src': ["'self'", 'https:', "'unsafe-inline'"],
                'script-src-attr': ["'unsafe-inline'"],
                // OAuth widgets may use iframes and cross-origin requests.
                'connect-src': ["'self'", 'https:', 'data:'],
                'frame-src': ["'self'", 'https:'],
            },
        },
    })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: '*' }));

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function ensureDefaultAdmin() {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin@123';
    const email = process.env.ADMIN_EMAIL || 'admin@fastsewa.com';

    try {
        const existing = await Admin.findOne({ $or: [{ username }, { email }] });
        if (existing) return;

        const admin = new Admin({
            username,
            email,
            password,
            status: 'approved',
            approvedAt: new Date()
        });
        await admin.save();
        console.log('✅ Default admin ensured:', { username, email });
    } catch (err) {
        console.error('Failed to ensure default admin:', err.message);
    }
}

mongoose.connection.once('connected', () => {
    ensureDefaultAdmin();
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        await db.collection('test').insertOne({ status: 'ok', time: new Date() });
        res.json({ message: 'Test document inserted', status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use('/api/announcements', announcementRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/export', exportRoutes);

// Vendor system (as per vendor panel report)
app.use('/api/vendor/auth', vendorAuthRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', adminVendorRoutes);
app.use('/api/public', publicVendorRoutes);
app.use('/api/service-requests', serviceRequestRoutes);

// Serve the static frontend (full-stack deploy).
// Repo layout: admin-backend/src -> ../../fastsewafronted
const frontendDirCandidates = [
    path.join(__dirname, '..', '..', 'fastsewafronted'),
    path.join(__dirname, '..', '..', 'fastsewafrontedapp'),
];
const frontendDir = frontendDirCandidates.find((p) => {
    try {
        return fs.existsSync(p);
    } catch {
        return false;
    }
}) || frontendDirCandidates[0];
app.use(express.static(frontendDir));

// Convenience routes
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Admin backend running on port ${PORT}`);
});
