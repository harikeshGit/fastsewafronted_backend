// Signup Form Handler
document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }

    // Handle role change
    const userRole = document.getElementById('userRole');
    if (userRole) {
        userRole.addEventListener('change', toggleUserType);
    }
});

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

async function handleSignupSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('signupBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('btnSpinner');

    const fname = document.getElementById('fname').value.trim();
    const lname = document.getElementById('lname').value.trim();
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('pass').value;
    const cpass = document.getElementById('cpass').value;
    const role = document.getElementById('userRole').value;
    const userType = document.getElementById('userType').value;

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

        if (!serviceCategory || !businessName || !ownerName || !phone || !aadhaarNumber || !panNumber) {
            alert('❌ Please fill all required vendor fields');
            return;
        }

        if (String(phone).length !== 10 || isNaN(Number(phone))) {
            alert('❌ Phone number must be 10 digits');
            return;
        }

        // Start Loading
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        btn.style.opacity = '0.7';
        btn.disabled = true;

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
            btnText.style.display = 'block';
            spinner.style.display = 'none';
            btn.style.opacity = '1';
            btn.disabled = false;
        }
        return;
    }

    // Validation
    if (!fname || !lname || !email || !pass || !cpass) {
        alert('❌ Please fill in all fields');
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
        // Start Loading
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        btn.style.opacity = '0.7';
        btn.disabled = true;

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
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        btn.style.opacity = '1';
        btn.disabled = false;
    }
}
