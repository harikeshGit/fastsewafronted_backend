const express = require('express');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

const { OAuth2Client } = require('google-auth-library');
const { fetch } = require('undici');
const { normalizeEmail, isValidEmail, emailEqualsQuery, isAllowedEmailDomain } = require('../utils/email');
const { generateNumericOtp, hashOtp, constantTimeEqualHex } = require('../utils/otp');
const { sendEmail, isEmailOtpDevMode } = require('../utils/mailer');

const router = express.Router();

// Validate current session token and return current principal
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const principalId = req.admin?.adminId;
        if (!principalId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const user = await User.findOne({ _id: principalId, isActive: true }).select('-password');
        if (user) {
            // If local auth and not verified, treat as not authenticated.
            if (user.authProvider === 'local' && !user.emailVerified) {
                return res.status(401).json({ success: false, error: 'Email not verified' });
            }

            return res.json({
                success: true,
                user: buildUserResponse(user, 'user')
            });
        }

        const admin = await Admin.findOne({ _id: principalId, status: 'approved' }).select('-password');
        if (admin) {
            return res.json({
                success: true,
                user: {
                    _id: admin._id,
                    name: admin.username || admin.email,
                    email: admin.email,
                    role: 'admin',
                    userType: null,
                }
            });
        }

        return res.status(401).json({ success: false, error: 'Unauthorized' });
    } catch {
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

function buildUserResponse(user, role = 'user') {
    return {
        _id: user._id,
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username,
        email: user.email,
        role,
        userType: user.userType || null
    };
}

function splitName(fullName) {
    const safe = String(fullName || '').trim();
    if (!safe) return { firstName: 'User', lastName: ' ' };
    const parts = safe.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return { firstName: parts[0], lastName: ' ' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// Unified Login (User + Admin)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const identity = String(email).trim();
    const looksLikeEmail = identity.includes('@');
    if (looksLikeEmail && !isValidEmail(identity)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    try {
        const normalizedEmail = looksLikeEmail ? normalizeEmail(identity) : null;

        // First check in User collection (email only)
        let user = looksLikeEmail
            ? await User.findOne({ email: emailEqualsQuery(normalizedEmail), isActive: true })
            : null;
        let role = 'user';

        // If not found in User, check in Admin collection
        if (!user) {
            // Accept either admin email or admin username in the "email" field for compatibility
            user = await Admin.findOne({
                status: 'approved',
                $or: looksLikeEmail
                    ? [{ email: emailEqualsQuery(normalizedEmail) }, { username: identity }]
                    : [{ username: identity }]
            });
            if (user) role = 'admin';
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials or account not active' });
        }

        if (role === 'user' && user.authProvider === 'local' && !user.emailVerified) {
            return res.status(403).json({ error: 'Email not verified. Please verify your email to login.' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        res.json({
            token,
            message: 'Login successful',
            user: {
                _id: user._id,
                name: user.firstName ? `${user.firstName} ${user.lastName}` : user.username,
                email: user.email,
                role: role,
                userType: user.userType || null
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Google OAuth (ID token) Login
// Frontend obtains an ID token via Google Identity Services and posts it here.
router.post('/google', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
        return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not configured on the server' });
    }

    try {
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({ idToken, audience: googleClientId });
        const payload = ticket.getPayload() || {};

        const email = payload.email;
        if (!email) {
            return res.status(400).json({ error: 'Google token did not include an email. Please allow email scope.' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            const { firstName, lastName } = {
                firstName: payload.given_name,
                lastName: payload.family_name,
            };
            const nameParts = (firstName || lastName) ? { firstName: firstName || 'User', lastName: lastName || ' ' } : splitName(payload.name);

            user = new User({
                firstName: nameParts.firstName,
                lastName: nameParts.lastName,
                email,
                role: 'user',
                userType: 'customer',
                authProvider: 'google',
                authProviderId: payload.sub,
                emailVerified: true,
            });
            await user.save();
        } else {
            // If a local account exists, we still allow Google login for the same email.
            // Optionally record provider metadata for future use.
            const needsUpdate = (!user.authProvider || user.authProvider === 'local') && payload.sub;
            if (needsUpdate) {
                user.authProvider = 'google';
                user.authProviderId = payload.sub;
                user.emailVerified = true;
                await user.save();
            }
        }

        if (!user.isActive) {
            return res.status(401).json({ error: 'Account not active' });
        }

        const token = generateToken(user._id);
        return res.json({
            token,
            message: 'Login successful',
            user: buildUserResponse(user, 'user')
        });
    } catch (err) {
        console.error('Google login error:', err);
        return res.status(401).json({ error: 'Google authentication failed' });
    }
});

// Facebook OAuth (access token) Login
// Frontend obtains an access token via FB JS SDK and posts it here.
router.post('/facebook', async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'accessToken is required' });

    const fbAppId = process.env.FACEBOOK_APP_ID;
    const fbAppSecret = process.env.FACEBOOK_APP_SECRET;
    if (!fbAppId || !fbAppSecret) {
        return res.status(500).json({ error: 'FACEBOOK_APP_ID / FACEBOOK_APP_SECRET are not configured on the server' });
    }

    try {
        // Verify that the user token is valid and meant for our app.
        const debugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(`${fbAppId}|${fbAppSecret}`)}`;
        const debugResp = await fetch(debugUrl);
        const debugJson = await debugResp.json();
        const debugData = debugJson?.data;
        if (!debugResp.ok || !debugData?.is_valid || String(debugData?.app_id) !== String(fbAppId)) {
            return res.status(401).json({ error: 'Invalid Facebook token' });
        }

        const meUrl = `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name&access_token=${encodeURIComponent(accessToken)}`;
        const meResp = await fetch(meUrl);
        const me = await meResp.json();
        if (!meResp.ok) {
            return res.status(401).json({ error: 'Facebook authentication failed' });
        }

        const email = me.email;
        if (!email) {
            return res.status(400).json({ error: 'Facebook did not return an email. Please allow the email permission.' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            const nameParts = (me.first_name || me.last_name) ? { firstName: me.first_name || 'User', lastName: me.last_name || ' ' } : splitName(me.name);
            user = new User({
                firstName: nameParts.firstName,
                lastName: nameParts.lastName,
                email,
                role: 'user',
                userType: 'customer',
                authProvider: 'facebook',
                authProviderId: me.id,
                emailVerified: true,
            });
            await user.save();
        } else {
            const needsUpdate = (!user.authProvider || user.authProvider === 'local') && me.id;
            if (needsUpdate) {
                user.authProvider = 'facebook';
                user.authProviderId = me.id;
                user.emailVerified = true;
                await user.save();
            }
        }

        if (!user.isActive) {
            return res.status(401).json({ error: 'Account not active' });
        }

        const token = generateToken(user._id);
        return res.json({
            token,
            message: 'Login successful',
            user: buildUserResponse(user, 'user')
        });
    } catch (err) {
        console.error('Facebook login error:', err);
        return res.status(401).json({ error: 'Facebook authentication failed' });
    }
});

// User Signup
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, role, userType } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }

    if (!isValidEmail(String(email))) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!isAllowedEmailDomain(String(email))) {
        return res.status(400).json({ error: 'Email domain is not allowed' });
    }

    const normalizedEmail = normalizeEmail(email);

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Check if email already exists in User or Admin
        const existingUser = await User.findOne({ email: emailEqualsQuery(normalizedEmail) });
        const existingAdmin = await Admin.findOne({ email: emailEqualsQuery(normalizedEmail) });

        if (existingUser || existingAdmin) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create user based on role
        if (role === 'admin') {
            // Create pending admin request with unique username
            const baseUsername = normalizedEmail.split('@')[0];
            const uniqueUsername = `${baseUsername}_${Date.now()}`;

            const admin = new Admin({
                username: uniqueUsername,
                email: normalizedEmail,
                password,
                status: 'pending'
            });
            await admin.save();
            res.status(201).json({ message: 'Admin signup request submitted. Awaiting approval.', role: 'admin', needsApproval: true });
        } else {
            // Create regular user (unverified) and send OTP
            const otp = generateNumericOtp(6);
            const otpHash = hashOtp(otp);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            const user = new User({
                firstName,
                lastName,
                email: normalizedEmail,
                password,
                role: 'user',
                userType: userType || 'customer',
                authProvider: 'local',
                emailVerified: false,
                emailOtpHash: otpHash,
                emailOtpExpiresAt: expiresAt,
            });
            await user.save();

            const devMode = isEmailOtpDevMode();
            try {
                await sendEmail({
                    to: normalizedEmail,
                    subject: 'FastSewa: Verify your email',
                    text: `Your FastSewa verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
                    html: `<p>Your FastSewa verification code is:</p><h2 style="letter-spacing:2px">${otp}</h2><p>This code expires in 10 minutes.</p>`,
                });
            } catch (e) {
                // If SMTP is misconfigured, don’t leave an unverified account stuck.
                // In dev mode we allow it; otherwise return a clear error.
                if (!devMode) {
                    await User.deleteOne({ _id: user._id });
                    return res.status(500).json({ error: e.message || 'Failed to send verification email' });
                }
            }

            return res.status(201).json({
                message: devMode
                    ? 'Verification code generated (SMTP not configured in dev). Please verify to complete signup.'
                    : 'Verification code sent to your email. Please verify to complete signup.',
                needsEmailVerification: true,
                email: normalizedEmail,
                // Only returned in dev mode to simplify local testing.
                otp: devMode ? otp : undefined,
            });
        }
    } catch (err) {
        console.error('Signup error details:', {
            message: err.message,
            code: err.code,
            name: err.name,
            errors: err.errors
        });

        let errorMsg = 'Failed to create account';

        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            errorMsg = `${field.charAt(0).toUpperCase() + field.slice(1)} already registered`;
        } else if (err.errors) {
            // Handle Mongoose validation errors
            const firstError = Object.values(err.errors)[0];
            errorMsg = firstError?.message || 'Validation error';
        } else if (err.message) {
            errorMsg = err.message;
        }

        res.status(500).json({ error: errorMsg });
    }
});

// Verify Email OTP
router.post('/verify-email', async (req, res) => {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }
    if (!isValidEmail(String(email))) {
        return res.status(400).json({ error: 'Invalid email address' });
    }
    const normalizedEmail = normalizeEmail(email);

    try {
        const user = await User.findOne({ email: emailEqualsQuery(normalizedEmail), isActive: true });
        if (!user) {
            return res.status(404).json({ error: 'Account not found. Please sign up as a User on this same site/link, then verify.' });
        }

        if (user.emailVerified) {
            const token = generateToken(user._id);
            return res.json({
                message: 'Email already verified',
                token,
                user: buildUserResponse(user, 'user'),
            });
        }

        if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
            return res.status(400).json({ error: 'No verification code found. Please request a new code.' });
        }

        if (user.emailOtpExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
        }

        const ok = constantTimeEqualHex(hashOtp(otp), user.emailOtpHash);
        if (!ok) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        user.emailVerified = true;
        user.emailOtpHash = undefined;
        user.emailOtpExpiresAt = undefined;
        await user.save();

        const token = generateToken(user._id);
        return res.json({
            message: 'Email verified successfully',
            token,
            user: buildUserResponse(user, 'user'),
        });
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
});

// Resend Email OTP
router.post('/resend-email-otp', async (req, res) => {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!isValidEmail(String(email))) return res.status(400).json({ error: 'Invalid email address' });
    if (!isAllowedEmailDomain(String(email))) return res.status(400).json({ error: 'Email domain is not allowed' });

    const normalizedEmail = normalizeEmail(email);

    try {
        const user = await User.findOne({ email: emailEqualsQuery(normalizedEmail), isActive: true });
        if (!user) return res.status(404).json({ error: 'Account not found' });
        if (user.emailVerified) return res.json({ message: 'Email already verified' });
        if (user.authProvider !== 'local') {
            user.emailVerified = true;
            await user.save();
            return res.json({ message: 'Email verified' });
        }

        const otp = generateNumericOtp(6);
        user.emailOtpHash = hashOtp(otp);
        user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const devMode = isEmailOtpDevMode();
        try {
            await sendEmail({
                to: normalizedEmail,
                subject: 'FastSewa: Your verification code',
                text: `Your FastSewa verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
                html: `<p>Your FastSewa verification code is:</p><h2 style="letter-spacing:2px">${otp}</h2><p>This code expires in 10 minutes.</p>`,
            });
        } catch (e) {
            if (!devMode) {
                return res.status(500).json({ error: e.message || 'Failed to send verification email' });
            }
        }

        return res.json({
            message: 'Verification code sent',
            email: normalizedEmail,
            otp: devMode ? otp : undefined,
        });
    } catch {
        return res.status(500).json({ error: 'Server error' });
    }
});

// Admin Signup Request
router.post('/admin-signup', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!isValidEmail(String(email))) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!isAllowedEmailDomain(String(email))) {
        return res.status(400).json({ error: 'Email domain is not allowed' });
    }

    const normalizedEmail = normalizeEmail(email);

    try {
        // Check if admin already exists (in Admin collection)
        const existingAdmin = await Admin.findOne({ $or: [{ username }, { email: emailEqualsQuery(normalizedEmail) }] });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Check if email exists in User collection
        const existingUser = await User.findOne({ email: emailEqualsQuery(normalizedEmail) });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered as a user' });
        }

        // Create pending admin request
        const admin = new Admin({
            username,
            email: normalizedEmail,
            password,
            status: 'pending'
        });

        await admin.save();
        res.status(201).json({ message: 'Signup request submitted. Awaiting admin approval.' });
    } catch (err) {
        // Handle MongoDB duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ error: `${field} already exists` });
        }
        console.error('Signup error details:', err);
        res.status(500).json({ error: err.message || 'Failed to create signup request' });
    }
});

// Get pending admin requests (admin only)
router.get('/requests', requireAdmin, async (req, res) => {
    try {
        const requests = await Admin.find({ status: 'pending' }).select('-password');
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Approve admin (admin only)
router.post('/approve/:id', requireAdmin, async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            { status: 'approved', approvedBy: req.admin?.adminId, approvedAt: new Date() },
            { new: true }
        );
        if (!admin) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Admin approved', admin });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve admin' });
    }
});

// Reject admin (admin only)
router.post('/reject/:id', requireAdmin, async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected' },
            { new: true }
        );
        if (!admin) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Admin rejected', admin });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject admin' });
    }
});

// Get all approved admins (admin only)
router.get('/admins', requireAdmin, async (req, res) => {
    try {
        const admins = await Admin.find({ status: 'approved' }).select('-password');
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

// Get all users (admin only)
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get pending admin requests (admin only)
router.get('/requests', requireAdmin, async (req, res) => {
    try {
        const requests = await Admin.find({ status: 'pending' }).select('-password');
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Approve admin (admin only)
router.post('/approve/:id', requireAdmin, async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            { status: 'approved', approvedBy: req.admin?.adminId, approvedAt: new Date() },
            { new: true }
        );
        if (!admin) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Admin approved', admin });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve admin' });
    }
});

// Reject admin (admin only)
router.post('/reject/:id', requireAdmin, async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected' },
            { new: true }
        );
        if (!admin) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Admin rejected', admin });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject admin' });
    }
});

// Forgot Password - Generate Reset Token
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (!isValidEmail(String(email))) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!isAllowedEmailDomain(String(email))) {
        return res.status(400).json({ error: 'Email domain is not allowed' });
    }

    const normalizedEmail = normalizeEmail(email);

    try {
        // Check in User collection first
        let user = await User.findOne({ email: emailEqualsQuery(normalizedEmail) });
        let isAdmin = false;

        // If not found in User, check Admin collection
        if (!user) {
            user = await Admin.findOne({ email: emailEqualsQuery(normalizedEmail) });
            isAdmin = true;
        }

        if (!user) {
            return res.status(404).json({ error: 'No account found with this email' });
        }

        // Generate reset token (in production, use crypto.randomBytes)
        const resetToken = generateToken(user._id);

        // In production, you would:
        // 1. Save hashed token to database with expiry
        // 2. Send email with reset link
        // For demo, we'll just return the token

        res.json({
            message: 'Password reset token generated',
            resetToken: resetToken,
            email: user.email
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset Password with Token
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Verify token and extract user ID
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.adminId;

        // Find user in User collection
        let user = await User.findById(userId);
        let isAdmin = false;

        // If not found in User, check Admin collection
        if (!user) {
            user = await Admin.findById(userId);
            isAdmin = true;
        }

        if (!user) {
            return res.status(404).json({ error: 'Invalid or expired reset token' });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = password;
        user.markModified('password');
        await user.save();

        res.json({
            message: 'Password reset successful',
            email: user.email
        });
    } catch (err) {
        console.error('Reset password error:', err);
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
