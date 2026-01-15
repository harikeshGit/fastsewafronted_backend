// Allow admin/user dashboards to open the public website in a logged-out state.
// Usage: index.html?logout=1
(function () {
    if (window.__fastsewaLogoutHandled) return;
    window.__fastsewaLogoutHandled = true;

    // Normalize stored auth state so pages consistently detect "logged in"
    // Many pages check: user && user.isLoggedIn
    try {
        const token = localStorage.getItem('fastsewaToken') || localStorage.getItem('fastsewa_token');
        const rawUser = localStorage.getItem('fastsewa_current_user') || localStorage.getItem('fastsewaUser');

        if (token && rawUser) {
            let user;
            try {
                user = JSON.parse(rawUser);
            } catch {
                user = null;
            }

            if (user && typeof user === 'object') {
                user.isLoggedIn = true;

                if (!user.name) {
                    user.name =
                        user.fullName ||
                        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                        user.email ||
                        'User';
                }

                const serialized = JSON.stringify(user);
                localStorage.setItem('fastsewaUser', serialized);
                localStorage.setItem('fastsewa_current_user', serialized);
            }
        }
    } catch {
        // ignore
    }

    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('logout') !== '1') return;

        localStorage.removeItem('fastsewaToken');
        localStorage.removeItem('fastsewa_token');
        localStorage.removeItem('fastsewaUser');
        localStorage.removeItem('fastsewa_current_user');

        // Clean the URL so refresh doesn't keep logging out.
        params.delete('logout');
        const qs = params.toString();
        const cleanUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash || ''}`;
        window.history.replaceState({}, '', cleanUrl);
    } catch {
        // ignore
    }
})();

// If an admin deletes/blocks a user, the browser may still have an old token/user in localStorage.
// Validate the token against the server and auto-logout if it is no longer valid.
(function () {
    if (window.__fastsewaSessionValidated) return;
    window.__fastsewaSessionValidated = true;

    const token = localStorage.getItem('fastsewaToken') || localStorage.getItem('fastsewa_token');
    if (!token) return;

    const getApiBase = () => {
        const custom = window.localStorage.getItem('apiUrl');
        if (custom) return `${custom.replace(/\/+$/, '')}/api`;

        const hostname = (window.location.hostname || '').toLowerCase();
        const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1' || hostname === '::';
        if (isLocalHost) return 'http://localhost:4000/api';

        const origin = window.location.origin;
        if (!origin || origin === 'null') return 'http://localhost:4000/api';
        return `${origin}/api`;
    };

    const clearAuth = () => {
        localStorage.removeItem('fastsewaToken');
        localStorage.removeItem('fastsewa_token');
        localStorage.removeItem('fastsewaUser');
        localStorage.removeItem('fastsewa_current_user');
    };

    // Run after DOM load so we can update nav UI if needed.
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const apiBase = getApiBase();
            const r = await fetch(`${apiBase}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (r.status === 401 || r.status === 403) {
                clearAuth();
                try { fastsewaUpdateNavbarAuthUI(); } catch { /* ignore */ }
                return;
            }

            // Refresh stored user with the server's current value when available.
            const data = await r.json().catch(() => null);
            if (data && data.success && data.user) {
                const normalized = { ...data.user, isLoggedIn: true };
                localStorage.setItem('fastsewaUser', JSON.stringify(normalized));
                localStorage.setItem('fastsewa_current_user', JSON.stringify(normalized));
                try { fastsewaUpdateNavbarAuthUI(); } catch { /* ignore */ }
            }
        } catch {
            // If offline or backend is unreachable, keep the session as-is.
        }
    });
})();

function fastsewaGetStoredAuth() {
    try {
        const token = localStorage.getItem('fastsewaToken') || localStorage.getItem('fastsewa_token');
        const rawUser = localStorage.getItem('fastsewa_current_user') || localStorage.getItem('fastsewaUser');
        const user = rawUser ? JSON.parse(rawUser) : null;
        const isLoggedIn = Boolean(token && user);

        const displayName =
            (user && (user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email)) ||
            'User';

        const role = (user && (user.role || user.userRole)) || 'user';
        const dashboardHref = role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';

        return { isLoggedIn, user, displayName, role, dashboardHref };
    } catch {
        return { isLoggedIn: false, user: null, displayName: 'User', role: 'user', dashboardHref: 'dashboard.html' };
    }
}

