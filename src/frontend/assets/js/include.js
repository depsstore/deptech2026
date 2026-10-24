/**
 * include.js — Loader partial HTML
 * Cara pakai:
 *   <div data-include="/src/frontend/pages/partials/head.html"></div>
 * atau khusus head:
 *   <script src=".../include.js" data-head="/src/frontend/pages/partials/head.html"></script>
 */
(function() {
    const BASE = '';

    async function loadPartial(url) {
        const res = await fetch(BASE + url);
        if (!res.ok) throw new Error('Gagal load: ' + url);
        return await res.text();
    }

    // Proses semua elemen [data-include]
    async function processIncludes() {
        const nodes = document.querySelectorAll('[data-include]');
        for (const el of nodes) {
            const url = el.getAttribute('data-include');
            try {
                el.innerHTML = await loadPartial(url);
            } catch (e) {
                console.error(e);
                el.innerHTML = '<!-- gagal load ' + url + ' -->';
            }
        }
    }

    // Khusus untuk <head> — load sebelum DOMContentLoaded
    async function processHead() {
        const script = document.currentScript;
        const headUrl = script && script.getAttribute('data-head');
        if (!headUrl) return;

        try {
            const html = await loadPartial(headUrl);
            const temp = document.createElement('div');
            temp.innerHTML = html;
            Array.from(temp.childNodes).forEach(n => document.head.appendChild(n));
        } catch (e) {
            console.error(e);
        }
    }

    // Jalankan head dulu (blocking), lalu body includes
    processHead().then(() => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', processIncludes);
        } else {
            processIncludes();
        }
    });
})();