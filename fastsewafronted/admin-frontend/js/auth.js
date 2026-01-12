// Authentication Module
const Auth = {
    async login(email, password) {
        try {
            const data = await apiRequest('/auth/login', {
                method: 'POST',
                includeAuth: false,
                body: JSON.stringify({ email, password })
            });

            if (!data.token) {
                throw new Error('No token received from server');
            }

            setToken(data.token);
            return data;
        } catch (err) {
            console.error('Login error:', err);
            throw err;
        }
    },

    async signup(email, password, confirmPassword) {
        try {
            // Generate username from email
            const username = email.split('@')[0] + '_' + Date.now();

            const data = await apiRequest('/auth/admin-signup', {
                method: 'POST',
                includeAuth: false,
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    confirmPassword
                })
            });

            return data;
        } catch (err) {
            console.error('Signup error:', err);
            throw err;
        }
    },

    logout() {
        removeToken();
        location.reload();
    },

    isAuthenticated() {
        return !!getToken();
    }
};

// Login Form Handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    try {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');

        const data = await Auth.login(email, password);

        // Display username if available
        if (data.user?.name) {
            document.getElementById('userName').textContent = data.user.name;
        }

        showAdminPanel();
        loadAllData();

    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
    }
});

// Signup Form Handler
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const errorEl = document.getElementById('signupError');
    const successEl = document.getElementById('signupSuccess');

    try {
        errorEl.textContent = '';
        successEl.textContent = '';
        errorEl.classList.add('hidden');
        successEl.classList.add('hidden');

        // Validate form
        if (!email || !password || !confirmPassword) {
            throw new Error('All fields are required');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Call signup
        const data = await Auth.signup(email, password, confirmPassword);

        successEl.textContent = data.message || 'Your request has been submitted! Please wait for admin approval.';
        successEl.classList.remove('hidden');

        // Reset form
        document.getElementById('signupForm').reset();

        setTimeout(() => {
            toggleSignup();
        }, 2000);

    } catch (err) {
        console.error('Signup form error:', err);
        errorEl.textContent = err.message || 'Failed to submit request';
        errorEl.classList.remove('hidden');
    }
});

// UI Functions
function toggleSignup(e) {
    if (e) e.preventDefault();

    document.getElementById('loginScreen').classList.toggle('hidden');
    document.getElementById('signupScreen').classList.toggle('hidden');

    // Clear forms
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
    document.getElementById('loginError').textContent = '';
    document.getElementById('signupError').textContent = '';
    document.getElementById('signupSuccess').textContent = '';
}

function showAdminPanel() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('signupScreen').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        Auth.logout();
    }
}

// Check if already authenticated
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isAuthenticated()) {
        showAdminPanel();
    }
});
