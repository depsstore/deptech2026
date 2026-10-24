/* =====================================================
   DEPTECH - NOTIFIKASI
   Generate notifikasi dari data aplikasi (tanpa dummy)
===================================================== */

var NotifStore = (function() {
    'use strict';

    // =====================================================
    // GENERATE NOTIF DARI BERBAGAI SUMBER
    // =====================================================

    function fromTransactions() {
        return DeptechStore.getTransactions().map(function(t) {
            var isIncome = t.type === 'income';
            var isTabungan = t.category === 'tabungan';
            var isBelanja = t.category === 'belanja';
            var isTopup = t.category === 'topup';
            var isTransfer = t.category === 'transfer';

            var icon = 'fa-receipt';
            var iconType = isIncome ? 'income' : 'expense';
            var title = isIncome ? 'Uang Masuk' : 'Pembayaran Berhasil';

            if (isTopup) {
                icon = 'fa-arrow-down';
                title = 'Top Up Berhasil';
            } else if (isTabungan) {
                icon = 'fa-piggy-bank';
                iconType = 'promo';
                title = 'Tabungan Ditambah';
            } else if (isTransfer) {
                icon = 'fa-paper-plane';
                title = 'Transfer Berhasil';
            } else if (isBelanja) {
                icon = 'fa-cart-shopping';
                title = 'Pembelian Berhasil';
            }

            return {
                id: 'trx_' + t.id,
                icon: icon,
                iconType: iconType,
                title: title,
                message: (t.description || 'Transaksi') + ' — Rp' + Number(t.amount).toLocaleString('id-ID'),
                date: t.date,
                timestamp: new Date(t.date).getTime(),
                unread: true
            };
        });
    }

    function fromTargets() {
        var notifs = [];
        DeptechStore.getTargets().forEach(function(tg) {
            var progress = tg.targetAmount > 0 ?
                Math.round((tg.currentAmount / tg.targetAmount) * 100) : 0;

            if (progress >= 100 && tg.isLimited) {
                notifs.push({
                    id: 'target_done_' + tg.id,
                    icon: 'fa-bullseye',
                    iconType: 'promo',
                    title: 'Target Tercapai!',
                    message: 'Target "' + tg.name + '" sudah tercapai 100%.',
                    date: tg.createdAt,
                    timestamp: new Date(tg.createdAt).getTime(),
                    unread: true
                });
            } else if (progress >= 50) {
                notifs.push({
                    id: 'target_half_' + tg.id,
                    icon: 'fa-chart-line',
                    iconType: 'promo',
                    title: 'Setengah Jalan',
                    message: 'Target "' + tg.name + '" sudah ' + progress + '% tercapai.',
                    date: tg.createdAt,
                    timestamp: new Date(tg.createdAt).getTime(),
                    unread: true
                });
            }
        });
        return notifs;
    }

    function fromLogins() {
        return DeptechStore.getLoginHistory().map(function(l) {
            return {
                id: 'login_' + l.id,
                icon: 'fa-shield-halved',
                iconType: 'security',
                title: 'Login Baru Terdeteksi',
                message: 'Login dari ' + l.device + ' di ' + l.location + '.',
                date: l.date,
                timestamp: new Date(l.date).getTime(),
                unread: true
            };
        });
    }

    // function fromTargetLogs() {
    //     var notifs = [];
    //     DeptechStore.getTargetLogs().forEach(function(log) {
    //         var target = DeptechStore.getTargetById(log.targetId);
    //         if (!target) return;

    //         var isIn = log.type === 'in';
    //         notifs.push({
    //             id: 'tlog_' + log.id,
    //             icon: isIn ? 'fa-plus' : 'fa-minus',
    //             iconType: isIn ? 'income' : 'expense',
    //             title: isIn ? 'Tabungan Ditambah' : 'Tabungan Dikurangi',
    //             message: 'Rp' + log.amount.toLocaleString('id-ID') + ' untuk "' + target.name + '".' +
    //                 (log.note ? ' ' + log.note : ''),
    //             date: log.date,
    //             timestamp: new Date(log.date).getTime(),
    //             unread: true
    //         });
    //     });
    //     return notifs;
    // }

    // =====================================================
    // GABUNG & SORT
    // =====================================================

    function generateAll() {
        var all = []
            .concat(fromTransactions())
            .concat(fromTargets())
            .concat(fromLogins())

        all.sort(function(a, b) {
            return (b.timestamp || 0) - (a.timestamp || 0);
        });

        var readIds = DeptechStore.getNotifReadIds();
        all.forEach(function(n) {
            if (readIds.indexOf(n.id) !== -1) n.unread = false;
        });

        return all;
    }

    function countUnread() {
        return generateAll().filter(function(n) { return n.unread; }).length;
    }

    function markAsRead(id) {
        DeptechStore.markNotifRead(id);
    }

    function markAllAsRead() {
        var ids = generateAll().map(function(n) { return n.id; });
        DeptechStore.markAllNotifRead(ids);
    }

    // =====================================================
    // FORMAT RELATIVE DATE
    // =====================================================

        // =====================================================
    // FORMAT RELATIVE DATE (delegasi ke SharedHelpers)
    // =====================================================
    function formatRelative(dateStr) {
        if (window.SharedHelpers && typeof SharedHelpers.formatRelative === 'function') {
            return SharedHelpers.formatRelative(dateStr);
        }
        // Fallback jika SharedHelpers belum di-load
        if (!dateStr) return '';
        var date = new Date(dateStr);
        var now = new Date();
        var diffMs = now - date;
        var diffMin = Math.floor(diffMs / 60000);
        var diffHour = Math.floor(diffMs / 3600000);
        var diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Baru saja';
        if (diffMin < 60) return diffMin + ' menit lalu';
        if (diffHour < 24) return diffHour + ' jam lalu';
        if (diffDay < 7) return diffDay + ' hari lalu';

        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    return {
        generateAll: generateAll,
        countUnread: countUnread,
        markAsRead: markAsRead,
        markAllAsRead: markAllAsRead,
        formatRelative: formatRelative
    };

})();