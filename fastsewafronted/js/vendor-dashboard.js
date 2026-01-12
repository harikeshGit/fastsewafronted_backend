// vendor-dashboard.js (legacy vendor UI, backed by integrated vendor APIs)

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

function getToken() {
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

async function apiRequest(path, options = {}) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : { message: await res.text() };

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            clearVendorAuth();
            // Send to unified login page
            window.location.href = 'login.html?logout=1&role=vendor';
            return;
        }
        throw new Error(data.error || data.message || 'Request failed');
    }
    return data;
}

let currentVendor = null;
let currentListings = [];
let editingListingId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!getToken()) {
        window.location.href = 'vendor-login.html';
        return;
    }

    setupNavigation();
    setupEventListeners();

    try {
        await loadVendorProfile();
        await loadStats();
    } catch (err) {
        console.error(err);
        alert(err.message || 'Failed to load vendor dashboard');
    }
});

function setupNavigation() {
    document.querySelectorAll('.sidebar-menu a').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            document.querySelectorAll('.sidebar-menu li').forEach((li) => li.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach((section) => section.classList.remove('active'));

            link.parentElement.classList.add('active');

            const section = link.getAttribute('data-section');
            const targetSection = document.getElementById(section + 'Section');
            if (targetSection) targetSection.classList.add('active');
        });
    });
}

function setupEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    document.getElementById('addListingBtn')?.addEventListener('click', () => {
        editingListingId = null;
        resetListingForm();
        openListingForm();
        document.getElementById('saveListingBtn').textContent = 'Create Listing';
    });

    document.getElementById('cancelListingBtn')?.addEventListener('click', () => {
        closeListingForm();
        resetListingForm();
        editingListingId = null;
    });

    document.getElementById('saveListingBtn')?.addEventListener('click', async () => {
        const title = document.getElementById('listingTitle').value;
        const description = document.getElementById('listingDescription').value;
        const city = document.getElementById('listingCity').value;
        const priceFrom = document.getElementById('listingPriceFrom').value ? parseInt(document.getElementById('listingPriceFrom').value, 10) : null;
        const priceTo = document.getElementById('listingPriceTo').value ? parseInt(document.getElementById('listingPriceTo').value, 10) : null;

        if (!title || !city) {
            alert('Title and City are required!');
            return;
        }

        const payload = {
            title,
            description,
            city,
            priceFrom,
            priceTo,
            serviceCategory: currentVendor?.serviceCategory || (currentVendor?.serviceCategories?.[0] ?? undefined)
        };

        try {
            if (editingListingId) {
                await apiRequest(`/vendor/listings/${editingListingId}`, { method: 'PUT', body: payload });
                alert('Listing updated successfully!');
            } else {
                await apiRequest('/vendor/listings', { method: 'POST', body: payload });
                alert('Listing created successfully!');
            }

            resetListingForm();
            closeListingForm();
            editingListingId = null;
            await loadListings();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error saving listing');
        }
    });

    document.getElementById('savePayoutBtn')?.addEventListener('click', async () => {
        const accountHolderName = document.getElementById('accountHolderName').value;
        const accountNumber = document.getElementById('accountNumber').value;
        const ifsc = document.getElementById('ifsc').value;
        const bankName = document.getElementById('bankName').value;
        const branch = document.getElementById('branch').value;
        const upiId = document.getElementById('upiId').value;

        if (!accountHolderName || !accountNumber || !ifsc || !bankName) {
            alert('Required fields: Account Holder, Account Number, IFSC, Bank Name');
            return;
        }

        try {
            await apiRequest('/vendor/payout', {
                method: 'POST',
                body: { accountHolderName, accountNumber, ifsc, bankName, branch, upiId }
            });

            alert('Payout details saved! Admin will verify soon.');
            await loadPayoutDetails();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error saving payout details');
        }
    });
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearVendorAuth();
        window.location.href = 'login.html?logout=1&role=vendor';
    }
}

