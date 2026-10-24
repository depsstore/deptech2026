/* =====================================================
   DEPTECH SETTINGS v2.0
   =====================================================
   Dark mode, font size, aksen (via data-accent), bahasa.
   Semua warna via theme.css.
   ===================================================== */

(function() {
    'use strict';

    // =====================================================
    // KEY STORAGE
    // =====================================================
    var KEYS = {
        darkmode: 'deptech_darkmode',
        fontsize: 'deptech_fontsize',
        aksen: 'deptech_aksen',
        bahasa: 'deptech_bahasa',
        notif_transaksi: 'deptech_notif_transaksi',
        notif_promo: 'deptech_notif_promo',
        notif_keamanan: 'deptech_notif_keamanan',
        notif_info: 'deptech_notif_info'
    };

    // =====================================================
    // AKSEN
    // =====================================================
    var VALID_ACCENTS = ['indigo', 'rose', 'emerald', 'amber', 'violet', 'slate'];

    // Mapping hex lama → nama aksen (backward compat)
    var HEX_TO_ACCENT = {
        '#2563eb': 'indigo',
        '#4f46e5': 'indigo',
        '#7c3aed': 'violet',
        '#9333ea': 'violet',
        '#c026d3': 'violet',
        '#db2777': 'rose',
        '#e11d48': 'rose',
        '#dc2626': 'rose',
        '#ea580c': 'amber',
        '#f59e0b': 'amber',
        '#16a34a': 'emerald',
        '#0d9488': 'emerald',
        '#0891b2': 'indigo',
        '#059669': 'emerald',
        '#4338ca': 'indigo'
    };

    // =====================================================
    // UPDATE META THEME-COLOR
    // =====================================================
    function _updateThemeMeta(isDark) {
        var metaList = document.querySelectorAll('meta[name="theme-color"]');
        var color = isDark ? '#0E0F14' : '#4338CA';

        if (metaList.length === 0) {
            var meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = color;
            document.head.appendChild(meta);
            return;
        }
        metaList.forEach(function(m) {
            if (m.hasAttribute('media')) m.removeAttribute('media');
            m.content = color;
        });
    }

    // =====================================================
    // APPLY DARK MODE
    // =====================================================
    function applyDarkMode(isActive) {
        var root = document.documentElement;

        if (isActive) {
            root.classList.add('dark-mode');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark-mode');
            root.setAttribute('data-theme', 'light');
        }

        _updateThemeMeta(!!isActive);

        try {
            window.dispatchEvent(new CustomEvent('deptech:theme-changed', {
                detail: { dark: !!isActive }
            }));
        } catch (e) {}
    }

    // =====================================================
    // APPLY FONT SIZE
    // =====================================================
    function applyFontSize(size) {
        var sizes = {
            kecil: '13px',
            sedang: '16px',
            besar: '18px'
        };
        var fontSize = sizes[size] || '16px';
        document.documentElement.style.fontSize = fontSize;
        document.documentElement.setAttribute('data-fontsize', size);
    }

    // =====================================================
    // APPLY AKSEN (via data-accent)
    // =====================================================
    function applyAksen(nameOrHex) {
        var accentName = 'indigo';

        if (nameOrHex) {
            var lower = String(nameOrHex).toLowerCase();
            if (VALID_ACCENTS.indexOf(lower) !== -1) {
                accentName = lower;
            } else if (HEX_TO_ACCENT[lower]) {
                accentName = HEX_TO_ACCENT[lower];
            }
        }

        var root = document.documentElement;
        root.setAttribute('data-accent', accentName);

        // Update preview color dot
        var previewEl = document.getElementById('previewColor');
        if (previewEl) {
            var computed = getComputedStyle(root).getPropertyValue('--accent').trim();
            if (computed) previewEl.style.background = computed;
        }

        try {
            window.dispatchEvent(new CustomEvent('deptech:theme-changed', {
                detail: { accent: accentName }
            }));
        } catch (e) {}
    }

    // =====================================================
    // APPLY BAHASA
    // =====================================================
    function applyBahasa(lang) {
        document.documentElement.setAttribute('lang', lang || 'id');
        document.documentElement.setAttribute('data-bahasa', lang || 'id');
    }

    // =====================================================
    // INIT
    // =====================================================
    function initSettings() {
        var darkmode = localStorage.getItem(KEYS.darkmode) === 'true';
        var fontsize = localStorage.getItem(KEYS.fontsize) || 'sedang';
        var aksen = localStorage.getItem(KEYS.aksen) || 'indigo';
        var bahasa = localStorage.getItem(KEYS.bahasa) || 'id';

        applyDarkMode(darkmode);
        applyFontSize(fontsize);
        applyAksen(aksen);
        applyBahasa(bahasa);

        console.log('[deptech-settings v2] Applied:', {
            darkmode: darkmode,
            fontsize: fontsize,
            aksen: aksen,
            bahasa: bahasa
        });
    }

    // =====================================================
    // TOGGLE DARK MODE
    // =====================================================
    window.toggleDarkMode = function(el) {
        el.classList.toggle('active');
        var isActive = el.classList.contains('active');
        localStorage.setItem(KEYS.darkmode, isActive);
        applyDarkMode(isActive);
        if (typeof showToast === 'function') {
            showToast(isActive ? '🌙 Mode gelap diaktifkan' : '☀️ Mode terang diaktifkan');
        }
    };

    // =====================================================
    // FONT SIZE
    // =====================================================
    window.ubahFontSize = function() {
        var select = document.getElementById('fontSize');
        if (!select) return;
        var size = select.value;
        localStorage.setItem(KEYS.fontsize, size);
        applyFontSize(size);
        if (typeof showToast === 'function') {
            showToast('📝 Ukuran font: ' + size);
        }
    };

    // =====================================================
    // AKSEN
    // =====================================================
    window.pilihAksen = function(el, accentName) {
        document.querySelectorAll('.color-option').forEach(function(item) {
            item.classList.remove('active');
        });
        if (el) el.classList.add('active');

        localStorage.setItem(KEYS.aksen, accentName);
        applyAksen(accentName);
    };

    window.simpanAksen = function() {
        var accent = localStorage.getItem(KEYS.aksen) || 'indigo';
        applyAksen(accent);
        if (typeof showToast === 'function') {
            showToast('🎨 Warna aksen berhasil disimpan!');
        }
        setTimeout(function() {
            window.location.href = 'tampilan.html';
        }, 800);
    };

    window.initAksen = function() {
        var saved = localStorage.getItem(KEYS.aksen) || 'indigo';
        var accentName = VALID_ACCENTS.indexOf(String(saved).toLowerCase()) !== -1
            ? String(saved).toLowerCase()
            : (HEX_TO_ACCENT[String(saved).toLowerCase()] || 'indigo');

        document.querySelectorAll('.color-option').forEach(function(item) {
            item.classList.remove('active');
            if (item.dataset.accent === accentName) {
                item.classList.add('active');
            }
        });

        applyAksen(accentName);
    };

    // =====================================================
    // BAHASA
    // =====================================================
    window.pilihBahasa = function(el, bahasa, langCode) {
        document.querySelectorAll('.bahasa-check').forEach(function(item) {
            item.style.display = 'none';
        });
        var check = el.querySelector('.bahasa-check');
        if (check) check.style.display = 'flex';

        localStorage.setItem(KEYS.bahasa, langCode);
        localStorage.setItem(KEYS.bahasa + '_name', bahasa);
        applyBahasa(langCode);

        if (typeof showToast === 'function') {
            showToast('🌐 Bahasa diubah ke ' + bahasa);
        }
    };

    window.initBahasa = function() {
        var saved = localStorage.getItem(KEYS.bahasa) || 'id';
        document.querySelectorAll('.bahasa-item').forEach(function(item) {
            var check = item.querySelector('.bahasa-check');
            if (check) check.style.display = 'none';
            if (item.dataset.lang === saved) {
                if (check) check.style.display = 'flex';
            }
        });
    };

    // =====================================================
    // NOTIF
    // =====================================================
    window.toggleNotif = function(el, key) {
        el.classList.toggle('active');
        var isActive = el.classList.contains('active');
        localStorage.setItem(key, isActive);

        var parent = el.closest('.notifikasi-item');
        var labelEl = parent ? parent.querySelector('.notif-title') : null;
        var label = labelEl ? labelEl.textContent : 'Notifikasi';

        if (typeof showToast === 'function') {
            showToast(label + ' ' + (isActive ? 'diaktifkan' : 'dinonaktifkan'));
        }
    };

    window.initNotif = function() {
        var notifKeys = [
            { id: 'notifTransaksi', key: KEYS.notif_transaksi, default: true },
            { id: 'notifPromo', key: KEYS.notif_promo, default: true },
            { id: 'notifKeamanan', key: KEYS.notif_keamanan, default: true },
            { id: 'notifInfo', key: KEYS.notif_info, default: false }
        ];

        notifKeys.forEach(function(n) {
            var el = document.getElementById(n.id);
            if (!el) return;
            var saved = localStorage.getItem(n.key);
            var isActive = saved === null ? n.default : saved === 'true';
            if (isActive) el.classList.add('active');
            else el.classList.remove('active');
        });
    };

    // =====================================================
    // AUTO-INIT
    // =====================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSettings);
    } else {
        initSettings();
    }

    // =====================================================
    // EXPORT
    // =====================================================
    window.DeptechSettings = {
        init: initSettings,
        toggleDarkMode: window.toggleDarkMode,
        ubahFontSize: window.ubahFontSize,
        pilihAksen: window.pilihAksen,
        simpanAksen: window.simpanAksen,
        pilihBahasa: window.pilihBahasa,
        toggleNotif: window.toggleNotif,
        KEYS: KEYS
    };
})();