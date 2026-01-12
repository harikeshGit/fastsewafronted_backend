require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

try {
    dns.setDefaultResultOrder('ipv4first');
} catch {
    // ignore
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('Missing MONGODB_URI in environment.');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        const admin = mongoose.connection.db.admin();
        await admin.command({ ping: 1 });
        console.log('✅ Pinged MongoDB. Connection is OK.');
        process.exit(0);
    } catch (err) {
        const msg = err?.message || String(err);
        console.error('❌ MongoDB connection failed:', msg);

        if (/IP that isn't whitelisted|IP whitelist|whitelist/i.test(msg)) {
            console.error('Hint: In MongoDB Atlas, add your current IP under Security → Network Access.');
        }

        process.exit(1);
    } finally {
        try {
            await mongoose.disconnect();
        } catch {
            // ignore
        }
    }
}

main();
