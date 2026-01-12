  function animateCounter(element) {
            const target = parseInt(element.getAttribute('data-target'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    element.textContent = target;
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current);
                }
            }, 16);
        }

        // Intersection Observer for counter animation
        const observerOptions = {
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = entry.target.querySelectorAll('.stat-number');
                    counters.forEach(counter => {
                        animateCounter(counter);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const statsSection = document.querySelector('.stats');
        if (statsSection) observer.observe(statsSection);

        // Form submission handling
        document.getElementById('contactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                company: document.getElementById('company').value,
                iptype: document.getElementById('iptype').value,
                industry: document.getElementById('industry').value,
                brandname: document.getElementById('brandname').value,
                message: document.getElementById('message').value
            };

            // Show success message
            let message = `Thank you, ${formData.name}! 🎉\n\nWe have received your IP consultation request:\n\nService: ${formData.iptype}\nIndustry: ${formData.industry}`;
            
            if (formData.brandname) {
                message += `\nBrand Name: ${formData.brandname}`;
            }
            
            message += `\n\nOur IP expert will contact you within 24 hours to discuss protecting your intellectual property!`;
            
            alert(message);

            // Reset form
            this.reset();

            // Add animation to submit button
            const btn = document.querySelector('.submit-btn');
            btn.textContent = 'Submitted Successfully! ✓';
            btn.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
            
            setTimeout(() => {
                btn.textContent = 'Get Free Consultation';
                btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }, 3000);
        });

        // Add hover effect to IP cards
        const ipCards = document.querySelectorAll('.ip-card');
        ipCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                this.style.color = 'white';
                this.querySelector('h4').style.color = 'white';
                this.querySelector('p').style.color = 'white';
            });

            card.addEventListener('mouseleave', function() {
                this.style.background = 'white';
                this.style.color = '#333';
                this.querySelector('h4').style.color = '#667eea';
                this.querySelector('p').style.color = '#666';
            });
        });

        // Animate timeline items on scroll
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateX(-50px)';
                    
                    setTimeout(() => {
                        entry.target.style.transition = 'all 0.6s ease';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateX(0)';
                    }, 100);
                    
                    timelineObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.timeline-item').forEach((item, index) => {
            setTimeout(() => {
                timelineObserver.observe(item);
            }, index * 100);
        });