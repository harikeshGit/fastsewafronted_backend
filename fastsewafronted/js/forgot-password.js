// Forgot Password Handler
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('forgotPasswordForm');
    if (form) {
        form.addEventListener('submit', handleForgotPassword);
    }
});

async function handleForgotPassword(e) {
    e.preventDefault();

    const btn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('btnSpinner');
    const email = document.getElementById('email').value.trim();

    if (!email) {
        alert('❌ Please enter your email address');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('❌ Please enter a valid email address');
        return;
    }

    // Start Loading
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    try {
        const API_BASE = (() => {
            const custom = window.localStorage.getItem('apiUrl');
            if (custom) return `${custom.replace(/\/+$/, '')}/api`;

            const hostname = (window.location.hostname || '').toLowerCase();
            const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1' || hostname === '::';
            if (isLocalHost) return 'http://localhost:4000/api';

            const origin = window.location.origin;
            if (!origin || origin === 'null') return 'http://localhost:4000/api';
            return `${origin}/api`;
        })();
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send reset link');
        }

        // For demo purposes, show the token
        alert('✅ Password reset link sent!\n\nFor demo purposes, your reset token is:\n' + data.resetToken + '\n\nIn production, this would be sent to your email.');

        // Redirect to reset password page with token
        const useToken = confirm('Do you want to reset your password now?');
        if (useToken) {
            window.location.href = `reset-password.html?token=${data.resetToken}`;
        } else {
            window.location.href = 'login.html';
        }

    } catch (err) {
        alert('❌ ' + err.message);
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        btn.style.opacity = '1';
        btn.disabled = false;
    }
}
