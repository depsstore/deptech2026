/* =====================================================
   DEPTECH - WEB NOTIFICATION
   Notifikasi ke system tray device (tanpa emoji)
===================================================== */

var DeviceNotif = (function() {
    'use strict';

    var KEY_PERMISSION = 'deptech_notif_permission';

    // =====================================================
    // CEK SUPPORT
    // =====================================================
    function isSupported() {
        return 'Notification' in window;
    }

    // =====================================================
    // CEK STATUS IZIN
    // =====================================================
    function getPermission() {
        if (!isSupported()) return 'unsupported';
        return Notification.permission;
    }

    // =====================================================
    // MINTA IZIN
    // =====================================================
    function requestPermission() {
        if (!isSupported()) {
            console.warn('[DeviceNotif] Browser tidak support Notification API');
            return Promise.resolve('unsupported');
        }

        if (Notification.permission === 'granted') {
            return Promise.resolve('granted');
        }

        if (Notification.permission === 'denied') {
            console.warn('[DeviceNotif] User pernah menolak izin notifikasi');
            return Promise.resolve('denied');
        }

        return Notification.requestPermission().then(function(result) {
            localStorage.setItem(KEY_PERMISSION, result);
            console.log('[DeviceNotif] Permission:', result);
            return result;
        });
    }

    // =====================================================
    // TAMPILKAN NOTIFIKASI
    // =====================================================
    function show(title, options) {
        if (!isSupported()) return null;
        if (Notification.permission !== 'granted') {
            console.warn('[DeviceNotif] Izin belum diberikan');
            return null;
        }

        var opts = {
            body: options && options.body ? options.body : '',
            icon: '/src/frontend/assets/img/brandnolatar.png',
            badge: '/src/frontend/assets/img/brandnolatar.png',
            tag: options && options.tag ? options.tag : 'deptech-notif',
            requireInteraction: false,
            silent: false
        };

        if (options && options.url) opts.url = options.url;

        try {
            var notif = new Notification(title, opts);

            notif.onclick = function() {
                window.focus();
                if (opts.url) {
                    window.location.href = opts.url;
                }
                notif.close();
            };

            setTimeout(function() {
                notif.close();
            }, 8000);

            return notif;
        } catch (e) {
            console.error('[DeviceNotif] Error:', e);
            return null;
        }
    }

    // =====================================================
    // NOTIFIKASI: TARGET
    // =====================================================
    function notifyTarget(target, type) {
        if (!target) return;

        var progress = target.targetAmount > 0 ?
            Math.round((target.currentAmount / target.targetAmount) * 100) : 0;

        if (type === 'created') {
            show('Target Baru Dibuat', {
                body: '"' + target.name + '" — Rp' + Number(target.targetAmount).toLocaleString('id-ID'),
                tag: 'target-created-' + target.id,
                url: '/src/frontend/pages/goals/detail.html?id=' + target.id
            });

        } else if (type === 'progress' && progress >= 50 && progress < 100) {
            show('Target Setengah Jalan', {
                body: '"' + target.name + '" sudah ' + progress + '% tercapai',
                tag: 'target-half-' + target.id,
                url: '/src/frontend/pages/goals/detail.html?id=' + target.id
            });

        } else if (type === 'done' && progress >= 100) {
            show('Target Tercapai', {
                body: '"' + target.name + '" sudah 100%',
                tag: 'target-done-' + target.id,
                url: '/src/frontend/pages/goals/detail.html?id=' + target.id
            });

        } else if (type === 'savings') {
            show('Tabungan Ditambah', {
                body: '"' + target.name + '" — Rp' + Number(target.currentAmount).toLocaleString('id-ID'),
                tag: 'target-savings-' + target.id,
                url: '/src/frontend/pages/goals/detail.html?id=' + target.id
            });
        }
    }

    // =====================================================
    // NOTIFIKASI: TRANSAKSI
    // =====================================================
    function notifyTransaction(trx) {
        if (!trx) return;

        var isIncome = trx.type === 'income';
        var title = isIncome ? 'Uang Masuk' : 'Pembayaran';

        show(title, {
            body: (trx.description || 'Transaksi') + ' — Rp' + Number(trx.amount).toLocaleString('id-ID'),
            tag: 'trx-' + trx.id
        });
    }

    // =====================================================
    // EXPORT
    // =====================================================
    return {
        isSupported: isSupported,
        getPermission: getPermission,
        requestPermission: requestPermission,
        show: show,
        notifyTarget: notifyTarget,
        notifyTransaction: notifyTransaction
    };

})();