// Configuration
// Default to same-origin in production (full-stack deploy), but keep localhost:4000 for local dev.
const API_BASE = (() => {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalHost) return 'http://localhost:4000/api';
    if (!origin || origin === 'null') return 'http://localhost:4000/api';
    return `${origin}/api`;
})();

// Get API URL from localStorage or use default
function getAPI() {
    const customUrl = localStorage.getItem('apiUrl');
    return customUrl ? `${customUrl}/api` : API_BASE;
}

// Token management
function getToken() {
    return localStorage.getItem('adminToken');
}

function setToken(token) {
    localStorage.setItem('adminToken', token);
}

function removeToken() {
    localStorage.removeItem('adminToken');
}

// Headers with auth
function getHeaders(includeAuth = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (includeAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const url = `${getAPI()}${endpoint}`;
    const config = {
        headers: getHeaders(options.includeAuth !== false),
        ...options
    };

    try {
        console.log(`[API] ${config.method || 'GET'} ${url}`);

        const response = await fetch(url, config);

        // Handle authentication errors (but don't hard-reload on invalid login)
        if (response.status === 401 && endpoint !== '/auth/login') {
            console.warn('Authentication failed (401)');
            removeToken();
            window.location.reload();
            return;
        }

        // Try to parse response
        let data;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = { error: 'Invalid response format from server' };
        }

        // Check if response is ok
        if (!response.ok) {
            const errorMsg = data.error || data.message || `HTTP ${response.status}`;
            console.error(`[API Error] ${errorMsg}`);
            throw new Error(errorMsg);
        }

        console.log(`[API Success] ${endpoint}`, data);
        return data;

    } catch (error) {
        // Network error or other fetch error
        if (error instanceof TypeError) {
            const msg = `Cannot connect to API server (${getAPI()})`;
            console.error(`[API Network Error] ${msg}`);
            throw new Error(msg);
        }

        console.error(`[API Error] ${endpoint}:`, error.message);
        throw error;
    }
}

// UI Helpers
function showAlert(message, type = 'info', container = null) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    if (container) {
        container.appendChild(alert);
    } else {
        document.querySelector('.main-content')?.insertBefore(alert, document.querySelector('.main-content').firstChild);
    }

    setTimeout(() => alert.remove(), 5000);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Log helper
function log(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
}
