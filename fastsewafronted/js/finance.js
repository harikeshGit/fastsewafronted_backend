// finance.js - Finance Assistant booking logic

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('financeForm');
  const statusEl = document.getElementById('financeStatus');
  const submitBtn = document.getElementById('financeSubmit');
  const actionsBox = document.getElementById('financeActions');
  const goToDashboardBtn = document.getElementById('goToDashboard');
  const newRequestBtn = document.getElementById('newFinanceRequest');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.BookingStorage) {
      alert('Booking system not loaded. Please contact support.');
      return;
    }

    statusEl.textContent = '';
    statusEl.className = 'form-status';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const income = parseFloat(form.monthlyIncome.value) || 0;
    const expense = parseFloat(form.monthlyExpense.value) || 0;
    const goalType = form.goalType.value;
    const notes = form.notes.value.trim();

    const approxAmount = 0; // Finance assistant is more of a consultation

    try {
      const booking = BookingStorage.addBooking({
        serviceName: 'Finance Assistant',
        serviceType: 'finance',
        amount: approxAmount,
        status: 'pending',
        date: new Date().toISOString(),
        address: '',
        providerName: 'FastSewa Finance Assistant',
        meta: {
          fullName,
          email,
          phone,
          monthlyIncome: income,
          monthlyExpense: expense,
          goalType,
          notes
        }
      });

      statusEl.textContent =
        'Request submitted successfully! Our finance assistant will contact you soon. Booking ID: ' +
        booking.id;
      statusEl.classList.add('success');

      actionsBox.style.display = 'block';
    } catch (err) {
      console.error(err);
      statusEl.textContent =
        'Something went wrong while creating your request. Please try again.';
      statusEl.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Request';
    }
  });

  if (goToDashboardBtn) {
    goToDashboardBtn.addEventListener('click', () => {
      window.location.href = '../dashboard/dashboard.html';
    });
  }

  if (newRequestBtn) {
    newRequestBtn.addEventListener('click', () => {
      document.getElementById('financeForm').reset();
      const statusEl = document.getElementById('financeStatus');
      statusEl.textContent = '';
      statusEl.className = 'form-status';
    });
  }
});
