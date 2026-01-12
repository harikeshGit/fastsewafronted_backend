 const suppliers = [
            {
                name: "BuildMart Supplies",
                category: "construction",
                location: "delhi",
                rating: 4.8,
                orders: 1250,
                phone: "+91 98765-43210",
                email: "contact@buildmart.com",
                materials: ["Cement", "Steel", "Bricks", "Sand", "Aggregates"],
                description: "Leading supplier of construction materials with 15+ years experience"
            },
            {
                name: "Electric World",
                category: "electrical",
                location: "mumbai",
                rating: 4.6,
                orders: 980,
                phone: "+91 98765-43211",
                email: "info@electricworld.com",
                materials: ["Wires", "Switches", "LED Lights", "Circuit Breakers"],
                description: "Complete electrical solutions for residential and commercial projects"
            },
            {
                name: "PlumbTech Solutions",
                category: "plumbing",
                location: "bangalore",
                rating: 4.9,
                orders: 1450,
                phone: "+91 98765-43212",
                email: "sales@plumbtech.com",
                materials: ["Pipes", "Fittings", "Taps", "Sanitaryware"],
                description: "Premium quality plumbing materials and fixtures"
            },
            {
                name: "ColorMax Paints",
                category: "painting",
                location: "pune",
                rating: 4.7,
                orders: 850,
                phone: "+91 98765-43213",
                email: "support@colormax.com",
                materials: ["Paints", "Brushes", "Rollers", "Primers", "Putty"],
                description: "Wide range of paints and painting accessories"
            },
            {
                name: "Hardware Hub",
                category: "hardware",
                location: "delhi",
                rating: 4.5,
                orders: 720,
                phone: "+91 98765-43214",
                email: "contact@hardwarehub.com",
                materials: ["Tools", "Fasteners", "Locks", "Hinges"],
                description: "One-stop shop for all hardware and tools"
            },
            {
                name: "Modern Electricals",
                category: "electrical",
                location: "hyderabad",
                rating: 4.8,
                orders: 1100,
                phone: "+91 98765-43215",
                email: "info@modernelectricals.com",
                materials: ["MCBs", "Cables", "Fans", "Sockets", "Lights"],
                description: "Trusted name in electrical supplies"
            },
            {
                name: "Steel Masters",
                category: "construction",
                location: "mumbai",
                rating: 4.9,
                orders: 1580,
                phone: "+91 98765-43216",
                email: "sales@steelmasters.com",
                materials: ["TMT Bars", "MS Angles", "Channels", "Beams"],
                description: "Premium quality steel products for construction"
            },
            {
                name: "Aqua Flow Systems",
                category: "plumbing",
                location: "bangalore",
                rating: 4.6,
                orders: 890,
                phone: "+91 98765-43217",
                email: "contact@aquaflow.com",
                materials: ["PVC Pipes", "CPVC Pipes", "Water Tanks", "Pumps"],
                description: "Complete water management solutions"
            }
        ];

        let filteredSuppliers = [...suppliers];

        function renderSuppliers(suppliersToRender) {
            const grid = document.getElementById('suppliersGrid');
            grid.innerHTML = '';

            suppliersToRender.forEach(supplier => {
                const card = document.createElement('div');
                card.className = 'supplier-card';
                card.onclick = () => openContactModal(supplier);

                card.innerHTML = `
                    <div class="supplier-header">
                        <div class="supplier-name">${supplier.name}</div>
                        <div class="supplier-category">${supplier.category.charAt(0).toUpperCase() + supplier.category.slice(1)}</div>
                    </div>
                    <div class="supplier-body">
                        <div class="supplier-info">
                            <div class="info-row">
                                <div class="info-icon">📍</div>
                                <span>${supplier.location.charAt(0).toUpperCase() + supplier.location.slice(1)}</span>
                            </div>
                            <div class="info-row">
                                <div class="rating">
                                    <span class="stars">★</span>
                                    <span><strong>${supplier.rating}</strong> (${supplier.orders} orders)</span>
                                </div>
                            </div>
                        </div>
                        <div class="materials-list">
                            ${supplier.materials.map(m => `<span class="material-tag">${m}</span>`).join('')}
                        </div>
                        <button class="inquiry-btn">Send Inquiry</button>
                    </div>
                `;

                grid.appendChild(card);
            });

            document.getElementById('supplierCount').textContent = suppliersToRender.length + '+';
        }

        function filterSuppliers() {
            const category = document.getElementById('categoryFilter').value;
            const location = document.getElementById('locationFilter').value;
            const sortBy = document.getElementById('sortFilter').value;
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();

            filteredSuppliers = suppliers.filter(supplier => {
                const matchCategory = category === 'all' || supplier.category === category;
                const matchLocation = location === 'all' || supplier.location === location;
                const matchSearch = searchTerm === '' || 
                    supplier.name.toLowerCase().includes(searchTerm) ||
                    supplier.materials.some(m => m.toLowerCase().includes(searchTerm));

                return matchCategory && matchLocation && matchSearch;
            });

            if (sortBy === 'rating') {
                filteredSuppliers.sort((a, b) => b.rating - a.rating);
            } else if (sortBy === 'orders') {
                filteredSuppliers.sort((a, b) => b.orders - a.orders);
            } else if (sortBy === 'name') {
                filteredSuppliers.sort((a, b) => a.name.localeCompare(b.name));
            }

            renderSuppliers(filteredSuppliers);
        }

        function searchSuppliers() {
            filterSuppliers();
        }

        function openContactModal(supplier) {
            const modal = document.getElementById('contactModal');
            const modalBody = document.getElementById('modalBody');

            modalBody.innerHTML = `
                <h3>${supplier.name}</h3>
                <p style="color: #666; margin: 10px 0;">${supplier.description}</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                <div style="margin: 15px 0;">
                    <strong>Category:</strong> ${supplier.category.charAt(0).toUpperCase() + supplier.category.slice(1)}
                </div>
                <div style="margin: 15px 0;">
                    <strong>Location:</strong> ${supplier.location.charAt(0).toUpperCase() + supplier.location.slice(1)}
                </div>
                <div style="margin: 15px 0;">
                    <strong>Rating:</strong> ${supplier.rating} ★ (${supplier.orders} orders)
                </div>
                <div style="margin: 15px 0;">
                    <strong>Phone:</strong> ${supplier.phone}
                </div>
                <div style="margin: 15px 0;">
                    <strong>Email:</strong> ${supplier.email}
                </div>
                <div style="margin: 15px 0;">
                    <strong>Materials Supplied:</strong>
                    <div class="materials-list" style="margin-top: 10px;">
                        ${supplier.materials.map(m => `<span class="material-tag">${m}</span>`).join('')}
                    </div>
                </div>
                <button class="inquiry-btn" style="margin-top: 20px;" onclick="closeModal()">
                    Close
                </button>
            `;

            modal.classList.add('active');
        }

        function closeModal() {
            document.getElementById('contactModal').classList.remove('active');
        }

        function handleSubmit(e) {
            e.preventDefault();
            
            const form = e.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            console.log('Form submitted:', data);
            
            document.getElementById('successMessage').classList.add('show');
            form.reset();
            
            setTimeout(() => {
                document.getElementById('successMessage').classList.remove('show');
            }, 5000);
        }

        document.getElementById('searchInput').addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                searchSuppliers();
            }
        });

        renderSuppliers(suppliers);