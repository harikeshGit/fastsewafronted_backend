(function () {
    const API = (() => {
        const custom = window.localStorage.getItem('apiUrl');
        if (custom) return `${custom}/api/announcements`;

        const hostname = window.location.hostname;
        const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
        if (isLocalHost) return 'http://localhost:4000/api/announcements';

        const origin = window.location.origin;
        if (!origin || origin === 'null') return 'http://localhost:4000/api/announcements';
        return `${origin}/api/announcements`;
    })();
    async function load() {
        try {
            const res = await fetch(API);
            const items = await res.json();
            const active = items.filter(i => i.active);
            if (active.length) {
                renderBar(active[0]);
            }
        } catch (err) {
            // silently ignore if backend not available
        }
    }
    function renderBar(item) {
        const bar = document.createElement('div');
        bar.id = 'announcement-bar';
        bar.style.cssText = 'position:fixed;top:70px;left:0;right:0;background:#fff7ed;color:#7c2d12;border-bottom:1px solid #ffe4c7;padding:10px 20px;z-index:999;display:flex;gap:10px;align-items:center;justify-content:center;font-family:Poppins,system-ui,sans-serif;';
        const title = document.createElement('strong');
        title.textContent = item.title + ':';
        const msg = document.createElement('span');
        msg.textContent = ' ' + item.message;
        const close = document.createElement('button');
        close.textContent = '×';
        close.style.cssText = 'margin-left:12px;background:transparent;border:none;font-size:18px;color:#b45309;cursor:pointer;';
        close.addEventListener('click', () => bar.remove());
        bar.appendChild(title);
        bar.appendChild(msg);
        bar.appendChild(close);
        document.body.appendChild(bar);
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', load); }
    else { load(); }
})();
