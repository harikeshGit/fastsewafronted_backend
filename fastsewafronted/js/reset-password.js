// Reset Password Handler
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('resetPasswordForm');
    if (form) {
        form.addEventListener('submit', handleResetPassword);
    }

    // Check if token is present in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        alert('❌ Invalid or missing reset token');
        window.location.href = 'forgot-password.html';
    }

    // Password strength indicator
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
});

function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthIndicator = document.getElementById('passwordStrength');
    const strengthBar = document.getElementById('strengthBar');

    if (!password) {
        strengthIndicator.style.display = 'none';
        return;
    }

    strengthIndicator.style.display = 'block';

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    strengthBar.className = 'password-strength-bar';
    if (strength <= 2) {
        strengthBar.classList.add('strength-weak');
    } else if (strength <= 4) {
        strengthBar.classList.add('strength-medium');
    } else {
        strengthBar.classList.add('strength-strong');
    }
}

async function handleResetPassword(e) {
    e.preventDefault();

    const btn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('btnSpinner');
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Validation
    if (!password || !confirmPassword) {
        alert('❌ Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('❌ Passwords do not match!');
        return;
    }

    if (password.length < 6) {
        alert('❌ Password must be at least 6 characters');
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
        const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to reset password');
        }

        alert('✅ Password reset successful! You can now login with your new password.');
        window.location.href = 'login.html';

    } catch (err) {
        alert('❌ ' + err.message);
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        btn.style.opacity = '1';
        btn.disabled = false;
    }
}
