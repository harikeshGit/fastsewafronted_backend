// Bookings Module
const Bookings = {
    async getAll() {
        return apiRequest('/bookings', { includeAuth: true });
    },

    async updateStatus(id, status) {
        return apiRequest(`/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
            includeAuth: true
        });
    },

    async delete(id) {
        return apiRequest(`/bookings/${id}`, {
            method: 'DELETE',
            includeAuth: true
        });
    },

    async export(format) {
        const url = `${getAPI()}/export/bookings/${format}`;
        try {
            const response = await fetch(url, {
                headers: getHeaders(true)
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `bookings.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

        } catch (err) {
            showAlert(err.message, 'danger');
        }
    },

    async load() {
        try {
            const items = await this.getAll();
            const container = document.getElementById('bookingsList');

            if (!items || items.length === 0) {
                container.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No bookings found</td></tr>';
                return;
            }

            container.innerHTML = items.map(item => {
                const statusColor = {
                    'pending': 'badge-warning',
                    'confirmed': 'badge-approved',
                    'completed': 'badge-info',
                    'cancelled': 'badge-rejected'
                }[item.status] || 'badge-pending';

                return `
                    <tr>
                        <td><strong>${item.clientName}</strong></td>
                        <td>${item.service}</td>
                        <td>${item.phone}</td>
                        <td>${item.email || 'N/A'}</td>
                        <td>
                            <select class="form-control" onchange="Bookings.changeStatus('${item._id}', this.value)" style="width: auto;">
                                <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="confirmed" ${item.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                        <td>${formatDate(item.createdAt)}</td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="Bookings.deleteItem('${item._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (err) {
            document.getElementById('bookingsList').innerHTML =
                `<tr><td colspan="7" class="alert alert-danger" style="text-align: center;">${err.message}</td></tr>`;
        }
    },

    changeStatus(id, status) {
        this.updateStatus(id, status).then(() => {
            showAlert('Booking updated successfully', 'success');
            this.load();
            Dashboard.loadStats();
        }).catch(err => {
            showAlert(err.message, 'danger');
        });
    },

    deleteItem(id) {
        if (!confirm('Are you sure you want to delete this booking?')) return;

        this.delete(id).then(() => {
            showAlert('Booking deleted successfully', 'success');
            this.load();
            Dashboard.loadStats();
        }).catch(err => {
            showAlert(err.message, 'danger');
        });
    }
};

// Export handlers
function exportBookings(format) {
    Bookings.export(format);
}

// Load bookings when page loads
document.addEventListener('DOMContentLoaded', () => {
    Bookings.load();
});
