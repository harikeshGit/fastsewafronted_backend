const Admin = require('../models/Admin');
const { authMiddleware } = require('./auth');

const requireAdmin = [
    authMiddleware,
    async (req, res, next) => {
        try {
            const adminId = req.admin?.adminId;
            if (!adminId) return res.status(403).json({ error: 'Admin access required' });

            const admin = await Admin.findOne({ _id: adminId, status: 'approved' });
            if (!admin) return res.status(403).json({ error: 'Admin access required' });

            req.adminUser = admin;
            next();
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    }
];

module.exports = { requireAdmin };
