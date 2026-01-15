// Signup Form Handler
document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }

    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', handleVerifyOtp);
    }

    const resendOtpBtn = document.getElementById('resendOtpBtn');
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', handleResendOtp);
    }

    const changeEmailBtn = document.getElementById('changeEmailBtn');
    if (changeEmailBtn) {
        changeEmailBtn.addEventListener('click', resetOtpFlow);
    }

    // Handle role change
    const userRole = document.getElementById('userRole');
    if (userRole) {
        userRole.addEventListener('change', toggleUserType);
    }
});

let pendingOtpEmail = null;

function setOtpMessage(message, visible = true) {
    const el = document.getElementById('otpMessage');
    if (!el) return;
    if (!visible) {
        el.style.display = 'none';
        el.textContent = '';
        return;
    }
    el.textContent = String(message || '');
    el.style.display = 'block';
}

function setSignupLoading(isLoading) {
    const btn = document.getElementById('signupBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('btnSpinner');

    if (!btn || !btnText || !spinner) return;

    if (isLoading) {
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        btn.style.opacity = '0.7';
        btn.disabled = true;
    } else {
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        btn.style.opacity = '1';
        btn.disabled = false;
    }
}

function setSignupInputsDisabled(disabled) {
    const ids = [
        'fname', 'lname', 'email', 'userRole', 'userType',
        'vendorServiceCategory', 'vendorBusinessName', 'vendorOwnerName', 'vendorPhone', 'vendorCity',
        'vendorAadhaar', 'vendorPan', 'vendorGst', 'vendorExperience', 'vendorTurnoverBelowLimit',
        'pass', 'cpass'
    ];

    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.disabled = Boolean(disabled);
    });
}

function showOtpSection(email) {
    pendingOtpEmail = String(email || '').trim();
    localStorage.setItem('pendingVerifyEmail', pendingOtpEmail);

    const otpSection = document.getElementById('otpSection');
    const emailPreview = document.getElementById('otpEmailPreview');
    const emailOtp = document.getElementById('emailOtp');
    const signupBtn = document.getElementById('signupBtn');

    if (emailPreview) emailPreview.textContent = pendingOtpEmail;
    if (otpSection) otpSection.style.display = 'block';
    if (signupBtn) signupBtn.style.display = 'none';
    if (emailOtp) {
        emailOtp.value = '';
        emailOtp.focus();
    }

    setOtpMessage('', false);
    setSignupInputsDisabled(true);
}

function resetOtpFlow() {
    pendingOtpEmail = null;
    localStorage.removeItem('pendingVerifyEmail');

    const otpSection = document.getElementById('otpSection');
    const signupBtn = document.getElementById('signupBtn');
    if (otpSection) otpSection.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'block';

    setOtpMessage('', false);
    setSignupInputsDisabled(false);
}

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

async function handleVerifyOtp() {
    const API_BASE = getApiBase();
    const otp = String(document.getElementById('emailOtp')?.value || '').trim();
    const email = (pendingOtpEmail || localStorage.getItem('pendingVerifyEmail') || '').trim();

    if (!email) {
        setOtpMessage('Missing email. Please change email and try again.');
        return;
    }

    if (!otp || otp.length < 4) {
        setOtpMessage('Please enter the verification code sent to your email.');
        return;
    }

    try {
        setOtpMessage('Verifying...', true);

        const response = await fetch(`${API_BASE}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Verification failed');

        // Store auth and login immediately
        const normalizedUser = { ...(data.user || {}), isLoggedIn: true };
        if (!normalizedUser.name) {
            normalizedUser.name =
                normalizedUser.fullName ||
                `${normalizedUser.firstName || ''} ${normalizedUser.lastName || ''}`.trim() ||
                normalizedUser.email ||
                'User';
        }

        localStorage.setItem('fastsewaUser', JSON.stringify(normalizedUser));
        localStorage.setItem('fastsewa_current_user', JSON.stringify(normalizedUser));
        if (data.token) {
            localStorage.setItem('fastsewaToken', data.token);
            localStorage.setItem('fastsewa_token', data.token);
        }

        localStorage.removeItem('pendingVerifyEmail');
        setOtpMessage('✅ Email verified. Redirecting...', true);
        window.location.href = 'index.html';
    } catch (err) {
        setOtpMessage('❌ ' + (err.message || 'Verification failed'));
    }
}

async function handleResendOtp() {
    const API_BASE = getApiBase();
    const email = (pendingOtpEmail || localStorage.getItem('pendingVerifyEmail') || '').trim();

    if (!email) {
        setOtpMessage('Missing email. Please change email and try again.');
        return;
    }

    try {
        setOtpMessage('Sending a new code...', true);
        const response = await fetch(`${API_BASE}/auth/resend-email-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Resend failed');

        const extra = data.otp ? ` (Dev OTP: ${data.otp})` : '';
        setOtpMessage((data.message || 'Verification code sent') + extra, true);
    } catch (err) {
        setOtpMessage('❌ ' + (err.message || 'Resend failed'));
    }
}

function toggleUserType() {
    const role = document.getElementById('userRole').value;
    const userTypeGroup = document.getElementById('userTypeGroup');
    const userTypeSelect = document.getElementById('userType');

    const nameRow = document.getElementById('nameRow');
    const vendorFields = document.getElementById('vendorFields');
    const vendorRequiredIds = ['vendorServiceCategory', 'vendorBusinessName', 'vendorOwnerName', 'vendorPhone', 'vendorAadhaar', 'vendorPan'];
    const userRequiredIds = ['fname', 'lname'];

    const setRequired = (id, required) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (required) el.setAttribute('required', 'required');
        else el.removeAttribute('required');
    };

    if (role === 'vendor') {
        if (nameRow) nameRow.style.display = 'none';
        if (vendorFields) vendorFields.style.display = 'block';

        userRequiredIds.forEach((id) => setRequired(id, false));
        vendorRequiredIds.forEach((id) => setRequired(id, true));

        userTypeGroup.style.display = 'none';
        userTypeSelect.removeAttribute('required');
        return;
    }

    if (nameRow) nameRow.style.display = 'grid';
    if (vendorFields) vendorFields.style.display = 'none';
    vendorRequiredIds.forEach((id) => setRequired(id, false));
    userRequiredIds.forEach((id) => setRequired(id, true));

    if (role === 'admin') {
        userTypeGroup.style.display = 'none';
        userTypeSelect.removeAttribute('required');
    } else {
        userTypeGroup.style.display = 'block';
        userTypeSelect.setAttribute('required', 'required');
    }
}

