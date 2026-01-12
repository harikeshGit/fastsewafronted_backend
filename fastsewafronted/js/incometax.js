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
        observer.observe(statsSection);

        // Form submission handling
        document.getElementById('contactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                pan: document.getElementById('pan').value,
                taxpayer: document.getElementById('taxpayer').value,
                service: document.getElementById('service').value,
                income: document.getElementById('income').value,
                message: document.getElementById('message').value
            };

            // Show success message
            alert(`Thank you, ${formData.name}! 🎉\n\nWe have received your consultation request:\n\nPAN: ${formData.pan}\nService: ${formData.service}\nIncome Range: ${formData.income}\n\nOur tax expert will contact you within 24 hours to discuss your tax planning strategy!`);

            // Reset form
            this.reset();

            // Add animation to submit button
            const btn = document.querySelector('.submit-btn');
            btn.textContent = 'Submitted Successfully! ✓';
            btn.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
            
            setTimeout(() => {
                btn.textContent = 'Get Free Consultation';
                btn.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
            }, 3000);
        });

        // Add hover effect to benefit cards
        const benefitCards = document.querySelectorAll('.benefit-card');
        benefitCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                this.style.color = 'white';
                this.querySelector('h4').style.color = 'white';
                this.querySelector('p').style.color = 'white';
            });

            card.addEventListener('mouseleave', function() {
                this.style.background = 'white';
                this.style.color = '#333';
                this.querySelector('h4').style.color = '#11998e';
                this.querySelector('p').style.color = '#666';
            });
        });

        // PAN number validation and formatting
        document.getElementById('pan').addEventListener('input', function(e) {
            this.value = this.value.toUpperCase();
        });