// Admin Dashboard Handler
const API_URL = (() => {
    const custom = window.localStorage.getItem('apiUrl');
    if (custom) return `${custom.replace(/\/+$/, '')}/api`;

    const hostname = (window.location.hostname || '').toLowerCase();
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1' || hostname === '::';
    if (isLocalHost) return 'http://localhost:4000/api';

    const origin = window.location.origin;
    if (!origin || origin === 'null') return 'http://localhost:4000/api';
    return `${origin}/api`;
})();
let currentUser = null;
let authToken = null;

document.addEventListener('DOMContentLoaded', function () {
    if (checkAuth()) {
        loadBookings();
    }
});

// Check authentication and role
function checkAuth() {
    const rawUser = localStorage.getItem('fastsewa_current_user') || localStorage.getItem('fastsewaUser');
    const rawToken = localStorage.getItem('fastsewaToken') || localStorage.getItem('fastsewa_token');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token = rawToken || null;

    if (!user || !token) {
        alert('⚠️ Please login first');
        window.location.href = 'login.html';
        return false;
    }

    if (user.role !== 'admin') {
        alert('🚫 Access Denied: Admin only area');
        window.location.href = 'index.html';
        return false;
    }

    currentUser = user;
    authToken = token;

    // Update UI
    document.getElementById('userName').textContent = user.name || user.email;
    document.getElementById('userAvatar').textContent = (user.name || user.email).charAt(0).toUpperCase();

    return true;
}

// Logout
function logout() {
    // Clear all known auth keys used across pages
    localStorage.removeItem('fastsewaUser');
    localStorage.removeItem('fastsewa_current_user');
    localStorage.removeItem('fastsewaToken');
    localStorage.removeItem('fastsewa_token');

    // Route through login page cleanup too
    window.location.href = 'login.html?logout=1';
}

// Switch Tab
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');

    // Load data if not loaded
    if (tab === 'bookings' && !document.querySelector('#bookingsContent table')) {
        loadBookings();
    } else if (tab === 'users' && !document.querySelector('#usersContent table')) {
        loadUsers();
    } else if (tab === 'registrations' && !document.querySelector('#registrationsContent table')) {
        loadRegistrations();
    } else if (tab === 'vendors' && !document.querySelector('#vendorsContent table')) {
        loadVendors();
    }
}