function openListingForm() {
    const el = document.getElementById('listingFormWrapper');
    if (!el) return;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeListingForm() {
    const el = document.getElementById('listingFormWrapper');
    if (!el) return;
    el.style.display = 'none';
}

function resetListingForm() {
    document.getElementById('listingTitle').value = '';
    document.getElementById('listingDescription').value = '';
    document.getElementById('listingCity').value = '';
    document.getElementById('listingPriceFrom').value = '';
    document.getElementById('listingPriceTo').value = '';
    document.getElementById('saveListingBtn').textContent = 'Save Listing';
}

async function loadVendorProfile() {
    const vendor = await apiRequest('/vendor/me');
    currentVendor = vendor;

    const ownerDisplay = vendor.ownerName || vendor.name || vendor.email || 'Vendor';
    const businessDisplay = vendor.businessName || vendor.name || 'Business';
    const category = vendor.serviceCategory || (Array.isArray(vendor.serviceCategories) ? vendor.serviceCategories[0] : null);

    document.getElementById('vendorName').textContent = ownerDisplay;
    document.getElementById('profileInitial').textContent = String(businessDisplay || 'V').charAt(0).toUpperCase();
    document.getElementById('sidebarBusinessName').textContent = businessDisplay;
    document.getElementById('sidebarCategory').textContent = `${getCategoryIcon(category)} ${getCategoryName(category)}`;

    const approvalBadge = document.getElementById('approvalBadge');
    if (vendor.status === 'APPROVED') {
        approvalBadge.textContent = '✓ Approved';
        approvalBadge.className = 'badge badge-approved';
    } else {
        approvalBadge.textContent = '⏳ Pending Approval';
        approvalBadge.className = 'badge badge-pending';
    }

    await loadServiceRequests();
    await loadListings();
    await loadPayoutDetails();
}

async function loadServiceRequests() {
    const data = await apiRequest('/vendor/requests');
    const requests = Array.isArray(data?.requests) ? data.requests : Array.isArray(data) ? data : [];

    const container = document.getElementById('leadsContainer');
    container.innerHTML = '';

    if (!requests.length) {
        container.innerHTML = '<div class="empty-state"><p>📭 No service requests yet.</p></div>';
        return;
    }

    requests.forEach((req) => {
        const card = document.createElement('div');
        card.className = 'lead-card';
        const details = req.details || req.description || '';
        const budget = req.budget || 'Not specified';
        card.innerHTML = `
      <div class="lead-header">
        <span class="lead-id">#${String(req._id || '').slice(-6)}</span>
        <span class="lead-status status-${String(req.status || 'NEW').toLowerCase()}">${req.status || 'NEW'}</span>
      </div>
      <div class="lead-details">
        <p><strong>Customer:</strong> ${req.customerName || '—'}</p>
        <p><strong>Phone:</strong> ${req.customerPhone || '—'}</p>
        <p><strong>City:</strong> ${req.city || '—'}</p>
        <p><strong>Details:</strong> ${details || '—'}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        <p><strong>Date:</strong> ${req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}</p>
      </div>
    `;
        container.appendChild(card);
    });
}

async function loadListings() {
    const data = await apiRequest('/vendor/listings');
    const listings = Array.isArray(data?.listings) ? data.listings : Array.isArray(data) ? data : [];
    currentListings = listings;

    const container = document.getElementById('listingsContainer');
    container.innerHTML = '';

    if (!listings.length) {
        container.innerHTML = '<div class="empty-state"><p>No listings created yet.</p></div>';
        return;
    }

    listings.forEach((listing) => {
        const card = document.createElement('div');
        card.className = 'lead-card';
        const priceFrom = listing.priceFrom ?? listing.priceMin ?? '-';
        const priceTo = listing.priceTo ?? listing.priceMax ?? '-';

        card.innerHTML = `
      <div class="lead-header">
        <span class="lead-id">${listing.title || 'Untitled'}</span>
        <span class="lead-status" style="background: ${listing.isActive ? '#d1fae5' : '#fee2e2'}; color: ${listing.isActive ? '#065f46' : '#991b1b'};">
          ${listing.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div class="lead-details">
        <p><strong>City:</strong> ${listing.city || '—'}</p>
        <p><strong>Description:</strong> ${listing.description || 'N/A'}</p>
        <p><strong>Price Range:</strong> ₹${priceFrom} - ₹${priceTo}</p>
        <p><strong>Created:</strong> ${listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : '—'}</p>
      </div>
      <div style="margin-top:10px;">
        <button data-edit="${listing._id}" class="btn-primary" style="width:48%; padding:8px;">Edit</button>
        <button data-del="${listing._id}" class="btn-primary" style="width:48%; padding:8px; background:#ef4444; margin-left:4%;">Delete</button>
      </div>
    `;
        container.appendChild(card);
    });

    container.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-edit');
            const listing = currentListings.find((l) => l._id === id);
            if (!listing) return;
            editingListingId = id;

            document.getElementById('listingTitle').value = listing.title || '';
            document.getElementById('listingDescription').value = listing.description || '';
            document.getElementById('listingCity').value = listing.city || '';
            document.getElementById('listingPriceFrom').value = listing.priceFrom ?? listing.priceMin ?? '';
            document.getElementById('listingPriceTo').value = listing.priceTo ?? listing.priceMax ?? '';
            document.getElementById('saveListingBtn').textContent = 'Update Listing';

            openListingForm();
        });
    });

    container.querySelectorAll('[data-del]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-del');
            if (!id) return;
            if (!confirm('Are you sure you want to delete this listing?')) return;
            try {
                await apiRequest(`/vendor/listings/${id}`, { method: 'DELETE' });
                alert('Listing deleted');
                await loadListings();
            } catch (err) {
                console.error(err);
                alert(err.message || 'Failed to delete listing');
            }
        });
    });
}

