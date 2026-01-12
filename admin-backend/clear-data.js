require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

try {
    dns.setDefaultResultOrder('ipv4first');
} catch {
    // ignore
}

function parseArgs(argv) {
    const args = new Set(argv.slice(2).map(a => a.trim()));
    const has = (flag) => args.has(flag);

    const selected = {
        registrations: has('--registrations'),
        bookings: has('--bookings'),
        users: has('--users'),
        announcements: has('--announcements'),
        admins: has('--admins'),
        all: has('--all'),
        yes: has('--yes') || /^yes$/i.test(process.env.CONFIRM_DELETE || ''),
        keepAdmin: has('--keep-admin') || !has('--admins'),
    };

    if (selected.all) {
        selected.registrations = true;
        selected.bookings = true;
        selected.users = true;
        selected.announcements = true;
        // admins remain opt-in unless explicitly asked
        selected.admins = has('--admins');
        selected.keepAdmin = !selected.admins;
    }

    return selected;
}

function usage() {
    console.log(`\nUsage:\n  node clear-data.js [--registrations] [--bookings] [--users] [--announcements] [--all] [--admins] --yes\n\nExamples:\n  node clear-data.js --registrations --yes\n  node clear-data.js --registrations --bookings --yes\n  node clear-data.js --all --yes\n  node clear-data.js --all --admins --yes   (DANGER: also deletes admin accounts)\n\nSafety:\n  Requires --yes OR set env CONFIRM_DELETE=yes\n`);
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('Missing MONGODB_URI in environment.');
        process.exit(1);
    }

    const opts = parseArgs(process.argv);
    const nothingSelected = !opts.registrations && !opts.bookings && !opts.users && !opts.announcements && !opts.admins;

    if (nothingSelected) {
        console.error('No collections selected to delete.');
        usage();
        process.exit(1);
    }

    if (!opts.yes) {
        console.error('Confirmation required. Re-run with --yes (or set CONFIRM_DELETE=yes).');
        usage();
        process.exit(1);
    }

    await mongoose.connect(uri);

    const Registration = require('./src/models/Registration');
    const Booking = require('./src/models/Booking');
    const User = require('./src/models/User');
    const Announcement = require('./src/models/Announcement');
    const Admin = require('./src/models/Admin');

    const results = [];

    if (opts.registrations) {
        const r = await Registration.deleteMany({});
        results.push({ collection: 'registrations', deleted: r.deletedCount || 0 });
    }

    if (opts.bookings) {
        const r = await Booking.deleteMany({});
        results.push({ collection: 'bookings', deleted: r.deletedCount || 0 });
    }

    if (opts.users) {
        const r = await User.deleteMany({});
        results.push({ collection: 'users', deleted: r.deletedCount || 0 });
    }

    if (opts.announcements) {
        const r = await Announcement.deleteMany({});
        results.push({ collection: 'announcements', deleted: r.deletedCount || 0 });
    }

    if (opts.admins) {
        const r = await Admin.deleteMany({});
        results.push({ collection: 'admins', deleted: r.deletedCount || 0 });
    }

    console.log('✅ Deleted documents:');
    for (const row of results) {
        console.log(`- ${row.collection}: ${row.deleted}`);
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(async (err) => {
    console.error('❌ Clear failed:', err?.message || String(err));
    try {
        await mongoose.disconnect();
    } catch {
        // ignore
    }
    process.exit(1);
});
