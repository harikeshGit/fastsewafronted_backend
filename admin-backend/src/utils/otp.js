const crypto = require('crypto');

function generateNumericOtp(length = 6) {
    const n = Math.max(4, Math.min(10, Number(length) || 6));
    // Generate uniform digits using crypto.
    let otp = '';
    for (let i = 0; i < n; i++) {
        otp += String(crypto.randomInt(0, 10));
    }
    return otp;
}

function hashOtp(otp) {
    return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function constantTimeEqualHex(a, b) {
    const aa = Buffer.from(String(a || ''), 'hex');
    const bb = Buffer.from(String(b || ''), 'hex');
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
}

module.exports = {
    generateNumericOtp,
    hashOtp,
    constantTimeEqualHex,
};
