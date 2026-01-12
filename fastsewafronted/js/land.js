/* --- 1. SEARCH RECORDS SIMULATION --- */
function searchLand() {
    const plot = document.getElementById('plotInput').value;
    const resultBox = document.getElementById('searchResult');
    const loader = document.getElementById('loader');
    const data = document.getElementById('resultData');

    if (plot.trim() === "") {
        alert("Please enter a Plot or Khasra Number.");
        return;
    }

    // Show Loader
    resultBox.style.display = 'block';
    loader.style.display = 'block';
    data.style.display = 'none';

    // Simulate API Delay
    setTimeout(() => {
        loader.style.display = 'none';
        data.style.display = 'block';
        
        // Scroll to result
        resultBox.scrollIntoView({ behavior: 'smooth' });
    }, 1500);
}

/* --- 2. FILE UPLOAD INTERACTION --- */
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileName');

// Trigger hidden file input when clicking the box
dropZone.addEventListener('click', () => {
    fileInput.click();
});

// Handle file selection
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        fileNameDisplay.innerText = "Selected: " + fileInput.files[0].name;
        dropZone.style.borderColor = "#10b981";
        dropZone.style.background = "#ecfdf5";
    }
});

/* --- 3. SUBMIT FORM SIMULATION --- */
function submitRequest() {
    const btn = document.querySelector('.btn-submit');
    
    // Change button state
    btn.innerText = "Uploading Documents...";
    btn.style.opacity = "0.7";
    
    setTimeout(() => {
        btn.innerText = "Request Submitted Successfully!";
        btn.style.background = "#10b981";
        btn.style.opacity = "1";
        alert("Your documents have been received! Our legal team will contact you within 24 hours.");
    }, 2000);
}