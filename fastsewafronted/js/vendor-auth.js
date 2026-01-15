// vendor-auth.js (supports legacy vendor UI + new backend compatibility)

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

const TOKEN_KEYS = ['fastsewaVendorToken', 'fastsewa_vendor_token', 'vendorToken'];

function setVendorToken(token, remember = true) {
    if (!token) return;
    if (remember) {
        TOKEN_KEYS.forEach((k) => localStorage.setItem(k, token));
    } else {
        sessionStorage.setItem('vendorToken', token);
    }
}

function getVendorToken() {
    const session = sessionStorage.getItem('vendorToken');
    if (session) return session;
    for (const k of TOKEN_KEYS) {
        const v = localStorage.getItem(k);
        if (v) return v;
    }
    return null;
}

function clearVendorAuth() {
    TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorInfo');
    localStorage.removeItem('fastsewa_vendor');
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage') || document.getElementById('vendorMessage');
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

function showLoginStatus(message, type) {
    const statusDiv = document.getElementById('loginStatus') || document.getElementById('vendorMessage');
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, type === 'success' ? 2000 : 5000);
}

function isValidEmail(email) {
    const e = String(email || '').trim();
    if (!e) return false;
    if (e.length > 254) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
    if (e.includes('..')) return false;
    return true;
}

async function apiRequest(path, method, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : { message: await res.text() };

    if (!res.ok) {
        throw new Error(data.error || data.message || 'Request failed');
    }
    return data;
}

document.addEventListener('DOMContentLoaded', () => {
    // Dashboard redirect guard (for legacy behavior)
    if (window.location.pathname.includes('vendor-dashboard.html')) {
        if (!getVendorToken()) {
            window.location.href = 'login.html?role=vendor';
            return;
        }
    }

    const registerForm = document.getElementById('vendorRegisterForm');
    const loginForm = document.getElementById('vendorLoginForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Legacy form fields
            const serviceCategoryEl = document.getElementById('serviceCategory');
            const isLegacy = Boolean(serviceCategoryEl);

            try {
                if (isLegacy) {
                    const serviceCategory = serviceCategoryEl.value;
                    const businessName = document.getElementById('businessName').value;
                    const ownerName = document.getElementById('ownerName').value;
                    const email = document.getElementById('email').value;
                    const phone = document.getElementById('phone').value;
                    const city = document.getElementById('city').value;
                    const aadhaarNumber = document.getElementById('aadhaarNumber').value;
                    const panNumber = document.getElementById('panNumber').value;
                    const gstNumber = document.getElementById('gstNumber').value;
                    const turnoverBelowLimit = document.getElementById('turnoverBelowLimit').checked;
                    const experienceYears = parseInt(document.getElementById('experienceYears').value, 10);
                    const password = document.getElementById('password').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    const terms = document.getElementById('terms').checked;

                    if (!serviceCategory) return showStatus('Please select a service category', 'error');
                    if (!businessName || !ownerName || !email || !phone || !city) return showStatus('All basic fields are required', 'error');
                    if (!isValidEmail(email)) return showStatus('Please enter a valid email address', 'error');
                    if (!aadhaarNumber || String(aadhaarNumber).length < 10) return showStatus('Please enter a valid Aadhaar number', 'error');
                    if (!panNumber || String(panNumber).length < 10) return showStatus('Please enter a valid PAN number', 'error');
                    if (!terms) return showStatus('Please accept Terms & Conditions', 'error');
                    if (password !== confirmPassword) return showStatus('Passwords do not match!', 'error');
                    if (!password || password.length < 6) return showStatus('Password must be at least 6 characters', 'error');
                    if (String(phone).length !== 10 || isNaN(phone)) return showStatus('Phone number must be 10 digits', 'error');
                    if (Number.isNaN(experienceYears) || experienceYears < 0 || experienceYears > 50) return showStatus('Please enter valid years of experience', 'error');

                    await apiRequest('/vendor/auth/register', 'POST', {
                        serviceCategory,
                        businessName,
                        ownerName,
                        email,
                        phone,
                        city,
                        aadhaarNumber,
                        panNumber,
                        gstNumber: gstNumber || null,
                        turnoverBelowLimit,
                        experienceYears,
                        password,
                        confirmPassword
                    });

                    showStatus('✓ Registration successful! Wait for admin approval. Redirecting to login...', 'success');
                    setTimeout(() => {
                        window.location.href = 'vendor-login.html';
                    }, 1200);
                } else {
                    // New form fields fallback (kept for compatibility)
                    const name = document.getElementById('name')?.value?.trim();
                    const email = document.getElementById('email')?.value?.trim();
                    const phone = document.getElementById('phone')?.value?.trim();
                    const aadhaar = document.getElementById('aadhaar')?.value?.trim();
                    const pan = document.getElementById('pan')?.value?.trim();
                    const gst = document.getElementById('gst')?.value?.trim();
                    const city = document.getElementById('city')?.value?.trim();
                    const password = document.getElementById('password')?.value;
                    const confirmPassword = document.getElementById('confirmPassword')?.value;
                    const terms = document.getElementById('terms')?.checked;

                    if (!terms) return showStatus('Please accept the terms to continue.', 'error');
                    if (!name || !email || !password) return showStatus('Name, email, and password are required.', 'error');
                    if (!isValidEmail(email)) return showStatus('Please enter a valid email address.', 'error');
                    if (password.length < 6) return showStatus('Password must be at least 6 characters.', 'error');
                    if (password !== confirmPassword) return showStatus('Passwords do not match.', 'error');

                    await apiRequest('/vendor/auth/register', 'POST', {
                        name,
                        email,
                        phone: phone || undefined,
                        password,
                        confirmPassword,
                        aadhaar,
                        pan,
                        gst: gst || undefined,
                        city: city || undefined,
                        serviceCategories: []
                    });

                    showStatus('Registered successfully. Please login after admin approval.', 'success');
                    setTimeout(() => (window.location.href = 'vendor-login.html'), 800);
                }
            } catch (err) {
                showStatus(err.message || 'Registration failed', 'error');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = (document.getElementById('loginEmail') || document.getElementById('email'))?.value;
            const password = (document.getElementById('loginPassword') || document.getElementById('password'))?.value;
            const remember = (document.getElementById('rememberMe') || document.getElementById('remember'))?.checked ?? true;

            if (!email || !password) {
                showLoginStatus('Email and password are required', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showLoginStatus('Please enter a valid email address', 'error');
                return;
            }

            try {
                const data = await apiRequest('/vendor/auth/login', 'POST', { email, password });
                if (!data.token) throw new Error('Token missing from response');

                setVendorToken(data.token, remember);
                localStorage.setItem('vendorInfo', JSON.stringify(data.vendor || {}));
                localStorage.setItem('fastsewa_vendor', JSON.stringify(data.vendor || {}));

                showLoginStatus('✓ Login successful! Redirecting to dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = 'vendor-dashboard.html';
                }, 900);
            } catch (err) {
                showLoginStatus(err.message || 'Login failed', 'error');
            }
        });
    }
});
