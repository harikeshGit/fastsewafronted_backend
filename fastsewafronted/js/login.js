// Login Form Handler
console.log('login.js loaded');

// Optional: force logout via login.html?logout=1
try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === '1') {
        localStorage.removeItem('fastsewaUser');
        localStorage.removeItem('fastsewa_current_user');
        localStorage.removeItem('fastsewaToken');
        localStorage.removeItem('fastsewa_token');
        params.delete('logout');
        const qs = params.toString();
        const cleanUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash || ''}`;
        window.history.replaceState({}, '', cleanUrl);
    }
} catch {
    // ignore
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('login.js DOMContentLoaded');
    const loginForm = document.getElementById('loginForm');
    const roleSelect = document.getElementById('loginRole');

    // Social login buttons
    const googleBtn = document.getElementById('googleLoginBtn');
    const facebookBtn = document.getElementById('facebookLoginBtn');
    if (googleBtn && !googleBtn.dataset.listenerAttached) {
        googleBtn.addEventListener('click', handleGoogleLogin);
        googleBtn.dataset.listenerAttached = 'true';
    }
    if (facebookBtn && !facebookBtn.dataset.listenerAttached) {
        facebookBtn.addEventListener('click', handleFacebookLogin);
        facebookBtn.dataset.listenerAttached = 'true';
    }

    // Preselect role via querystring: login.html?role=vendor
    try {
        const params = new URLSearchParams(window.location.search);
        const role = String(params.get('role') || '').toLowerCase();
        if (roleSelect && ['user', 'admin', 'vendor'].includes(role)) {
            roleSelect.value = role;
        }
    } catch {
        // ignore
    }

    if (!loginForm) {
        console.error('Login form not found (#loginForm)');
        return;
    }

    // Prevent duplicate bindings (e.g., if script is loaded twice)
    if (loginForm.dataset.listenerAttached === 'true') {
        console.warn('Login form listener already attached');
        return;
    }

    loginForm.addEventListener('submit', handleLoginSubmit);
    loginForm.dataset.listenerAttached = 'true';
    console.log('Login form submit listener attached');
});

function getApiBase() {
    const custom = window.localStorage.getItem('apiUrl');
    if (custom) return `${custom.replace(/\/+$/, '')}/api`;

    const hostname = (window.location.hostname || '').toLowerCase();
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1' || hostname === '::';
    if (isLocalHost) return 'http://localhost:4000/api';

    const origin = window.location.origin;
    if (!origin || origin === 'null') return 'http://localhost:4000/api';
    return `${origin}/api`;
}

function isValidEmail(email) {
    const e = String(email || '').trim();
    if (!e) return false;
    if (e.length > 254) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
    if (e.includes('..')) return false;
    return true;
}

function persistAuthResult(data) {
    const actualRole = String(data?.user?.role || 'user').toLowerCase();

    const normalizedUser = { ...data.user, isLoggedIn: true };
    if (!normalizedUser.name) {
        normalizedUser.name =
            normalizedUser.fullName ||
            `${normalizedUser.firstName || ''} ${normalizedUser.lastName || ''}`.trim() ||
            normalizedUser.email ||
            'User';
    }

    localStorage.setItem('fastsewaUser', JSON.stringify(normalizedUser));
    localStorage.setItem('fastsewa_current_user', JSON.stringify(normalizedUser));
    localStorage.setItem('fastsewaToken', data.token);
    localStorage.setItem('fastsewa_token', data.token);

    if (actualRole === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

function getOAuthClientConfig() {
    // Configure these in browser DevTools once per device:
    // localStorage.setItem('googleClientId', '...')
    // localStorage.setItem('facebookAppId', '...')
    return {
        googleClientId: (localStorage.getItem('googleClientId') || '').trim(),
        facebookAppId: (localStorage.getItem('facebookAppId') || '').trim(),
    };
}

function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        const existing = Array.from(document.scripts || []).find((s) => s?.src === src);
        if (existing) return resolve();

        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(s);
    });
}

async function handleGoogleLogin() {
    const { googleClientId } = getOAuthClientConfig();
    if (!googleClientId) {
        alert('❌ Google login is not configured. Set localStorage.googleClientId (Google OAuth Client ID) and try again.');
        return;
    }

    try {
        await loadScriptOnce('https://accounts.google.com/gsi/client');
        if (!window.google?.accounts?.id) {
            throw new Error('Google Identity Services failed to initialize');
        }

        const apiBase = getApiBase();

        await new Promise((resolve, reject) => {
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: async (resp) => {
                    try {
                        const idToken = resp?.credential;
                        if (!idToken) throw new Error('Google did not return a credential');

                        const r = await fetch(`${apiBase}/auth/google`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ idToken })
                        });
                        const data = await r.json();
                        if (!r.ok) throw new Error(data.error || 'Google login failed');

                        alert('✅ Login Successful!');
                        persistAuthResult(data);
                        resolve();
                    } catch (e) {
                        alert('❌ ' + (e.message || 'Google login failed'));
                        reject(e);
                    }
                },
            });

            // Prompt shows the Google account chooser.
            window.google.accounts.id.prompt((n) => {
                if (n?.isNotDisplayed() || n?.isSkippedMoment()) {
                    // Not fatal; user may have closed it.
                    resolve();
                }
            });
        });
    } catch (err) {
        alert('❌ ' + (err.message || 'Google login failed'));
    }
}

async function ensureFacebookSdk(appId) {
    if (window.FB) return;

    window.fbAsyncInit = function () {
        window.FB.init({
            appId,
            cookie: true,
            xfbml: false,
            version: 'v19.0'
        });
    };

    await loadScriptOnce('https://connect.facebook.net/en_US/sdk.js');
    if (!window.FB) {
        throw new Error('Facebook SDK failed to load');
    }
}

async function handleFacebookLogin() {
    const { facebookAppId } = getOAuthClientConfig();
    if (!facebookAppId) {
        alert('❌ Facebook login is not configured. Set localStorage.facebookAppId (Facebook App ID) and try again.');
        return;
    }

    try {
        await ensureFacebookSdk(facebookAppId);
        const apiBase = getApiBase();

        const authResp = await new Promise((resolve, reject) => {
            window.FB.login(
                (response) => {
                    if (!response || response.status !== 'connected') {
                        return reject(new Error('Facebook login was cancelled or not authorized'));
                    }
                    resolve(response.authResponse);
                },
                { scope: 'email,public_profile' }
            );
        });

        const accessToken = authResp?.accessToken;
        if (!accessToken) throw new Error('Facebook did not return an access token');

        const r = await fetch(`${apiBase}/auth/facebook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken })
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Facebook login failed');

        alert('✅ Login Successful!');
        persistAuthResult(data);
    } catch (err) {
        alert('❌ ' + (err.message || 'Facebook login failed'));
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    console.log('Login submit triggered');

    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('btnSpinner');
    const roleSelect = document.getElementById('loginRole');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const rememberEl = document.getElementById('rememberMe');

    if (!emailInput || !passwordInput) {
        alert('❌ Login fields not found on page');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const selectedRole = (roleSelect?.value || 'user').toLowerCase();
    const remember = rememberEl ? Boolean(rememberEl.checked) : true;

    // Validation
    if (!email || !password) {
        alert('❌ Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        alert('❌ Please enter a valid email address');
        return;
    }

    // Start Loading
    if (btnText) btnText.style.display = 'none';
    if (spinner) spinner.style.display = 'block';
    if (btn) {
        btn.style.opacity = '0.7';
        btn.disabled = true;
    }

    try {
        const API_BASE = getApiBase();
        if (selectedRole === 'vendor') {
            const response = await fetch(`${API_BASE}/vendor/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Vendor login failed');

            const token = data.token;
            if (!token) throw new Error('Token missing from vendor login response');

            const vendorTokenKeys = ['fastsewaVendorToken', 'fastsewa_vendor_token', 'vendorToken'];
            if (remember) {
                vendorTokenKeys.forEach((k) => localStorage.setItem(k, token));
                sessionStorage.removeItem('vendorToken');
            } else {
                sessionStorage.setItem('vendorToken', token);
                vendorTokenKeys.forEach((k) => localStorage.removeItem(k));
            }

            localStorage.setItem('vendorInfo', JSON.stringify(data.vendor || {}));
            localStorage.setItem('fastsewa_vendor', JSON.stringify(data.vendor || {}));

            alert('✅ Vendor Login Successful!');
            window.location.href = 'vendor-dashboard.html';
            return;
        }

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Enforce chosen role (avoid logging into a user account when "Admin" is selected and vice-versa)
        const actualRole = String(data?.user?.role || '').toLowerCase();
        if (selectedRole === 'admin' && actualRole !== 'admin') {
            throw new Error('This account is not an admin. Please choose "User" to login.');
        }
        if (selectedRole === 'user' && actualRole !== 'user') {
            throw new Error('Please choose "Admin" to login with an admin account.');
        }

        // Normalize user shape for pages that expect `user.name` and `user.isLoggedIn`
        const normalizedUser = { ...data.user, isLoggedIn: true };
        if (!normalizedUser.name) {
            normalizedUser.name =
                normalizedUser.fullName ||
                `${normalizedUser.firstName || ''} ${normalizedUser.lastName || ''}`.trim() ||
                normalizedUser.email ||
                'User';
        }

        // Save user and token
        localStorage.setItem('fastsewaUser', JSON.stringify(normalizedUser));
        // Used by the main auth helper
        localStorage.setItem('fastsewa_current_user', JSON.stringify(normalizedUser));
        localStorage.setItem('fastsewaToken', data.token);
        // Backward compatibility (some code reads this key)
        localStorage.setItem('fastsewa_token', data.token);

        alert('✅ Login Successful!');

        // Redirect based on role
        if (data.user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        alert('❌ ' + err.message);
        if (btnText) btnText.style.display = 'block';
        if (spinner) spinner.style.display = 'none';
        if (btn) {
            btn.style.opacity = '1';
            btn.disabled = false;
        }
    }
}