function isValidEmail(email) {
    const e = String(email || '').trim();
    if (!e) return false;
    if (e.length > 254) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
    if (e.includes('..')) return false;
    return true;
}

async function handleSignupSubmit(e) {
    e.preventDefault();

    // If OTP step is visible, treat submit as verify
    const otpSection = document.getElementById('otpSection');
    if (otpSection && otpSection.style.display !== 'none') {
        await handleVerifyOtp();
        return;
    }

    const fname = document.getElementById('fname').value.trim();
    const lname = document.getElementById('lname').value.trim();
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('pass').value;
    const cpass = document.getElementById('cpass').value;
    const role = document.getElementById('userRole').value;
    const userType = document.getElementById('userType').value;

    const API_BASE = getApiBase();

    // Vendor signup (no redirect)
    if (role === 'vendor') {
        const serviceCategory = document.getElementById('vendorServiceCategory')?.value;
        const businessName = document.getElementById('vendorBusinessName')?.value?.trim();
        const ownerName = document.getElementById('vendorOwnerName')?.value?.trim();
        const phone = document.getElementById('vendorPhone')?.value?.trim();
        const city = document.getElementById('vendorCity')?.value?.trim();
        const aadhaarNumber = document.getElementById('vendorAadhaar')?.value?.trim();
        const panNumber = document.getElementById('vendorPan')?.value?.trim();
        const gstNumber = document.getElementById('vendorGst')?.value?.trim();
        const experienceYears = document.getElementById('vendorExperience')?.value;
        const turnoverBelowLimit = Boolean(document.getElementById('vendorTurnoverBelowLimit')?.checked);

        if (!isValidEmail(email)) {
            alert('❌ Please enter a valid email address');
            return;
        }

        if (!serviceCategory || !businessName || !ownerName || !phone || !aadhaarNumber || !panNumber) {
            alert('❌ Please fill all required vendor fields');
            return;
        }

        if (String(phone).length !== 10 || isNaN(Number(phone))) {
            alert('❌ Phone number must be 10 digits');
            return;
        }

        // Start Loading
        setSignupLoading(true);

        try {
            const response = await fetch(`${API_BASE}/vendor/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
                    experienceYears: experienceYears ? Number(experienceYears) : undefined,
                    password: pass,
                    confirmPassword: cpass
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Vendor signup failed');

            alert('✅ Vendor registration submitted! Please wait for admin approval, then login as Vendor.');
            window.location.href = 'login.html';
        } catch (err) {
            alert('❌ ' + (err.message || 'Vendor signup failed'));
            setSignupLoading(false);
        }
        return;
    }

    // Validation
    if (!fname || !lname || !email || !pass || !cpass) {
        alert('❌ Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        alert('❌ Please enter a valid email address');
        return;
    }

    if (pass !== cpass) {
        alert('❌ Passwords do not match!');
        return;
    }

    if (pass.length < 6) {
        alert('❌ Password must be at least 6 characters');
        return;
    }

    try {
        setSignupLoading(true);

        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: fname,
                lastName: lname,
                email: email,
                password: pass,
                confirmPassword: cpass,
                role: role,
                userType: role === 'user' ? userType : null
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }

        if (data.needsEmailVerification) {
            const emailToVerify = (data.email || email).trim();
            const extra = data.otp ? `\n\nDev code: ${data.otp}` : '';
            alert('✅ ' + (data.message || 'Verification code sent. Please verify your email.') + extra);
            showOtpSection(emailToVerify);
            if (data.otp) {
                setOtpMessage(`Dev code: ${data.otp}`, true);
            }
            setSignupLoading(false);
            return;
        }

        if (data.needsApproval) {
            alert('✅ ' + data.message + '\n\nPlease wait for admin approval to login.');
            window.location.href = 'login.html';
        } else {
            // Auto-login for regular users
            // Normalize user shape for pages that expect `user.name` and `user.isLoggedIn`
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
            alert('✅ Account created successfully!');
            window.location.href = 'index.html';
        }
    } catch (err) {
        alert('❌ ' + err.message);
        setSignupLoading(false);
    }
}
