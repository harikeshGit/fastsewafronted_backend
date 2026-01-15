const nodemailer = require('nodemailer');

function getSmtpConfig() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user;

    if (!host || !user || !pass) {
        return null;
    }

    return {
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        from,
    };
}

function isEmailOtpDevMode() {
    const flag = String(process.env.EMAIL_OTP_DEV_MODE || '').trim().toLowerCase() === 'true';
    if (flag) return true;

    // If running locally/non-production and SMTP isn't configured,
    // fall back to dev mode so signup doesn't fail.
    const env = String(process.env.NODE_ENV || '').trim().toLowerCase();
    if (env && env !== 'production' && !getSmtpConfig()) return true;

    // If NODE_ENV is not set, assume local development.
    if (!env && !getSmtpConfig()) return true;

    return false;
}

async function sendEmail({ to, subject, text, html }) {
    const cfg = getSmtpConfig();

    const devMode = isEmailOtpDevMode();
    if (!cfg) {
        if (devMode) {
            // In dev mode, we don't send; caller can still proceed.
            return { sent: false, reason: 'SMTP not configured (EMAIL_OTP_DEV_MODE=true)' };
        }
        throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optionally SMTP_FROM).');
    }

    const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: cfg.auth,
    });

    await transporter.sendMail({
        from: cfg.from,
        to,
        subject,
        text,
        html,
    });

    return { sent: true };
}

module.exports = {
    sendEmail,
    getSmtpConfig,
    isEmailOtpDevMode,
};
