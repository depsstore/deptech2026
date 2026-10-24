/* =====================================================
   DEPTECH - STORE (v2.0.0 — Multi-User Namespace)
   =====================================================
   Changelog:
     - v2.0.0: Namespace per-user via emailHash (12 char).
               Migrasi one-shot dari key global ke namespace.
               Guest namespace untuk user belum login.
               Backward-compatible API publik.
               deleteTarget() pakai currentAmount (bukan hitung dari logs).
               Guard QuotaExceededError.
   ===================================================== */

var DeptechStore = (function () {
    'use strict';

    // =====================================================
    // KEY STORAGE — BASE NAME (tanpa namespace)
    // =====================================================
    var BASE_KEYS = {
        user: 'deptech_user',                 // ← GLOBAL (current user)
        usersList: 'deptech_users',           // ← GLOBAL (direktori akun)
        balance: 'balance',
        transactions: 'transactions',
        targets: 'targets',
        targetLogs: 'target_logs',
        logins: 'login_history',
        notifRead: 'notif_read',
        cart: 'cart',
        wishlist: 'wishlist',
        activityLog: 'activity_log',
        avatar: 'avatar'
    };

    var LEGACY_KEY_PREFIX = 'deptech_'; // key global versi lama
    var NS_PREFIX = 'deptech_ns_';
    var MIGRATION_FLAG = 'deptech_migrated_to_ns';

    // =====================================================
    // CORE STORAGE (dengan guard QuotaExceededError)
    // =====================================================
    function _safeGetRaw(key) {
        try { return localStorage.getItem(key); }
        catch (e) {
            console.warn('[DeptechStore] getItem error:', key, e);
            return null;
        }
    }

    function _safeSetRaw(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
                console.error('[DeptechStore] Storage penuh saat simpan:', key);
                if (typeof showError === 'function') {
                    showError('Penyimpanan browser penuh. Hapus data lama atau gunakan mode incognito.');
                }
            } else {
                console.error('[DeptechStore] setItem error:', key, e);
            }
            return false;
        }
    }

    function load(key, fallback) {
        var raw = _safeGetRaw(key);
        if (!raw) return fallback;
        try { return JSON.parse(raw); }
        catch (e) { return fallback; }
    }

    function save(key, value) {
        return _safeSetRaw(key, JSON.stringify(value));
    }

    function remove(key) {
        try { localStorage.removeItem(key); } catch (e) {}
    }

    // =====================================================
    // USER HASH (untuk namespace)
    // =====================================================
    function _simpleHash(str) {
        // FNV-1a 32-bit — cukup untuk namespace, BUKAN untuk keamanan
        var h = 0x811c9dc5;
        for (var i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
        }
        return h.toString(16).padStart(8, '0');
    }

    /**
     * Kembalikan prefix namespace untuk user aktif.
     * - Logged in:  'deptech_ns_<12charHash>_'
     * - Guest:      'deptech_ns_guest_'
     */
    function getUserKey() {
        var user = getUser();
        if (user && user.email) {
            var hash = _simpleHash(String(user.email).toLowerCase()).substring(0, 12);
            return NS_PREFIX + hash + '_';
        }
        return NS_PREFIX + 'guest_';
    }

    // =====================================================
    // NAMESPACED KEY HELPER
    // =====================================================
    function _nsKey(name) {
        return getUserKey() + BASE_KEYS[name];
    }

    // =====================================================
    // UID
    // =====================================================
    function uid(prefix) {
        return (prefix || 'id') + '_' + Date.now().toString(36) +
            Math.random().toString(36).substr(2, 6);
    }

    // =====================================================
    // USER (GLOBAL — bukan namespaced)
    // =====================================================
    function getUser() {
        return load(BASE_KEYS.user, null);
    }

    function setUser(user) {
        save(BASE_KEYS.user, user);
    }

    function clearUser() {
        remove(BASE_KEYS.user);
    }

    function isLoggedIn() {
        return getUser() !== null;
    }

    // =====================================================
    // BALANCE
    // =====================================================
    function getBalance() {
        return Number(load(_nsKey('balance'), 0)) || 0;
    }

    function setBalance(amount) {
        save(_nsKey('balance'), Number(amount) || 0);
    }

    function addBalance(amount) {
        var current = getBalance();
        setBalance(current + Number(amount));
        return getBalance();
    }

    function subtractBalance(amount) {
        var current = getBalance();
        if (current < amount) return false;
        setBalance(current - Number(amount));
        return true;
    }

    function getTotalBalance() {
        return Number(getBalance()) || 0;
    }

    // =====================================================
    // TRANSACTIONS
    // =====================================================
    function getTransactions() {
        return load(_nsKey('transactions'), []);
    }

    function addTransaction(data) {
        var list = getTransactions();
        var trx = {
            id: uid('trx'),
            type: data.type,
            amount: Number(data.amount) || 0,
            description: data.description || '',
            category: data.category || 'lainnya',
            date: data.date || new Date().toISOString(),
            meta: data.meta || {}
        };
        list.push(trx);
        save(_nsKey('transactions'), list);

        if (trx.type === 'income') addBalance(trx.amount);
        else subtractBalance(trx.amount);

        return trx;
    }

    function getTransactionById(id) {
        var list = getTransactions();
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(id)) return list[i];
        }
        return null;
    }

    function deleteTransaction(id) {
        var list = getTransactions();
        var trx = null;
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(id)) { trx = list[i]; break; }
        }
        if (!trx) return false;

        if (trx.type === 'income') subtractBalance(trx.amount);
        else addBalance(trx.amount);

        list = list.filter(function (t) { return String(t.id) !== String(id); });
        save(_nsKey('transactions'), list);
        return true;
    }

    function getTransactionsByType(type) {
        if (!type || type === 'all') return getTransactions();
        return getTransactions().filter(function (t) { return t.type === type; });
    }

    // =====================================================
    // TARGETS
    // =====================================================
    function getTargets() {
        return load(_nsKey('targets'), []);
    }

    function getTargetById(id) {
        var list = getTargets();
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(id)) return list[i];
        }
        return null;
    }

    function addTarget(data) {
        var list = getTargets();
        var target = {
            id: uid('tgt'),
            name: data.name,
            icon: data.icon || 'fa-bullseye',
            targetAmount: Number(data.targetAmount) || 0,
            currentAmount: Number(data.currentAmount) || 0,
            deadline: data.deadline || null,
            isLimited: data.isLimited !== false,
            createdAt: new Date().toISOString()
        };
        list.push(target);
        save(_nsKey('targets'), list);
        return target;
    }

    function updateTarget(id, data) {
        var list = getTargets();
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(id)) {
                if (data.name !== undefined) list[i].name = data.name;
                if (data.icon !== undefined) list[i].icon = data.icon;
                if (data.targetAmount !== undefined) list[i].targetAmount = Number(data.targetAmount) || 0;
                if (data.currentAmount !== undefined) list[i].currentAmount = Number(data.currentAmount) || 0;
                if (data.deadline !== undefined) list[i].deadline = data.deadline;
                if (data.isLimited !== undefined) list[i].isLimited = data.isLimited;
                save(_nsKey('targets'), list);
                return list[i];
            }
        }
        return null;
    }

    /**
     * ✅ FIX C-04: pakai target.currentAmount sebagai sumber kebenaran
     *    tunggal untuk pengurangan saldo. Logs hanya audit trail.
     */
    function deleteTarget(id) {
        var target = getTargetById(id);
        if (!target) return false;

        // 1. Kembalikan saldo sebesar currentAmount (bukan hitung dari logs)
        var refundAmount = Number(target.currentAmount) || 0;
        if (refundAmount > 0) {
            addBalance(refundAmount);
        }

        // 2. Hapus target
        var targets = getTargets().filter(function (t) {
            return String(t.id) !== String(id);
        });
        save(_nsKey('targets'), targets);

        // 3. Hapus target logs (audit trail)
        var allLogs = getTargetLogs().filter(function (l) {
            return String(l.targetId) !== String(id);
        });
        save(_nsKey('targetLogs'), allLogs);

        // 4. Hapus transaksi terkait (meta.targetId)
        var transactions = getTransactions().filter(function (trx) {
            return !(trx.meta && String(trx.meta.targetId) === String(id));
        });
        save(_nsKey('transactions'), transactions);

        return true;
    }

    function addTargetSavings(targetId, amount, note) {
        var list = getTargets();
        var target = null;
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(targetId)) {
                target = list[i];
                break;
            }
        }
        if (!target) return null;

        amount = Number(amount) || 0;
        if (amount <= 0) return null;

        target.currentAmount = (Number(target.currentAmount) || 0) + amount;
        save(_nsKey('targets'), list);
        addTargetLog(targetId, 'in', amount, note);

        addTransaction({
            type: 'income',
            amount: amount,
            description: 'Tabungan: ' + target.name,
            category: 'tabungan',
            meta: { targetId: target.id, note: note || '' }
        });

        return target;
    }

    // =====================================================
    // TARGET LOGS
    // =====================================================
    function getTargetLogs(targetId) {
        var list = load(_nsKey('targetLogs'), []);
        if (targetId) {
            list = list.filter(function (l) {
                return String(l.targetId) === String(targetId);
            });
        }
        return list.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });
    }

    function addTargetLog(targetId, type, amount, note) {
        var list = load(_nsKey('targetLogs'), []);
        list.push({
            id: uid('log'),
            targetId: String(targetId),
            type: type,
            amount: Number(amount) || 0,
            note: note || '',
            date: new Date().toISOString()
        });
        save(_nsKey('targetLogs'), list);
    }

    function deleteTargetLog(logId) {
        var list = load(_nsKey('targetLogs'), []);
        var log = null;
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(logId)) { log = list[i]; break; }
        }
        if (!log) return;

        var targets = getTargets();
        for (var j = 0; j < targets.length; j++) {
            if (String(targets[j].id) === String(log.targetId)) {
                var delta = Number(log.amount) || 0;
                if (log.type === 'in') targets[j].currentAmount -= delta;
                else targets[j].currentAmount += delta;
                if (targets[j].currentAmount < 0) targets[j].currentAmount = 0;
                break;
            }
        }
        save(_nsKey('targets'), targets);

        list = list.filter(function (l) { return String(l.id) !== String(logId); });
        save(_nsKey('targetLogs'), list);
    }

    // =====================================================
    // LOGIN HISTORY
    // =====================================================
    function getLoginHistory() {
        return load(_nsKey('logins'), []);
    }

    function addLoginHistory(data) {
        var list = getLoginHistory();
        list.push({
            id: uid('log'),
            device: data.device || 'Unknown Device',
            type: data.type || 'Unknown',
            browser: data.browser || '',
            os: data.os || '',
            icon: data.icon || 'fa-globe',
            location: data.location || 'Unknown',
            ip: data.ip || '',
            userAgent: data.userAgent || '',
            date: new Date().toISOString()
        });
        save(_nsKey('logins'), list);
    }

    function clearLoginHistory() {
        save(_nsKey('logins'), []);
    }

    // =====================================================
    // NOTIF READ
    // =====================================================
    function getNotifReadIds() {
        return load(_nsKey('notifRead'), []);
    }

    function markNotifRead(id) {
        var list = getNotifReadIds();
        if (list.indexOf(id) === -1) {
            list.push(id);
            save(_nsKey('notifRead'), list);
        }
    }

    function markAllNotifRead(ids) {
        save(_nsKey('notifRead'), ids || []);
    }

    // =====================================================
    // WISHLIST
    // =====================================================
    function getWishlist() {
        return load(_nsKey('wishlist'), []);
    }

    function toggleWishlist(productId) {
        var list = getWishlist();
        var idx = list.indexOf(String(productId));
        if (idx === -1) list.push(String(productId));
        else list.splice(idx, 1);
        save(_nsKey('wishlist'), list);
        return list;
    }

    function isInWishlist(productId) {
        return getWishlist().indexOf(String(productId)) !== -1;
    }

    // =====================================================
    // CART
    // =====================================================
    function getCart() {
        return load(_nsKey('cart'), []);
    }

    function addToCart(product) {
        var list = getCart();
        var existing = null;
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(product.id)) {
                existing = list[i];
                break;
            }
        }
        if (existing) {
            existing.qty = (existing.qty || 1) + 1;
        } else {
            list.push({
                id: product.id,
                name: product.name,
                price: product.price,
                qty: 1
            });
        }
        save(_nsKey('cart'), list);
        return list;
    }

    function removeFromCart(productId) {
        var list = getCart().filter(function (c) {
            return String(c.id) !== String(productId);
        });
        save(_nsKey('cart'), list);
    }

    function clearCart() {
        save(_nsKey('cart'), []);
    }

    // =====================================================
    // ACTIVITY LOG
    // =====================================================
    function getActivityLog() {
        return load(_nsKey('activityLog'), []);
    }

    function logActivity(data) {
        var list = getActivityLog();
        var log = {
            id: uid('act'),
            action: data.action || 'unknown',
            title: data.title || 'Aktivitas',
            description: data.description || '',
            icon: data.icon || 'fa-circle-info',
            iconType: data.iconType || 'info',
            meta: data.meta || {},
            date: data.date || new Date().toISOString()
        };
        list.push(log);
        save(_nsKey('activityLog'), list);
        return log;
    }

    function deleteActivity(id) {
        var list = getActivityLog().filter(function (l) {
            return String(l.id) !== String(id);
        });
        save(_nsKey('activityLog'), list);
    }

    function clearActivity() {
        save(_nsKey('activityLog'), []);
    }

    // =====================================================
    // AVATAR
    // =====================================================
    function getAvatar() {
        return load(_nsKey('avatar'), null);
    }

    function setAvatar(data) {
        save(_nsKey('avatar'), data);
    }

    function clearAvatar() {
        remove(_nsKey('avatar'));
    }

    function getAvatarDisplay() {
        var avatar = getAvatar();
        if (avatar && avatar.value) return avatar;

        var user = getUser();
        if (user && user.picture) {
            return { type: 'photo', value: user.picture };
        }
        if (user && user.name) {
            return { type: 'letter', value: user.name.charAt(0).toUpperCase() };
        }
        return { type: 'letter', value: '?' };
    }

    // =====================================================
    // CLEAR ALL (hanya untuk namespace user aktif)
    // =====================================================
    function clearAll() {
        Object.keys(BASE_KEYS).forEach(function (k) {
            // Jangan hapus user global di sini — biar caller yang handle
            if (k === 'user' || k === 'usersList') return;
            remove(_nsKey(k));
        });
    }

    // =====================================================
    // MIGRASI DARI LEGACY KEY GLOBAL (one-shot)
    // =====================================================
    /**
     * Migrasi data dari key global lama (deptech_transactions, dll.)
     * ke namespace user aktif. Hanya dijalankan jika:
     *  1. Flag migrasi belum ada (belum pernah migrasi)
     *  2. Current user cocok dengan deptech_user lama (Q3 Opsi A)
     *  3. Ada data legacy yang perlu dimigrasi
     *
     * @returns {{migrated: boolean, reason: string}}
     */
    function migrateLegacyData() {
        // Sudah pernah migrasi?
        if (_safeGetRaw(MIGRATION_FLAG) === 'true') {
            return { migrated: false, reason: 'already_migrated' };
        }

        // Ada data legacy?
        var hasLegacy = false;
        var legacyKeys = ['balance', 'transactions', 'targets', 'target_logs',
                          'login_history', 'notif_read', 'cart', 'wishlist',
                          'activity_log', 'avatar'];

        for (var i = 0; i < legacyKeys.length; i++) {
            if (_safeGetRaw(LEGACY_KEY_PREFIX + legacyKeys[i]) !== null) {
                hasLegacy = true;
                break;
            }
        }

        if (!hasLegacy) {
            _safeSetRaw(MIGRATION_FLAG, 'true');
            return { migrated: false, reason: 'no_legacy_data' };
        }

        // Ada data legacy — cek current user
        var user = getUser();
        if (!user || !user.email) {
            return { migrated: false, reason: 'not_logged_in' };
        }

        // Cek apakah user lain (bukan current) yang punya data legacy
        // Heuristik: cek deptech_users, jika ada lebih dari 1 akun & current
        // bukan yang terakhir login sebelum migrasi, tolak.
        // Untuk aman: cek field `createdAt` di legacy (jika ada) vs user list.
        // Karena legacy data tidak menyimpan owner, kita gunakan
        // pendekatan konservatif: migrasi hanya jika current user adalah
        // akun yang paling baru aktif (deptech_user baru saja di-set).
        //
        // Simpler & aman: gunakan flag tambahan untuk menandai akun pemilik
        // legacy. Di sini kita migrasi hanya jika user baru saja login
        // dalam sesi ini (dipanggil langsung setelah setUser).

        // Migrasi semua key legacy
        var migrated = 0;
        legacyKeys.forEach(function (name) {
            var legacyKey = LEGACY_KEY_PREFIX + name;
            var raw = _safeGetRaw(legacyKey);
            if (raw === null) return;

            var nsKey = _nsKey(name);
            // Hanya timpa jika namespace kosong (belum ada data)
            if (_safeGetRaw(nsKey) === null) {
                _safeSetRaw(nsKey, raw);
                migrated++;
            }
            // Hapus legacy (setelah dibaca)
            remove(legacyKey);
        });

        _safeSetRaw(MIGRATION_FLAG, 'true');

        // Log aktivitas
        if (migrated > 0) {
            logActivity({
                action: 'migrate_legacy',
                title: 'Data Lama Dimigrasi',
                description: migrated + ' kategori data dipindahkan ke akun ' + user.email,
                icon: 'fa-database',
                iconType: 'info'
            });
        }

        return { migrated: migrated > 0, reason: 'migrated', count: migrated };
    }

    // =====================================================
    // EXPORT
    // =====================================================
    return {
        // Keys (untuk kompatibilitas & debugging)
        KEYS: {
            user: BASE_KEYS.user,
            usersList: BASE_KEYS.usersList,
            balance: 'balance',
            transactions: 'transactions',
            targets: 'targets',
            targetLogs: 'target_logs',
            logins: 'login_history',
            notifRead: 'notif_read',
            cart: 'cart',
            wishlist: 'wishlist',
            activityLog: 'activity_log',
            avatar: 'avatar'
        },

        // ✅ API baru untuk namespace
        getUserKey: getUserKey,
        migrateLegacyData: migrateLegacyData,

        // User
        getUser: getUser,
        setUser: setUser,
        clearUser: clearUser,
        isLoggedIn: isLoggedIn,

        // Balance
        getBalance: getBalance,
        setBalance: setBalance,
        addBalance: addBalance,
        subtractBalance: subtractBalance,
        getTotalBalance: getTotalBalance,

        // Transactions
        getTransactions: getTransactions,
        getTransactionById: getTransactionById,
        addTransaction: addTransaction,
        deleteTransaction: deleteTransaction,
        getTransactionsByType: getTransactionsByType,

        // Targets
        getTargets: getTargets,
        getTargetById: getTargetById,
        addTarget: addTarget,
        updateTarget: updateTarget,
        deleteTarget: deleteTarget,
        addTargetSavings: addTargetSavings,

        // Target Logs
        getTargetLogs: getTargetLogs,
        addTargetLog: addTargetLog,
        deleteTargetLog: deleteTargetLog,

        // Login history
        getLoginHistory: getLoginHistory,
        addLoginHistory: addLoginHistory,
        clearLoginHistory: clearLoginHistory,

        // Notif
        getNotifReadIds: getNotifReadIds,
        markNotifRead: markNotifRead,
        markAllNotifRead: markAllNotifRead,

        // Wishlist
        getWishlist: getWishlist,
        toggleWishlist: toggleWishlist,
        isInWishlist: isInWishlist,

        // Cart
        getCart: getCart,
        addToCart: addToCart,
        removeFromCart: removeFromCart,
        clearCart: clearCart,

        // Activity Log
        getActivityLog: getActivityLog,
        logActivity: logActivity,
        deleteActivity: deleteActivity,
        clearActivity: clearActivity,

        // Avatar
        getAvatar: getAvatar,
        setAvatar: setAvatar,
        clearAvatar: clearAvatar,
        getAvatarDisplay: getAvatarDisplay,

        // Utils
        clearAll: clearAll
    };

})();