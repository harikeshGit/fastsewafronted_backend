// Mobile Menu Toggle
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenu.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Smooth Scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        // Close mobile menu if open
        if(navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Form Submission Handling (Demo)
const form = document.getElementById('consultationForm');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const service = document.getElementById('serviceType').value;

    // Simple alert to simulate submission
    alert(`Thank you, ${name}! We have received your request regarding ${service}. Our team will contact you shortly.`);
    
    // Reset form
    form.reset();
});
// GST Calculator Logic
let selectedRate = 18; // Default GST Rate

// Handle Tax Slab Selection
const slabButtons = document.querySelectorAll('.slab-btn');
slabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        slabButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Update selected rate
        selectedRate = parseInt(btn.getAttribute('data-rate'));
    });
});

function calculateGST() {
    const amount = parseFloat(document.getElementById('amount').value);
    const taxType = document.querySelector('input[name="taxType"]:checked').value;
    const resultBox = document.getElementById('result');

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    let netAmount, gstAmount, totalAmount;

    if (taxType === 'exclusive') {
        // GST Exclusive: Amount + GST
        netAmount = amount;
        gstAmount = (amount * selectedRate) / 100;
        totalAmount = netAmount + gstAmount;
    } else {
        // GST Inclusive: Extract GST from Total
        totalAmount = amount;
        netAmount = amount / (1 + (selectedRate / 100));
        gstAmount = totalAmount - netAmount;
    }

    // Update UI
    document.getElementById('res-net').textContent = '₹' + netAmount.toFixed(2);
    document.getElementById('res-gst').textContent = '₹' + gstAmount.toFixed(2);
    document.getElementById('res-total').textContent = '₹' + totalAmount.toFixed(2);

    // Show result box
    resultBox.classList.remove('hidden');
}