function fastsewaUpdateNavbarAuthUI() {
    const { isLoggedIn, displayName, dashboardHref } = fastsewaGetStoredAuth();

    // Find the main nav list
    const navList = document.querySelector('nav.navbar ul.nav-links') || document.querySelector('ul.nav-links');
    if (!navList) return;

    // Find the existing Login/Signup anchor (common patterns)
    const candidateAuthAnchors = Array.from(navList.querySelectorAll('a[href]'))
        .filter((a) => {
            const href = (a.getAttribute('href') || '').toLowerCase();
            const txt = (a.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
            return href.endsWith('login.html') || txt.includes('login/signup') || txt.includes('login / signup');
        });

    const authAnchor = candidateAuthAnchors[0] || null;
    const authListItem = authAnchor ? authAnchor.closest('li') : null;

    // Ensure Dashboard nav item exists only when logged in
    const existingDashboardItem = navList.querySelector('#fastsewa-dashboard-nav');
    if (!isLoggedIn) {
        if (existingDashboardItem) existingDashboardItem.remove();
        if (authAnchor) {
            authAnchor.textContent = 'Login/Signup';
            authAnchor.setAttribute('href', 'login.html');
        }
        return;
    }

    if (!existingDashboardItem) {
        const li = document.createElement('li');
        li.id = 'fastsewa-dashboard-nav';
        const a = document.createElement('a');
        a.textContent = 'Dashboard';
        a.setAttribute('href', dashboardHref);
        li.appendChild(a);

        if (authListItem && authListItem.parentElement === navList) {
            navList.insertBefore(li, authListItem);
        } else {
            navList.appendChild(li);
        }
    } else {
        const link = existingDashboardItem.querySelector('a');
        if (link) link.setAttribute('href', dashboardHref);
    }

    // Replace Login/Signup with username
    if (authAnchor) {
        authAnchor.textContent = displayName;
        authAnchor.setAttribute('href', dashboardHref);
    } else {
        // Fallback: try to find the exact auth-action container used on index.html
        const authAction = document.getElementById('auth-action');
        const fallbackAnchor = authAction ? authAction.querySelector('a') : null;
        if (fallbackAnchor) {
            fallbackAnchor.textContent = displayName;
            fallbackAnchor.setAttribute('href', dashboardHref);
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Prevent duplicate initialization if footer.js is included more than once.
    if (window.__fastsewaFooterDomInitDone) return;
    window.__fastsewaFooterDomInitDone = true;

    fastsewaUpdateNavbarAuthUI();

    const footerContainer = document.getElementById("fastsewa-footer");

    if (footerContainer) {
        footerContainer.innerHTML = `
        <footer class="main-footer">
            <div class="footer-container">
                
                <div class="footer-col">
                    <a href="index.html" style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; text-decoration: none;">
                        <img src="images/logo1.png" alt="FastSewa" style="height: 40px;">
                        <span style="font-size: 1.5rem; font-weight: 800; color: white;">FastSewa<span style="color: #ff5722;">.</span></span>
                    </a>
                    <p style="margin-bottom: 20px; line-height: 1.6;">
                        Bihar's #1 Super Portal for Construction, Medical, Legal, and Home Services. Verified Professionals, Transparent Pricing.
                    </p>
                    <div class="social-icons">
                        <a href="https://facebook.com/fastsewa.20" target="_blank" class="social-icon"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://instagram.com" target="_blank" class="social-icon"><i class="fab fa-instagram"></i></a>
                        <a href="https://linkedin.com/in/fastsewa-facilities" target="_blank" class="social-icon"><i class="fab fa-linkedin-in"></i></a>
                        
                        <a href="https://wa.me/918275723755" target="_blank" class="social-icon" title="Chat on WhatsApp"><i class="fab fa-whatsapp"></i></a>
                        <a href="tel:+918275723755" class="social-icon" title="Call Now"><i class="fas fa-phone-alt"></i></a>
                    </div>
                </div>

                <div class="footer-col">
                    <h3>Our Services</h3>
                    <ul class="footer-links">
                        <li><a href="newconstruction.html"><i class="fas fa-chevron-right"></i> Construction</a></li>
                        <li><a href="material.html"><i class="fas fa-chevron-right"></i> Material Supply</a></li>
                        <li><a href="security.html"><i class="fas fa-chevron-right"></i> Security Guard</a></li>
                        <li><a href="medical.html"><i class="fas fa-chevron-right"></i> Medical Aid</a></li>
                        <li><a href="legal.html"><i class="fas fa-chevron-right"></i> Legal & Corporate</a></li>
                        <li><a href="gst.html"><i class="fas fa-chevron-right"></i> GST Filing</a></li>
                        <li><a href="incometax.html"><i class="fas fa-chevron-right"></i> Income Tax (ITR)</a></li>
                        <li><a href="trademark.html"><i class="fas fa-chevron-right"></i> Trademark & IP</a></li> <li><a href="land.html"><i class="fas fa-chevron-right"></i> Land Verification</a></li>
                        <li><a href="finance.html"><i class="fas fa-chevron-right"></i> Finance & Loans</a></li>
                        <li><a href="repair.html"><i class="fas fa-chevron-right"></i> Repairs</a></li>
                    </ul>
                </div>

                <div class="footer-col">
                    <h3>Contact Us</h3>
                    <div class="contact-list">
                        <p><i class="fas fa-map-marker-alt"></i> B Hub, Gandhi Maidan,<br>Patna, Bihar 800001</p>
                        <p><i class="fas fa-phone-alt"></i> <a href="tel:+918275723755" style="color: inherit; padding:0;">+91 82757 23755</a></p>
                        <p><i class="fas fa-envelope"></i> <a href="mailto:fastsewa2020@gmail.com" style="color: inherit; padding:0;">fastsewa2020@gmail.com</a></p>
                        <p><i class="fas fa-clock"></i> Mon - Sat: 9:00 AM - 8:00 PM</p>
                    </div>
                </div>

                <div class="footer-col">
                    <h3>Live Analytics</h3>
                    <div class="visitor-widget">
                        <div class="stat-row">
                            <span>Total Visitors:</span>
                            <span class="stat-num" style="color: #ff5722;">12,540</span>
                        </div>
                        <div class="stat-row">
                            <span>Repeated Users:</span>
                            <span class="stat-num">3,420</span>
                        </div>
                        <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 10px 0;"></div>
                        <div class="stat-row" style="margin-bottom: 0;">
                            <span><span class="online-dot"></span> Online Now:</span>
                            <span class="stat-num" style="color: #22c55e;">24</span>
                        </div>
                    </div>
                    
                    <h3 style="margin-top: 25px; font-size: 1rem;">Quick Links</h3>
                    <ul class="footer-links">
                        <li><a href="login.html">Login / Signup</a></li>
                        <li><a href="dashboard.html">User Dashboard</a></li>
                        <li><a href="support1.html">Support Center</a></li> <li><a href="team.html">Our Team</a></li>
                        <li><a href="terms.html">Terms & Conditions</a></li>
                    </ul>
                </div>

            </div>

            <div class="footer-bottom">
                <p>&copy; 2026 FastSewa Super Portal. All rights reserved. | Developed by <a href="https://www.linkedin.com/in/nitish-kumar-762461281/" target="_blank" style="color: #ff5722; text-decoration: none; font-weight: 600;">Team Nitish Kumar</a>.</p>
            </div>
        </footer>

        <a href="https://wa.me/918275723755" class="whatsapp-float" target="_blank" title="Chat on WhatsApp">
            <i class="fab fa-whatsapp"></i>
        </a>
        `;
    }
});