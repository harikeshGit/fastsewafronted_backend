document.addEventListener('DOMContentLoaded', function() {
    
    // ======================================================
    // 1. SCROLL REVEAL ANIMATION (Fixes Blank Service Section)
    // ======================================================
    function reveal() {
        var reveals = document.querySelectorAll('.reveal');

        for (var i = 0; i < reveals.length; i++) {
            var windowHeight = window.innerHeight;
            var elementTop = reveals[i].getBoundingClientRect().top;
            var elementVisible = 50; // थोड़ा जल्दी दिखने के लिए 100 से 50 किया

            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add('active');
            }
            // Note: Else block hataya gaya hai taki scroll up karne par gayab na ho
        }
    }

    // Event Listeners for Reveal
    window.addEventListener('scroll', reveal);
    
    // Force run once on load (Immediate)
    reveal(); 
    
    // Force run again after a small delay (Backup for slow backend data)
    setTimeout(reveal, 500); 


    // ======================================================
    // 2. MOBILE NAVIGATION TOGGLE
    // ======================================================
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active'); // Hamburger animation ke liye
        });

        // Link click hone par menu band ho jaye
        document.querySelectorAll('.nav-links li a').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }));
    }


    // ======================================================
    // 3. SMOOTH SCROLLING
    // ======================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            // Close mobile menu if open
            if(navLinks) navLinks.classList.remove('active');
            if(hamburger) hamburger.classList.remove('active');

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });


    // ======================================================
    // 4. STATS COUNTER ANIMATION
    // ======================================================
    const statsSection = document.querySelector('.stats-section');
    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    if (statsSection && counters.length > 0) {
        const animateCounters = () => {
            counters.forEach(counter => {
                const updateCount = () => {
                    const target = +counter.getAttribute('data-target');
                    const count = +counter.innerText.replace(/,/g, '').replace(/\+/g, ''); // Clean text
                    const inc = target / speed;

                    if (count < target) {
                        counter.innerText = Math.ceil(count + inc);
                        setTimeout(updateCount, 20);
                    } else {
                        // Formatting logic
                        if(target >= 1000) {
                            counter.innerText = target.toLocaleString(); // Commas add karega (e.g. 10,000)
                        } else {
                            counter.innerText = target;
                        }
                    }
                };
                updateCount();
            });
        };

        const statsObserver = new IntersectionObserver((entries, observer) => {
            const [entry] = entries;
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(statsSection); // Sirf ek baar chalega
            }
        }, { root: null, threshold: 0.2 });

        statsObserver.observe(statsSection);
    }


    // ======================================================
    // 5. HERO SLIDESHOW (Auto Slider)
    // ======================================================
    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroDots = document.querySelectorAll('.hero-dot');
    const prevHeroBtn = document.getElementById('prev-hero-slide');
    const nextHeroBtn = document.getElementById('next-hero-slide');
    
    if (heroSlides.length > 0) {
        let currentHeroSlide = 0;
        let heroSlideInterval;

        // Pehli slide active karein (Safety)
        heroSlides[0].classList.add('active');
        if(heroDots.length > 0) heroDots[0].classList.add('active');

        function updateHeroSlide() {
            heroSlides.forEach(slide => slide.classList.remove('active'));
            heroDots.forEach(dot => dot.classList.remove('active'));
            
            // Current slide active karein
            if(heroSlides[currentHeroSlide]) heroSlides[currentHeroSlide].classList.add('active');
            if(heroDots[currentHeroSlide]) heroDots[currentHeroSlide].classList.add('active');
        }

        function nextHeroSlide() {
            currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
            updateHeroSlide();
        }

        function prevHeroSlide() {
            currentHeroSlide = (currentHeroSlide - 1 + heroSlides.length) % heroSlides.length;
            updateHeroSlide();
        }

        function startHeroSlideshow() {
            clearInterval(heroSlideInterval);
            heroSlideInterval = setInterval(nextHeroSlide, 5000);
        }

        // Initialize Slider
        startHeroSlideshow();

        // Event Listeners
        if (nextHeroBtn) {
            nextHeroBtn.addEventListener('click', () => {
                nextHeroSlide();
                startHeroSlideshow(); // Timer reset
            });
        }

        if (prevHeroBtn) {
            prevHeroBtn.addEventListener('click', () => {
                prevHeroSlide();
                startHeroSlideshow(); // Timer reset
            });
        }

        heroDots.forEach((dot, index) => {
            dot.addEventListener('click', function() {
                currentHeroSlide = index;
                updateHeroSlide();
                startHeroSlideshow();
            });
        });
    }
});
