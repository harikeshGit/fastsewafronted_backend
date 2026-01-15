function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

// Intentionally simple: good UX + blocks obvious invalid inputs.
// (Full RFC 5322 validation is complex and not necessary here.)
function isValidEmail(value) {
    if (typeof value !== 'string') return false;
    const email = value.trim();
    if (!email) return false;
    if (email.length > 254) return false;

    // Basic structure user@domain.tld
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;

    // Avoid a few common invalid patterns
    if (email.includes('..')) return false;

    return true;
}

function getEmailDomain(value) {
    const normalized = normalizeEmail(value);
    const at = normalized.lastIndexOf('@');
    if (at < 0) return '';
    return normalized.slice(at + 1);
}

function parseDomainList(envValue) {
    return String(envValue || '')
        .split(',')
        .map((d) => String(d).trim().toLowerCase())
        .filter(Boolean);
}

function isAllowedEmailDomain(email) {
    const domain = getEmailDomain(email);
    if (!domain) return false;

    const allowlist = parseDomainList(process.env.EMAIL_DOMAIN_ALLOWLIST);
    const blocklist = parseDomainList(process.env.EMAIL_DOMAIN_BLOCKLIST);

    // Optional convenience toggle (kept small + conservative; extend via EMAIL_DOMAIN_BLOCKLIST)
    const blockFree = String(process.env.BLOCK_FREE_EMAILS || '').trim().toLowerCase() === 'true';
    const commonFreeDomains = new Set([
        'gmail.com',
        'yahoo.com',
        'yahoo.in',
        'outlook.com',
        'hotmail.com',
        'live.com',
        'icloud.com',
    ]);

    if (allowlist.length && !allowlist.includes(domain)) {
        return false;
    }

    if (blocklist.includes(domain)) {
        return false;
    }

    if (blockFree && commonFreeDomains.has(domain)) {
        return false;
    }

    return true;
}

function emailEqualsQuery(email) {
    const normalized = normalizeEmail(email);
    return { $regex: `^${escapeRegExp(normalized)}$`, $options: 'i' };
}

module.exports = {
    normalizeEmail,
    isValidEmail,
    emailEqualsQuery,
    isAllowedEmailDomain,
};