async function loadPayoutDetails() {
    const data = await apiRequest('/vendor/payout');
    const payout = data && data.payout !== undefined ? data.payout : data;

    if (!payout) {
        document.getElementById('payoutStatusText').textContent = 'No payout details saved yet.';
        return;
    }

    document.getElementById('accountHolderName').value = payout.accountHolderName || '';
    document.getElementById('accountNumber').value = payout.accountNumber || '';
    document.getElementById('ifsc').value = payout.ifsc || '';
    document.getElementById('bankName').value = payout.bankName || '';
    document.getElementById('branch').value = payout.branch || '';
    document.getElementById('upiId').value = payout.upiId || '';

    const statusText = payout.status === 'VERIFIED' ? '✓ Verified' : '⏳ Awaiting verification by admin';
    document.getElementById('payoutStatusText').textContent = statusText;
}

async function loadStats() {
    const data = await apiRequest('/vendor/requests');
    const requests = Array.isArray(data?.requests) ? data.requests : Array.isArray(data) ? data : [];

    const totalLeads = requests.length;
    const pendingLeads = requests.filter((r) => ['NEW', 'ASSIGNED'].includes(r.status)).length;
    const completedLeads = requests.filter((r) => r.status === 'COMPLETED').length;

    document.getElementById('totalLeads').textContent = String(totalLeads);
    document.getElementById('pendingLeads').textContent = String(pendingLeads);
    document.getElementById('completedLeads').textContent = String(completedLeads);
    document.getElementById('monthlyEarnings').textContent = '₹0';
}

function getCategoryIcon(category) {
    const icons = {
        construction: '🏗️',
        security: '🛡️',
        medical: '🏥',
        repair: '🔧',
        land: '🏞️',
        legal: '⚖️',
        material: '🧱',
        finance: '💰'
    };
    return icons[String(category || '').toLowerCase()] || '🔧';
}

function getCategoryName(category) {
    const names = {
        construction: 'Construction',
        security: 'Security Services',
        medical: 'Medical Services',
        repair: 'Repair & Maintenance',
        land: 'Land Verification',
        legal: 'Legal & GST',
        material: 'Material Suppliers',
        finance: 'Finance Consultant'
    };
    const key = String(category || '').toLowerCase();
    return names[key] || (key || 'Service');
}
