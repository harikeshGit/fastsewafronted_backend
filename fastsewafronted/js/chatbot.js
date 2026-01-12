document.addEventListener("DOMContentLoaded", function() {
    
    // --- CONFIGURATION ---
    const API = "https://fastsewabackend-production.up.railway.app/api"; 
    
    // DOM Elements
    const chatbox = document.getElementById("chatbox");
    const chatBody = document.getElementById("chatBody");
    const input = document.getElementById("chatInput");
    const toggleBtn = document.getElementById("toggleBtn");
    const closeBtn = document.getElementById("closeBtn");

    // Service Prompts Mapping
    const servicePrompts = {
        construction: "I want construction",
        security: "Need security guard",
        medical: "I need a doctor",
        legal: "Legal help",
        land: "Land verification",
        finance: "Finance assistant",
        vendor: "I want to register as a vendor",
        repair: "I need repair services"
    };

    // Toggle Chatbox
    if(toggleBtn) {
        toggleBtn.onclick = () => {
            if(chatbox.style.display === "flex") {
                chatbox.style.display = "none";
            } else {
                chatbox.style.display = "flex";
                if(chatBody.innerHTML.trim() === "") initChat();
            }
        };
    }
    
    if(closeBtn) {
        closeBtn.onclick = () => {
            chatbox.style.display = "none";
        };
    }

    // Helper: Add Message to UI
    function addMsg(text, type) {
        const div = document.createElement("div");
        div.className = "fastsewa-message " + (type === "bot" ? "fastsewa-bot-message" : "fastsewa-user-message");
        div.innerHTML = text;
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Main Send Function (Global Scope for HTML buttons)
    window.sendMessage = async function(key) {
        let msg = "";

        if (key && servicePrompts[key]) {
            msg = servicePrompts[key];
        } else {
            msg = input.value.trim();
        }

        if (!msg) return;

        // User Message UI
        addMsg(msg, "user");
        if(input) input.value = "";

        // Show Loading Indicator (Optional but good UX)
        // addMsg('<i class="fas fa-ellipsis-h"></i>', "bot"); 
        
        try {
            const res = await fetch(`${API}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg })
            });

            const data = await res.json();
            
            // Remove loading if added...
            
            // Bot Response UI
            addMsg(data.response || "Sorry, I didn't understand. Please try again.", "bot");

            // PDF Link Check
            if (data.pdf_generated && data.pdf_file) {
                addMsg(`<a class="pdf-download-btn" target="_blank" href="${API}/download-pdf/${data.pdf_file}"><i class="fas fa-file-pdf"></i> Download Estimate PDF</a>`, "bot");
            }

        } catch (err) {
            console.error(err);
            addMsg("⚠️ Server busy. Please try calling support: +91 8275723755", "bot");
        }
    };

    // Handle Enter Key
    if(input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }

    // Initial Welcome Message
    function initChat() {
        addMsg("👋 <b>Namaste!</b> Welcome to FastSewa. How can we help you today?", "bot");
        
        addMsg(`
          <div class="service-buttons">
            <button class="service-btn" onclick="sendMessage('construction')"><i class="fas fa-hard-hat"></i> Construction</button>
            <button class="service-btn" onclick="sendMessage('security')"><i class="fas fa-shield-alt"></i> Security</button>
            <button class="service-btn" onclick="sendMessage('medical')"><i class="fas fa-user-md"></i> Medical</button>
            <button class="service-btn" onclick="sendMessage('legal')"><i class="fas fa-gavel"></i> Legal & GST</button>
            <button class="service-btn" onclick="sendMessage('land')"><i class="fas fa-map"></i> Land Verify</button>
            <button class="service-btn" onclick="sendMessage('finance')"><i class="fas fa-coins"></i> Finance</button>
            <button class="service-btn" onclick="sendMessage('repair')"><i class="fas fa-tools"></i> Repairs</button>
            <button class="service-btn" onclick="sendMessage('vendor')"><i class="fas fa-truck"></i> Vendor Reg.</button>
          </div>
        `, "bot");
    }
});