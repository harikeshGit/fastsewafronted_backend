// Announcements Module
const Announcements = {
    async getAll() {
        return apiRequest('/announcements', { includeAuth: false });
    },

    async create(title, message, active) {
        return apiRequest('/announcements', {
            method: 'POST',
            body: JSON.stringify({ title, message, active }),
            includeAuth: false
        });
    },

    async delete(id) {
        return apiRequest(`/announcements/${id}`, {
            method: 'DELETE',
            includeAuth: false
        });
    },

    async load() {
        try {
            const items = await this.getAll();
            const container = document.getElementById('announcementsList');

            if (!items || items.length === 0) {
                container.innerHTML = '<div class="text-center text-muted p-20">No announcements yet</div>';
                return;
            }

            container.innerHTML = items.map(item => `
                <div class="item">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 0.5rem;">
                            ${item.title}
                            <span class="badge ${item.active ? 'badge-approved' : 'badge-rejected'}" style="margin-left: 0.5rem;">
                                ${item.active ? '✓ Active' : '✗ Inactive'}
                            </span>
                        </div>
                        <div style="color: #7f8c8d; margin-bottom: 0.5rem;">${item.message}</div>
                        <small style="color: #999;">${formatDate(item.createdAt)}</small>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="Announcements.deleteItem('${item._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');

        } catch (err) {
            document.getElementById('announcementsList').innerHTML =
                `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
        }
    },

    deleteItem(id) {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        this.delete(id).then(() => {
            showAlert('Announcement deleted successfully', 'success');
            this.load();
            Dashboard.loadStats();
        }).catch(err => {
            showAlert(err.message, 'danger');
        });
    }
};

// Announcement Form Handler
document.getElementById('announcementForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('annTitle').value;
    const message = document.getElementById('annMessage').value;
    const active = document.getElementById('annActive').checked;

    try {
        await Announcements.create(title, message, active);

        showAlert('Announcement created successfully', 'success');
        document.getElementById('announcementForm').reset();
        Announcements.load();
        Dashboard.loadStats();

    } catch (err) {
        showAlert(err.message, 'danger');
    }
});

// Load announcements when page loads
document.addEventListener('DOMContentLoaded', () => {
    Announcements.load();
});
