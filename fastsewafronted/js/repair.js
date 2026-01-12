/* --- 1. LIVE COST ESTIMATOR --- */
let basePrice = 0;
let quantity = 1;

function calculateTotal() {
    const serviceSelect = document.getElementById('estService');
    const displayTotal = document.getElementById('totalPrice');
    
    // Get price from selected option value
    basePrice = parseInt(serviceSelect.value);
    
    // Calculate total
    let total = basePrice * quantity;
    
    // Update Display
    displayTotal.innerText = "₹" + total;
}

function changeQty(amount) {
    quantity += amount;
    if (quantity < 1) quantity = 1; // Prevent negative
    
    document.getElementById('qtyDisplay').innerText = quantity;
    
    // Recalculate if a service is selected
    if (basePrice > 0) {
        calculateTotal();
    }
}

// Transfer data from Estimator to Booking Form
function transferToBooking() {
    const serviceSelect = document.getElementById('estService');
    const selectedText = serviceSelect.options[serviceSelect.selectedIndex].text;
    
    if (serviceSelect.value == "0") {
        alert("Please select a service first!");
        return;
    }

    // Scroll to booking form
    document.getElementById('book-now').scrollIntoView({ behavior: 'smooth' });

    // Fill the input in booking form
    document.getElementById('finalService').value = selectedText + " (x" + quantity + ")";
}

/* --- 2. CATEGORY SELECTION --- */
function selectCategory(category) {
    // Scroll to estimator
    document.getElementById('estimator').scrollIntoView({ behavior: 'smooth' });
    
    // Simulate auto-selection in dropdown (optional logic could expand here)
    alert("You selected " + category + ". Please choose specific job in the Rate Card to estimate price.");
}

function scrollToServices() {
    document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
}

/* --- 3. BOOKING CONFIRMATION --- */
function confirmBooking() {
    const btn = document.querySelector('.btn-confirm');
    const msg = document.getElementById('successMsg');
    const isUrgent = document.getElementById('urgentCheck').checked;
    
    btn.innerText = "Processing...";
    btn.style.opacity = "0.7";

    setTimeout(() => {
        btn.innerText = "Booking Confirmed";
        btn.style.background = "#10b981";
        btn.style.opacity = "1";
        
        const time = isUrgent ? "WITHIN 60 MINS" : "scheduled time";
        msg.innerHTML = `<i class="fas fa-check-circle"></i> Partner assigned! Arriving at ${time}.`;
        
    }, 1500);
}