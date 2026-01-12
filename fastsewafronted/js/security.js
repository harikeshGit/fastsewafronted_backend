// Mobile Menu Toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navMenu = document.getElementById('navMenu');
        
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            // Change menu icon
            const icon = mobileMenuBtn.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if(targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if(targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 70,
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if(contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form values
                const name = this.querySelector('input[type="text"]').value;
                const email = this.querySelector('input[type="email"]').value;
                const subject = this.querySelectorAll('input[type="text"]')[1].value;
                const message = this.querySelector('textarea').value;
                
                // In a real application, you would send this data to a server
                // For now, we'll just show an alert
                alert(`Thank you, ${name}! Your message has been sent successfully. We will contact you at ${email} soon.`);
                
                // Reset form
                this.reset();
            });
        }
        
        // Add scroll effect to header
        window.addEventListener('scroll', function() {
            const header = document.querySelector('header');
            if (window.scrollY > 100) {
                header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            }
        });
        
        // Animate stats counter
        function animateStats() {
            const statBoxes = document.querySelectorAll('.stat-box h3');
            
            statBoxes.forEach(box => {
                const target = parseInt(box.textContent);
                const increment = target / 100;
                let current = 0;
                
                const timer = setInterval(() => {
                    current += increment;
                    if(current >= target) {
                        box.textContent = target + '+';
                        clearInterval(timer);
                    } else {
                        box.textContent = Math.floor(current) + '+';
                    }
                }, 20);
            });
        }
        
        // Trigger stats animation when in viewport
        const observerOptions = {
            threshold: 0.5
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    animateStats();
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        const statsSection = document.querySelector('.stats');
        if(statsSection) {
            observer.observe(statsSection);
        }
        /* --- SECURITY PLANNER CALCULATOR --- */
function calculateSecurity() {
    // 1. Get Inputs
    const type = document.getElementById('reqType').value;
    const size = parseInt(document.getElementById('reqSize').value);
    
    // UI Elements
    const defaultMsg = document.querySelector('.default-msg');
    const resultContent = document.querySelector('.result-content');
    
    // Output Elements
    const guardEl = document.getElementById('guardCount');
    const bouncerEl = document.getElementById('bouncerCount');
    const superEl = document.getElementById('superCount');
    const costEl = document.getElementById('estCost');

    if (!size || size <= 0) {
        alert("Please enter a valid size/number.");
        return;
    }

    // 2. Logic for Staffing (Rough Heuristics)
    let guards = 0;
    let bouncers = 0;
    let supervisors = 0;
    let costPerDay = 0;

    // Rates (Approx)
    const rateGuard = 800;
    const rateBouncer = 1500;
    const rateSuper = 1200;

    if (type === 'Event') {
        // Event: 1 Guard per 100 guests, 1 Bouncer per 50 guests
        guards = Math.ceil(size / 100);
        bouncers = Math.ceil(size / 50);
        supervisors = Math.ceil((guards + bouncers) / 10); // 1 super per 10 staff
    } 
    else if (type === 'Office') {
        // Office: 1 Guard per 1000 sqft
        guards = Math.ceil(size / 1000);
        bouncers = 0; // Usually not needed
        supervisors = Math.ceil(guards / 5);
        if(guards < 1) guards = 1; // Minimum 1
    }
    else if (type === 'Residential') {
        // Society: 1 Guard per Gate (Assume 1 gate per 50 units/2000sqft)
        guards = Math.ceil(size / 2000) * 2; // 2 shifts
        bouncers = 0;
        supervisors = 1; // 1 Manager
    }

    // Calculate Cost
    costPerDay = (guards * rateGuard) + (bouncers * rateBouncer) + (supervisors * rateSuper);

    // 3. Update UI
    defaultMsg.style.display = 'none';
    resultContent.style.display = 'block';

    animateValue(guardEl, 0, guards, 1000);
    animateValue(bouncerEl, 0, bouncers, 1000);
    animateValue(superEl, 0, supervisors, 1000);
    
    costEl.innerText = "₹" + costPerDay.toLocaleString();
}

// Animation Helper
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Transfer Plan to Form
function applyPlan() {
    const guards = document.getElementById('guardCount').innerText;
    const bouncers = document.getElementById('bouncerCount').innerText;
    const planText = `Automated Plan: ${guards} Guards, ${bouncers} Bouncers`;
    
    // Scroll to form
    document.getElementById('hire').scrollIntoView({ behavior: 'smooth' });
    
    // Fill Input
    document.getElementById('selectedPlan').value = planText;
}

/* --- HIRE FORM SUBMIT --- */
function submitHire() {
    const btn = document.querySelector('.btn-submit');
    const msg = document.getElementById('hireMsg');

    btn.innerText = "Requesting Deployment...";
    btn.style.opacity = "0.7";

    setTimeout(() => {
        btn.innerText = "Request Sent";
        btn.style.background = "#16a34a"; // Green
        btn.style.opacity = "1";
        msg.innerText = "Our Area Commander will contact you within 15 mins.";
    }, 2000);
}