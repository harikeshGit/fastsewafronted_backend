// Dashboard Module
const Dashboard = {
    async loadStats() {
        try {
            const announcements = await apiRequest('/announcements', { includeAuth: false });
            const bookings = await apiRequest('/bookings', { includeAuth: true });
            const registrations = await apiRequest('/registrations', { includeAuth: true });
            const admins = await apiRequest('/auth/admins', { includeAuth: true });

            document.getElementById('announcementCount').textContent = announcements?.length || 0;
            document.getElementById('bookingCount').textContent = bookings?.length || 0;
            document.getElementById('registrationCount').textContent = registrations?.length || 0;
            document.getElementById('adminCount').textContent = admins?.length || 0;

        } catch (err) {
            log(`Failed to load dashboard stats: ${err.message}`, 'error');
        }
    }
};

// Load dashboard stats when viewing dashboard
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.loadStats();
});
