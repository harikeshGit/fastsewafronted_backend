// Registrations Module
const Registrations = {
    async getAll() {
        return apiRequest('/registrations', { includeAuth: true });
    },

    async delete(id) {
        return apiRequest(`/registrations/${id}`, {
            method: 'DELETE',
            includeAuth: true
        });
    },

    async export(format) {
        const url = `${getAPI()}/export/registrations/${format}`;
        try {
            const response = await fetch(url, {
                headers: getHeaders(true)
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `registrations.${format === 'excel' ? 'xlsx' : 'pdf'}`;
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
            const container = document.getElementById('registrationsList');

            if (!items || items.length === 0) {
                container.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No registrations found</td></tr>';
                return;
            }

            container.innerHTML = items.map(item => `
                <tr>
                    <td><strong>${item.name || 'N/A'}</strong></td>
                    <td>${item.email}</td>
                    <td>${item.phone || 'N/A'}</td>
                    <td>${item.serviceInterest || 'General'}</td>
                    <td>${formatDate(item.registrationDate || item.createdAt)}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="Registrations.deleteItem('${item._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (err) {
            document.getElementById('registrationsList').innerHTML =
                `<tr><td colspan="6" class="alert alert-danger" style="text-align: center;">${err.message}</td></tr>`;
        }
    },

    deleteItem(id) {
        if (!confirm('Are you sure you want to delete this registration?')) return;

        this.delete(id).then(() => {
            showAlert('Registration deleted successfully', 'success');
            this.load();
            Dashboard.loadStats();
        }).catch(err => {
            showAlert(err.message, 'danger');
        });
    }
};

// Export handlers
function exportRegistrations(format) {
    Registrations.export(format);
}

// Load registrations when page loads
document.addEventListener('DOMContentLoaded', () => {
    Registrations.load();
});
