// Admin Management Module
const AdminManagement = {
    async getRequests() {
        return apiRequest('/auth/requests', { includeAuth: true });
    },

    async getApproved() {
        return apiRequest('/auth/admins', { includeAuth: true });
    },

    async approve(id) {
        return apiRequest(`/auth/approve/${id}`, {
            method: 'POST',
            includeAuth: true
        });
    },

    async reject(id) {
        return apiRequest(`/auth/reject/${id}`, {
            method: 'POST',
            includeAuth: true
        });
    },

    async loadRequests() {
        try {
            const items = await this.getRequests();
            const container = document.getElementById('adminRequestsList');

            if (!items || items.length === 0) {
                container.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No pending requests</td></tr>';
                return;
            }

            container.innerHTML = items.map(item => `
                <tr>
                    <td><strong>${item.email}</strong></td>
                    <td><span class="badge badge-pending">Pending</span></td>
                    <td>${formatDate(item.createdAt)}</td>
                    <td style="white-space: nowrap;">
                        <button class="btn btn-success btn-sm" onclick="AdminManagement.approveItem('${item._id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="AdminManagement.rejectItem('${item._id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (err) {
            document.getElementById('adminRequestsList').innerHTML =
                `<tr><td colspan="4" class="alert alert-danger" style="text-align: center;">${err.message}</td></tr>`;
        }
    },

    async loadApproved() {
        try {
            const items = await this.getApproved();
            const container = document.getElementById('approvedAdminsList');

            if (!items || items.length === 0) {
                container.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No approved admins</td></tr>';
                return;
            }

            container.innerHTML = items.map(item => `
                <tr>
                    <td><strong>${item.email}</strong></td>
                    <td>${item.approvedAt ? formatDate(item.approvedAt) : 'N/A'}</td>
                    <td>${item.approvedBy || 'System'}</td>
                </tr>
            `).join('');

        } catch (err) {
            document.getElementById('approvedAdminsList').innerHTML =
                `<tr><td colspan="3" class="alert alert-danger" style="text-align: center;">${err.message}</td></tr>`;
        }
    },

    async loadAll() {
        await this.loadRequests();
        await this.loadApproved();
    },

    approveItem(id) {
        if (!confirm('Are you sure you want to approve this admin request?')) return;

        this.approve(id).then(() => {
            showAlert('Admin approved successfully', 'success');
            this.loadAll();
            Dashboard.loadStats();
        }).catch(err => {
            showAlert(err.message, 'danger');
        });
    },

    rejectItem(id) {
        if (!confirm('Are you sure you want to reject this admin request?')) return;

        this.reject(id).then(() => {
            showAlert('Admin request rejected successfully', 'success');
            this.loadAll();
            Dashboard.loadStats();
        }).catch(err => {
            showAlert(err.message, 'danger');
        });
    }
};

// Load admin management data when page loads
document.addEventListener('DOMContentLoaded', () => {
    AdminManagement.loadAll();
});
