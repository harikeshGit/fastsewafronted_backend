/* --- 1. TYPEWRITER EFFECT --- */
const searchInput = document.getElementById('dynamicSearch');
const phrases = ["Cardiologist", "Dental Checkup", "Medicine Delivery", "Lab Tests"];
let pIndex = 0, cIndex = 0, isDeleting = false;

function typeLoop() {
    let current = phrases[pIndex];
    searchInput.placeholder = `Search for '${current.substring(0, cIndex)}'`;
    
    if(!isDeleting) cIndex++; else cIndex--;
    
    let speed = isDeleting ? 50 : 100;
    if(!isDeleting && cIndex === current.length) { speed = 2000; isDeleting = true; }
    else if(isDeleting && cIndex === 0) { isDeleting = false; pIndex = (pIndex + 1) % phrases.length; speed = 500; }
    
    setTimeout(typeLoop, speed);
}
document.addEventListener('DOMContentLoaded', () => {
    typeLoop();
    renderDoctors('All');
});

/* --- 2. DOCTOR DATABASE & FILTERING --- */
const doctorsDB = [
    { name: "Dr. A. Sharma", spec: "Cardiologist", exp: "15 Yrs", img: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Dr. Priya V.", spec: "Dentist", exp: "8 Yrs", img: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Dr. Rajesh K.", spec: "General", exp: "20 Yrs", img: "https://randomuser.me/api/portraits/men/65.jpg" },
    { name: "Dr. Neha Singh", spec: "Neurology", exp: "12 Yrs", img: "https://randomuser.me/api/portraits/women/68.jpg" }
];

function renderDoctors(filter) {
    const grid = document.getElementById('doctorGrid');
    grid.innerHTML = '';
    const list = filter === 'All' ? doctorsDB : doctorsDB.filter(d => d.spec === filter);
    
    list.forEach(doc => {
        // UPDATED: Now clicking Book Now calls 'bookDoctor' with specific details
        grid.innerHTML += `
            <div class="doc-card">
                <img src="${doc.img}" class="doc-img">
                <h4>${doc.name}</h4>
                <p style="color:#00b4d8; font-size:0.9rem; font-weight:600;">${doc.spec}</p>
                <p style="font-size:0.8rem; color:#777; margin-bottom:15px;">Experience: ${doc.exp}</p>
                <button class="nav-btn" style="border:none; cursor:pointer;" onclick="bookDoctor('${doc.name}', '${doc.spec}')">Book Now</button>
            </div>
        `;
    });
}

function filterDocs(type) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    renderDoctors(type);
}

/* --- 3. SMART BOOKING FUNCTION (NEW) --- */
function bookDoctor(docName, specialty) {
    // 1. Scroll to form
    const formSection = document.getElementById('book-final');
    formSection.scrollIntoView({ behavior: 'smooth' });

    // 2. Pre-fill Form Fields
    document.getElementById('selectedDoc').value = docName;
    document.getElementById('deptSelect').value = specialty;

    // 3. Highlight the fields visually to show they changed
    document.getElementById('selectedDoc').style.borderColor = "#00b4d8";
    document.getElementById('deptSelect').style.borderColor = "#00b4d8";

    // 4. Trigger Availability Check
    checkAvailability();
}

/* --- 4. AI CHATBOT LOGIC --- */
function sendAiMessage() {
    const input = document.getElementById('aiInput');
    const history = document.getElementById('chatHistory');
    const msg = input.value.trim();
    if(!msg) return;

    history.innerHTML += `<div class="msg user">${msg}</div>`;
    input.value = "";
    history.scrollTop = history.scrollHeight;

    setTimeout(() => {
        let reply = "I recommend consulting a General Physician.";
        if(msg.toLowerCase().includes("heart") || msg.toLowerCase().includes("chest")) reply = "Chest pain is serious. I have pre-selected Cardiology for you below.";
        if(msg.toLowerCase().includes("tooth")) reply = "For toothache, please see our Dentists.";
        
        history.innerHTML += `<div class="msg bot">${reply}</div>`;
        history.scrollTop = history.scrollHeight;
    }, 1000);
}

/* --- 5. FINAL FORM AUTOMATION --- */
function checkAvailability() {
    const date = document.getElementById('bookDate').value;
    const dept = document.getElementById('deptSelect').value;
    const timeSelect = document.getElementById('timeSlot');
    
    // Only check if both are selected
    if(dept) {
        timeSelect.disabled = false;
        timeSelect.innerHTML = `<option>Loading slots...</option>`;
        
        setTimeout(() => {
            timeSelect.innerHTML = `
                <option value="10:00">10:00 AM (Available)</option>
                <option value="12:30">12:30 PM (Available)</option>
                <option value="16:00">04:00 PM (Available)</option>
            `;
        }, 800);
    }
}

function bookAppointment() {
    const btn = document.querySelector('.btn-submit');
    const status = document.getElementById('bookingStatus');
    const doc = document.getElementById('selectedDoc').value;
    
    btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Processing...";
    
    setTimeout(() => {
        btn.innerHTML = "Booking Confirmed";
        btn.style.background = "#2a9d8f";
        const token = Math.floor(10000 + Math.random() * 90000);
        status.innerHTML = `Success! Appointment with ${doc}. Token ID: FS-${token}`;
    }, 1500);
}