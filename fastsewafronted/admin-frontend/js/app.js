// Main App Controller
let currentSection = 'dashboard';

// Load all data
async function loadAllData() {
    Dashboard.loadStats();
    Announcements.load();
    Bookings.load();
    Registrations.load();
    AdminManagement.loadAll();
}

// Navigation handler
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const sectionId = item.getAttribute('data-section');
            navigateToSection(sectionId);
        });
    });
});

function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Deactivate all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }

    // Activate menu item
    const menuItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
    }

    currentSection = sectionId;

    // Load section-specific data
    loadSectionData(sectionId);
}

function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            Dashboard.loadStats();
            break;
        case 'announcements':
            Announcements.load();
            break;
        case 'bookings':
            Bookings.load();
            break;
        case 'registrations':
            Registrations.load();
            break;
        case 'admin-requests':
            AdminManagement.loadRequests();
            break;
        case 'approved-admins':
            AdminManagement.loadApproved();
            break;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isAuthenticated()) {
        loadAllData();
    }
});

// Refresh data every 30 seconds
setInterval(() => {
    if (Auth.isAuthenticated() && !document.hidden) {
        loadSectionData(currentSection);
        Dashboard.loadStats();
    }
}, 30000);

// Reload data when window comes back to focus
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Auth.isAuthenticated()) {
        loadAllData();
    }
});
