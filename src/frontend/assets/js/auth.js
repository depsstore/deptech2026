/* =====================================================
   DEPTECH — AUTH JAVASCRIPT (v2.0.0)
   =====================================================
   Changelog:
     - v2.0.0: Password hash (SHA-256 + salt per user).
               Auto-migrate plaintext → hash saat login.
               Rate-limit login (5x gagal → 30 dtk cooldown).
               Validasi email & panjang password.
               OAuth state parameter.
               Guard crypto.subtle (wajib).
               Trigger migrateLegacyData() saat login pertama.
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // =====================================================
    // KONSTANTA
    // =====================================================
    var KEY_USERS = 'deptech_users';
    var KEY_LOGIN_ATTEMPTS = 'deptech_login_attempts';
    var MAX_ATTEMPTS = 5;
    var COOLDOWN_MS = 30000; // 30 detik
    var PASSWORD_MIN_LENGTH = 6;

    // =====================================================
    // CEK CRYPTO.SUBTLE (FR-1.1 — Q5 Opsi C)
    // =====================================================
    function isCryptoAvailable() {
        return !!(window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function');
    }

    function blockIfNoCrypto(errorEl) {
        if (isCryptoAvailable()) return false;
        var msg = 'Aplikasi harus dijalankan via HTTPS atau localhost. ' +
            'Fitur keamanan tidak tersedia di origin ini.';
        setError(errorEl, msg);
        if (typeof showError === 'function') showError(msg);
        return true;
    }

    // =====================================================
    // HASH PASSWORD (SHA-256)
    // =====================================================
    /**
     * Hash password dengan SHA-256.
     * @param {string} password
     * @param {string} salt — hex string
     * @returns {Promise<string>} — hex hash
     */
    function hashPassword(password, salt) {
        if (!isCryptoAvailable()) {
            return Promise.reject(new Error('crypto.subtle tidak tersedia'));
        }
        var enc = new TextEncoder();
        var data = enc.encode(salt + ':' + password);
        return window.crypto.subtle.digest('SHA-256', data).then(function (buf) {
            var bytes = new Uint8Array(buf);
            var hex = '';
            for (var i = 0; i < bytes.length; i++) {
                hex += bytes[i].toString(16).padStart(2, '0');
            }
            return hex;
        });
    }

    /**
     * Verifikasi password terhadap hash + salt.
     */
    function verifyPassword(password, salt, expectedHash) {
        return hashPassword(password, salt).then(function (actual) {
            return actual === expectedHash;
        });
    }

    // =====================================================
    // GENERATE SALT (random 16 byte → 32 char hex)
    // =====================================================
    function generateSalt() {
        var bytes = new Uint8Array(16);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            // Fallback (tidak ideal — hanya untuk browser sangat lama)
            for (var i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
        }
        var hex = '';
        for (var i = 0; i < bytes.length; i++) {
            hex += bytes[i].toString(16).padStart(2, '0');
        }
        return hex;
    }

    // =====================================================
    // RATE LIMIT LOGIN
    // =====================================================
    function getLoginAttempts() {
        try {
            return JSON.parse(localStorage.getItem(KEY_LOGIN_ATTEMPTS) || '{"count":0,"until":0}');
        } catch (e) {
            return { count: 0, until: 0 };
        }
    }

    function setLoginAttempts(obj) {
        try { localStorage.setItem(KEY_LOGIN_ATTEMPTS, JSON.stringify(obj)); } catch (e) { }
    }

    function checkRateLimit() {
        var a = getLoginAttempts();
        if (a.until && Date.now() < a.until) {
            var wait = Math.ceil((a.until - Date.now()) / 1000);
            return { limited: true, waitSeconds: wait };
        }
        return { limited: false, waitSeconds: 0 };
    }

    function recordFailedAttempt() {
        var a = getLoginAttempts();
        a.count = (a.count || 0) + 1;
        if (a.count >= MAX_ATTEMPTS) {
            a.until = Date.now() + COOLDOWN_MS;
            a.count = 0; // reset counter setelah cooldown di-set
        }
        setLoginAttempts(a);
    }

    function resetAttempts() {
        setLoginAttempts({ count: 0, until: 0 });
    }

    // =====================================================
    // HELPER UI
    // =====================================================
    function setError(el, message) {
        if (!el) return;
        if (!message) { el.classList.remove('show'); return; }
        var span = el.querySelector('span');
        if (span) span.textContent = message;
        else el.textContent = message;
        el.classList.add('show');
    }

    function setLoading(btn, isLoading) {
        if (!btn) return;
        if (isLoading) {
            btn.disabled = true;
            btn.dataset.originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Memproses...</span>';
        } else {
            btn.disabled = false;
            if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
        }
    }

    // =====================================================
    // VALIDASI
    // =====================================================
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    }

    function isValidPassword(pw) {
        return String(pw || '').length >= PASSWORD_MIN_LENGTH;
    }

    // =====================================================
    // USER LIST MANAGEMENT
    // =====================================================
    function loadUsers() {
        try {
            var raw = localStorage.getItem(KEY_USERS);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(list) {
        try { localStorage.setItem(KEY_USERS, JSON.stringify(list)); }
        catch (e) { console.error('[Auth] Gagal simpan users:', e); }
    }

    function findUserByEmail(email) {
        var target = String(email || '').trim().toLowerCase();
        var list = loadUsers();
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].email || '').trim().toLowerCase() === target) {
                return { index: i, user: list[i] };
            }
        }
        return null;
    }

    // =====================================================
    // DETEKSI DEVICE (tidak berubah)
    // =====================================================
    function detectBrowser(ua) {
        if (/Edg\//i.test(ua)) return 'Edge';
        if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
        if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
        if (/Firefox\//i.test(ua) || /FxiOS/i.test(ua)) return 'Firefox';
        if (/CriOS/i.test(ua)) return 'Chrome';
        if (/Chrome\//i.test(ua)) return 'Chrome';
        if (/Safari\//i.test(ua)) return 'Safari';
        return 'Browser';
    }

    function detectOS(ua) {
        if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
        if (/Windows NT/i.test(ua)) return 'Windows';
        if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'macOS';
        if (/Android/i.test(ua)) return 'Android';
        if (/iPhone/i.test(ua)) return 'iPhone';
        if (/iPad/i.test(ua)) return 'iPad';
        if (/Linux/i.test(ua)) return 'Linux';
        return 'Unknown OS';
    }

    function detectDeviceType(ua) {
        if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return 'Tablet';
        if (/iPhone|iPod/i.test(ua)) return 'iPhone';
        if (/Android/i.test(ua)) {
            if (/Mobile/i.test(ua)) return 'Android Phone';
            return 'Android Tablet';
        }
        if (/Mobile/i.test(ua)) return 'Mobile';
        return 'Desktop';
    }

    function detectDeviceIcon(ua) {
        if (/iPad|Tablet|Android Tablet/i.test(ua)) return 'fa-tablet-screen-button';
        if (/iPhone|iPod|Android Phone|Mobile/i.test(ua)) return 'fa-mobile-screen-button';
        return 'fa-laptop';
    }

    function getDeviceInfo() {
        var ua = navigator.userAgent;
        var browser = detectBrowser(ua);
        var os = detectOS(ua);
        var type = detectDeviceType(ua);
        var icon = detectDeviceIcon(ua);
        return {
            device: browser + ' · ' + os,
            type: type,
            browser: browser,
            os: os,
            icon: icon,
            location: 'Indonesia',
            userAgent: ua
        };
    }

    // =====================================================
    // TOGGLE PASSWORD (delegation)
    // =====================================================
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.toggle-password');
        if (!btn) return;
        var wrapper = btn.closest('.input-wrapper');
        if (!wrapper) return;
        var input = wrapper.querySelector('input');
        var icon = btn.querySelector('i');
        if (!input || !icon) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fa-regular fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fa-regular fa-eye';
        }
    });

    // =====================================================
    // LOGIN
    // =====================================================
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var emailEl = document.getElementById('loginEmail');
            var passEl = document.getElementById('loginPassword');
            var btn = this.querySelector('.btn-submit');
            var errorEl = document.getElementById('loginError');

            var email = emailEl ? emailEl.value.trim() : '';
            var password = passEl ? passEl.value.trim() : '';

            setError(errorEl, '');

            // Guard crypto
            if (blockIfNoCrypto(errorEl)) return;

            // Rate limit
            var rl = checkRateLimit();
            if (rl.limited) {
                setError(errorEl, 'Terlalu banyak percobaan. Tunggu ' + rl.waitSeconds + ' detik.');
                return;
            }

            // Validasi
            if (!email || !password) {
                setError(errorEl, 'Email dan password wajib diisi!');
                return;
            }
            if (!isValidEmail(email)) {
                setError(errorEl, 'Format email tidak valid!');
                return;
            }

            if (typeof DeptechStore === 'undefined') {
                setError(errorEl, 'Sistem belum siap. Coba refresh halaman.');
                return;
            }

            setLoading(btn, true);

            var found = findUserByEmail(email);
            if (!found) {
                // User tidak ada → record attempt (tapi tetap delay sama)
                recordFailedAttempt();
                setTimeout(function () {
                    setLoading(btn, false);
                    setError(errorEl, 'Email atau password salah!');
                }, 600);
                return;
            }

            var user = found.user;
            var list = loadUsers();
            var verifyPromise;

            // Cek format: sudah hash atau masih plaintext (legacy)
            if (user.passwordHash && user.salt) {
                // Format v2: hash + salt
                verifyPromise = verifyPassword(password, user.salt, user.passwordHash);
            } else if (user.password) {
                // Format v1 (legacy plaintext) → verifikasi langsung
                verifyPromise = Promise.resolve(String(user.password) === String(password))
                    .then(function (ok) {
                        if (!ok) return false;
                        // Auto-migrate ke hash
                        var salt = generateSalt();
                        return hashPassword(password, salt).then(function (hash) {
                            list[found.index].passwordHash = hash;
                            list[found.index].salt = salt;
                            delete list[found.index].password;
                            saveUsers(list);
                            console.log('[Auth] User di-upgrade ke hash (auto-migrate)');
                            return true;
                        });
                    });
            } else {
                verifyPromise = Promise.resolve(false);
            }

            verifyPromise.then(function (ok) {
                setLoading(btn, false);

                if (!ok) {
                    recordFailedAttempt();
                    setError(errorEl, 'Email atau password salah!');
                    if (typeof showToast === 'function') showToast('Email atau password salah!');
                    return;
                }

                resetAttempts();

                // LOGIN BERHASIL
                DeptechStore.setUser({
                    id: user.email,
                    name: user.name,
                    email: user.email,
                    picture: user.picture || '',
                    provider: user.provider || 'manual'
                });

                // ✅ MIGRASI DATA LEGACY
                try {
                    var mig = DeptechStore.migrateLegacyData();
                    if (mig.migrated) {
                        console.log('[Auth] Legacy data migrated:', mig);
                    }
                } catch (e) {
                    console.warn('[Auth] Migration skipped:', e);
                }

                // Log device & history
                var info = getDeviceInfo();
                if (typeof DeptechStore.addLoginHistory === 'function') {
                    DeptechStore.addLoginHistory({
                        device: info.device,
                        type: info.type,
                        browser: info.browser,
                        os: info.os,
                        icon: info.icon,
                        location: info.location,
                        userAgent: info.userAgent
                    });
                }
                if (typeof DeptechStore.logActivity === 'function') {
                    DeptechStore.logActivity({
                        action: 'login',
                        title: 'Login Berhasil',
                        description: info.device + ' · ' + info.location,
                        icon: 'fa-right-to-bracket',
                        iconType: 'security',
                        meta: { browser: info.browser, os: info.os, type: info.type }
                    });
                }

                if (typeof showToast === 'function') {
                    showToast('Login berhasil! Selamat datang ' + user.name + ' 👋');
                }

                setTimeout(function () {
                    window.location.href = '/index.html';
                }, 1000);

            }).catch(function (err) {
                setLoading(btn, false);
                console.error('[Auth] Verify error:', err);
                setError(errorEl, 'Terjadi kesalahan. Coba lagi.');
            });
        });
    }

    // =====================================================
    // REGISTER
    // =====================================================
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var nameEl = document.getElementById('registerName');
            var emailEl = document.getElementById('registerEmail');
            var passEl = document.getElementById('registerPassword');
            var confirmEl = document.getElementById('registerConfirmPassword');
            var btn = this.querySelector('.btn-submit');
            var errorEl = document.getElementById('registerError');

            var name = nameEl ? nameEl.value.trim() : '';
            var email = emailEl ? emailEl.value.trim() : '';
            var password = passEl ? passEl.value.trim() : '';
            var confirmPassword = confirmEl ? confirmEl.value.trim() : '';

            setError(errorEl, '');

            if (blockIfNoCrypto(errorEl)) return;

            if (!name || !email || !password || !confirmPassword) {
                setError(errorEl, 'Semua field wajib diisi!');
                return;
            }
            if (name.length < 2) {
                setError(errorEl, 'Nama minimal 2 karakter!');
                return;
            }
            if (!isValidEmail(email)) {
                setError(errorEl, 'Format email tidak valid!');
                return;
            }
            if (!isValidPassword(password)) {
                setError(errorEl, 'Password minimal ' + PASSWORD_MIN_LENGTH + ' karakter!');
                return;
            }
            if (password !== confirmPassword) {
                setError(errorEl, 'Konfirmasi password tidak cocok!');
                return;
            }
            if (findUserByEmail(email)) {
                setError(errorEl, 'Email sudah terdaftar! Silakan masuk.');
                return;
            }
            if (typeof DeptechStore === 'undefined') {
                setError(errorEl, 'Sistem belum siap. Coba refresh halaman.');
                return;
            }

            setLoading(btn, true);

            // Generate salt + hash
            var salt = generateSalt();
            hashPassword(password, salt).then(function (hash) {
                var list = loadUsers();
                list.push({
                    email: email,
                    passwordHash: hash,
                    salt: salt,
                    name: name,
                    createdAt: new Date().toISOString()
                });
                saveUsers(list);

                setLoading(btn, false);
                if (typeof showToast === 'function') {
                    showToast('Akun berhasil dibuat! Selamat bergabung ' + name + ' 🎉');
                }
                setTimeout(function () {
                    window.location.href = '/src/frontend/pages/profile/account/auth/login.html';
                }, 1000);

            }).catch(function (err) {
                setLoading(btn, false);
                console.error('[Auth] Hash error:', err);
                setError(errorEl, 'Gagal mengenkripsi password. Coba lagi.');
            });
        });
    }

    // =====================================================
    // FORGOT PASSWORD
    // =====================================================
    var forgotLink = document.getElementById('forgotLink');
    if (forgotLink) {
        forgotLink.addEventListener('click', function (e) {
            e.preventDefault();
            if (typeof showToast === 'function') showToast('Fitur reset password akan segera hadir! 🔜');
        });
    }

    // =====================================================
    // SOCIAL BUTTONS (non-Google)
    // =====================================================
    document.querySelectorAll('.social-btn').forEach(function (btn) {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf('googleLogin') !== -1) {
            return; // skip Google (ditangani terpisah)
        }
        btn.addEventListener('click', function () {
            var span = this.querySelector('span');
            var provider = span ? span.textContent.trim() : 'Social';
            if (typeof showToast === 'function') showToast('Login dengan ' + provider + ' akan segera hadir! 🔜');
        });
    });

    // =====================================================
    // GOOGLE OAUTH — dengan STATE PARAMETER (FR-1.3)
    // =====================================================
    var GOOGLE_CLIENT_ID = '966484435930-vsocsl65uaem71acrbs50h5l6258upt3.apps.googleusercontent.com';
    var GOOGLE_REDIRECT_URI = window.location.origin +
        '/src/frontend/pages/profile/account/auth/callback.html';

    var ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5500',
        'https://deptech-app.vercel.app' // ← ganti dengan domain Anda nanti
    ];

    function isOriginAllowed() {
        var origin = window.location.origin;
        for (var i = 0; i < ALLOWED_ORIGINS.length; i++) {
            if (origin === ALLOWED_ORIGINS[i]) return true;
        }
        return false;
    }

    window.googleLogin = function () {
        if (!isOriginAllowed()) {
            if (typeof showError === 'function') {
                showError('Google login tidak tersedia di origin ini (' + window.location.origin + ').');
            }
            return;
        }

        // Generate state random
        var state = (window.crypto && window.crypto.randomUUID)
            ? window.crypto.randomUUID()
            : Math.random().toString(36).substring(2) + Date.now().toString(36);

        try {
            sessionStorage.setItem('deptech_oauth_state', state);
        } catch (e) {
            console.warn('[Auth] sessionStorage tidak tersedia:', e);
        }

        var params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_REDIRECT_URI,
            response_type: 'token',
            scope: 'openid email profile',
            prompt: 'select_account',
            state: state
        });

        window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
    };

});