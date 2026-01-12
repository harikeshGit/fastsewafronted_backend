require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI;

async function seedAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const Admin = require('./src/models/Admin');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('✅ Admin already exists');
            process.exit(0);
        }

        // Hash password first
        const hashedPassword = await bcrypt.hash('admin@123', 10);

        // Create first admin with hashed password
        const admin = new Admin({
            username: 'admin',
            email: 'admin@fastsewa.com',
            password: hashedPassword,
            status: 'approved',
            approvedAt: new Date()
        });

        // Save without triggering pre-save hook
        await admin.collection.insertOne({
            username: 'admin',
            email: 'admin@fastsewa.com',
            password: hashedPassword,
            status: 'approved',
            approvedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('✅ First admin created successfully!');
        console.log('Username: admin');
        console.log('Email: admin@fastsewa.com');
        console.log('Password: admin@123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

seedAdmin();