// Load Vendors
async function loadVendors() {
    try {
        const response = await fetch(`${API_URL}/admin/vendors`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('Failed to load vendors');

        const payload = await response.json();
        const vendors = Array.isArray(payload) ? payload : (payload.vendors || []);
        document.getElementById('totalVendors').textContent = vendors.length;

        if (vendors.length === 0) {
            document.getElementById('vendorsContent').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-store-slash"></i>
                    <h3>No vendors yet</h3>
                    <p>Vendor registrations will appear here</p>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Categories</th>
                            <th>City</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        vendors.forEach(v => {
            const status = (v.status || 'PENDING_VERIFICATION').toLowerCase();
            const statusClass = status.includes('pending') ? 'status-pending' : status.includes('approved') ? 'status-approved' : 'status-rejected';

            const cats = Array.isArray(v.serviceCategories) ? v.serviceCategories.join(', ') : '';
            const rejection = v.rejectionReason ? ` — ${v.rejectionReason}` : '';

            const approvalButtons = v.status === 'APPROVED'
                ? `<span class="status-badge status-approved">Approved</span>`
                : `
                    <button class="btn-action approve" onclick="approveVendor('${v._id}')">Approve</button>
                    <button class="btn-action reject" onclick="rejectVendor('${v._id}')">Reject</button>
                  `;

            const blockButton = v.isActive
                ? `<button class="btn-action reject" onclick="setVendorActive('${v._id}', false)">Block</button>`
                : `<button class="btn-action approve" onclick="setVendorActive('${v._id}', true)">Unblock</button>`;

            const deleteButton = `<button class="btn-action reject" onclick="deleteVendor('${v._id}')">Delete</button>`;

            const actionButtons = `${approvalButtons} ${blockButton} ${deleteButton}`;

            tableHTML += `
                <tr>
                    <td>${v.name || 'N/A'}</td>
                    <td>${v.email || 'N/A'}</td>
                    <td>${cats || 'N/A'}</td>
                    <td>${v.city || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${v.status || 'PENDING_VERIFICATION'}${rejection}</span></td>
                    <td>${actionButtons}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table></div>`;
        document.getElementById('vendorsContent').innerHTML = tableHTML;
    } catch (err) {
        document.getElementById('vendorsContent').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading vendors</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}

async function setVendorActive(id, isActive) {
    const action = isActive ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} this vendor?`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/vendors/${id}/active`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ isActive })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Update failed');
        await loadVendors();
        alert(`✅ Vendor ${isActive ? 'unblocked' : 'blocked'}`);
    } catch (err) {
        alert(`❌ ${err.message}`);
    }
}

async function deleteVendor(id) {
    if (!confirm('Delete this vendor permanently? This cannot be undone.')) return;

    try {
        const response = await fetch(`${API_URL}/admin/vendors/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Delete failed');
        await loadVendors();
        alert('✅ Vendor deleted');
    } catch (err) {
        alert(`❌ ${err.message}`);
    }
}

async function approveVendor(id) {
    try {
        const response = await fetch(`${API_URL}/admin/vendors/${id}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!response.ok) throw new Error('Approve failed');
        await loadVendors();
        alert('✅ Vendor approved');
    } catch (err) {
        alert(`❌ ${err.message}`);
    }
}

async function rejectVendor(id) {
    const reason = prompt('Rejection reason (optional):') || '';
    try {
        const response = await fetch(`${API_URL}/admin/vendors/${id}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ reason })
        });
        if (!response.ok) throw new Error('Reject failed');
        await loadVendors();
        alert('✅ Vendor rejected');
    } catch (err) {
        alert(`❌ ${err.message}`);
    }
}

// Load Bookings
async function loadBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('Failed to load bookings');

        const bookings = await response.json();
        document.getElementById('totalBookings').textContent = bookings.length;

        if (bookings.length === 0) {
            document.getElementById('bookingsContent').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No bookings yet</h3>
                    <p>Bookings will appear here once users start booking services</p>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Customer</th>
                            <th>Phone</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        bookings.forEach(booking => {
            const statusClass = `status-${booking.status || 'pending'}`;
            tableHTML += `
                <tr>
                    <td>${booking.serviceName || 'N/A'}</td>
                    <td>${booking.customerName || 'N/A'}</td>
                    <td>${booking.phone || 'N/A'}</td>
                    <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
                    <td><span class="status-badge ${statusClass}">${booking.status || 'pending'}</span></td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table></div>`;
        document.getElementById('bookingsContent').innerHTML = tableHTML;

    } catch (err) {
        document.getElementById('bookingsContent').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading bookings</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}

// Load Users
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('Failed to load users');

        const payload = await response.json();
        const users = Array.isArray(payload) ? payload : (payload.users || []);
        document.getElementById('totalUsers').textContent = users.length;

        if (users.length === 0) {
            document.getElementById('usersContent').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <h3>No users yet</h3>
                    <p>Registered users will appear here</p>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>User Type</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        users.forEach(user => {
            const statusClass = user.isActive ? 'status-approved' : 'status-rejected';
            const statusText = user.isActive ? 'Active' : 'Inactive';
            const blockButton = user.isActive
                ? `<button class="btn-action reject" onclick="setUserActive('${user._id}', false)">Block</button>`
                : `<button class="btn-action approve" onclick="setUserActive('${user._id}', true)">Unblock</button>`;
            const deleteButton = `<button class="btn-action reject" onclick="deleteUser('${user._id}')">Delete</button>`;

            tableHTML += `
                <tr>
                    <td>${user.firstName} ${user.lastName}</td>
                    <td>${user.email}</td>
                    <td>${user.userType || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>${blockButton} ${deleteButton}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table></div>`;
        document.getElementById('usersContent').innerHTML = tableHTML;

    } catch (err) {
        document.getElementById('usersContent').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading users</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}

async function setUserActive(id, isActive) {
    const action = isActive ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${id}/active`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ isActive })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Update failed');
        await loadUsers();
        alert(`✅ User ${isActive ? 'unblocked' : 'blocked'}`);
    } catch (err) {
        alert(`❌ ${err.message}`);
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user permanently? This cannot be undone.')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Delete failed');
        await loadUsers();
        alert('✅ User deleted');
    } catch (err) {
        alert(`❌ ${err.message}`);
    }
}

// Load Registrations
async function loadRegistrations() {
    try {
        const response = await fetch(`${API_URL}/registrations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('Failed to load registrations');

        const registrations = await response.json();
        document.getElementById('totalRegistrations').textContent = registrations.length;

        if (registrations.length === 0) {
            document.getElementById('registrationsContent').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No registrations yet</h3>
                    <p>Service provider registrations will appear here</p>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Service Type</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        registrations.forEach(reg => {
            tableHTML += `
                <tr>
                    <td>${reg.name || 'N/A'}</td>
                    <td>${reg.email || 'N/A'}</td>
                    <td>${reg.phone || 'N/A'}</td>
                    <td>${reg.serviceType || 'N/A'}</td>
                    <td>${new Date(reg.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table></div>`;
        document.getElementById('registrationsContent').innerHTML = tableHTML;

    } catch (err) {
        document.getElementById('registrationsContent').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading registrations</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}

// Export Data
async function exportData(type, format) {
    try {
        const endpointMap = {
            bookings: '/export/bookings',
            registrations: '/export/registrations',
            users: '/export/users'
        };

        const endpoint = endpointMap[type];
        if (!endpoint) throw new Error('Unknown export type');

        const response = await fetch(`${API_URL}${endpoint}/${format}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fastsewa-${type}-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        alert(`✅ ${type} exported successfully!`);
    } catch (err) {
        alert(`❌ Export failed: ${err.message}`);
    }
}
