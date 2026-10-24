/**
 * shared-helpers.js - Utility terpusat untuk DepTech
 * @version 1.0.0
 *
 * Changelog:
 *   - v1.0.0: Ekstraksi helper yang sebelumnya terduplikasi di
 *             activities/index.html, notifikasi.js, product-page.js.
 *
 * Path: src/frontend/assets/js/shared-helpers.js
 *
 * Cara pakai:
 *   <script src=".../shared-helpers.js"></script>
 *   SharedHelpers.getIcon(category)
 *   SharedHelpers.getCategoryLabel(category)
 *   SharedHelpers.formatRelative(dateString)
 *   SharedHelpers.formatCurrency(amount)
 *   SharedHelpers.formatDate(dateString)
 *   SharedHelpers.escapeHtml(text)
 *   SharedHelpers.escapeAttr(text)
 */

(function () {
    'use strict';

    // =====================================================
    // ICON MAPPER — kategori transaksi
    // =====================================================
    var ICON_MAP = {
        topup:    'fa-arrow-down',
        transfer: 'fa-paper-plane',
        tabungan: 'fa-piggy-bank',
        belanja:  'fa-cart-shopping',
        qris:     'fa-qrcode',
        pulsa:    'fa-mobile-screen-button',
        data:     'fa-wifi',
        game:     'fa-gamepad',
        voucher:  'fa-ticket',
        tarik:    'fa-money-bill-transfer',
        lainnya:  'fa-receipt'
    };

    // =====================================================
    // LABEL MAPPER — kategori transaksi
    // =====================================================
    var LABEL_MAP = {
        topup:    'Top Up',
        transfer: 'Transfer',
        tabungan: 'Tabungan',
        belanja:  'Belanja',
        qris:     'QRIS',
        pulsa:    'Pulsa',
        data:     'Paket Data',
        game:     'Game',
        voucher:  'Voucher',
        tarik:    'Tarik Saldo',
        lainnya:  'Lainnya'
    };

    // =====================================================
    // GET ICON
    // =====================================================
    function getIcon(category, fallback) {
        if (category && ICON_MAP[category]) return ICON_MAP[category];
        return fallback || 'fa-receipt';
    }

    function getIconForTransaction(trx) {
        if (!trx) return 'fa-receipt';
        if (trx.category && ICON_MAP[trx.category]) return ICON_MAP[trx.category];
        return trx.type === 'income' ? 'fa-arrow-down' : 'fa-cart-shopping';
    }

    // =====================================================
    // GET LABEL
    // =====================================================
    function getCategoryLabel(category) {
        if (!category) return 'Lainnya';
        return LABEL_MAP[category] || category;
    }

    // =====================================================
    // FORMAT CURRENCY
    // =====================================================
    function formatCurrency(amount) {
        return 'Rp' + Number(amount || 0).toLocaleString('id-ID');
    }

    function formatCurrencyShort(amount) {
        amount = Number(amount) || 0;
        if (amount >= 1000000000) return 'Rp' + (amount / 1000000000).toFixed(1) + 'M';
        if (amount >= 1000000)    return 'Rp' + (amount / 1000000).toFixed(1) + 'Jt';
        if (amount >= 1000)       return 'Rp' + (amount / 1000).toFixed(0) + 'K';
        return 'Rp' + amount.toLocaleString('id-ID');
    }

    // =====================================================
    // FORMAT RELATIVE DATE
    // =====================================================
    function formatRelative(dateStr) {
        if (!dateStr) return '';
        var date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';

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

    // =====================================================
    // FORMAT DATE
    // =====================================================
    function formatDate(dateStr) {
        if (!dateStr) return '';
        var date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return '';
        var date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // =====================================================
    // DATE LABEL (Hari ini / Kemarin / tanggal)
    // =====================================================
    function labelTanggal(dateStr) {
        var date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';

        var today = new Date();
        var yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        var y = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (d.getTime() === t.getTime()) return 'Hari ini';
        if (d.getTime() === y.getTime()) return 'Kemarin';

        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // =====================================================
    // ESCAPE HTML
    // =====================================================
    function escapeHtml(text) {
        if (text == null) return '';
        var div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    function escapeAttr(text) {
        return String(text == null ? '' : text)
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // =====================================================
    // PARSE RUPIAH
    // =====================================================
    function parseRupiah(val) {
        return parseInt(String(val).replace(/[^\d]/g, ''), 10) || 0;
    }

    // =====================================================
    // DEBOUNCE
    // =====================================================
    function debounce(func, wait) {
        var timeout;
        return function executedFunction() {
            var context = this;
            var args = arguments;
            var later = function () {
                clearTimeout(timeout);
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // =====================================================
    // EXPORT
    // =====================================================
    window.SharedHelpers = {
        // Icon & label
        getIcon: getIcon,
        getIconForTransaction: getIconForTransaction,
        getCategoryLabel: getCategoryLabel,

        // Currency
        formatCurrency: formatCurrency,
        formatCurrencyShort: formatCurrencyShort,

        // Date
        formatRelative: formatRelative,
        formatDate: formatDate,
        formatDateTime: formatDateTime,
        labelTanggal: labelTanggal,

        // Escape
        escapeHtml: escapeHtml,
        escapeAttr: escapeAttr,

        // Parse
        parseRupiah: parseRupiah,

        // Utility
        debounce: debounce
    };

    console.log('[SharedHelpers v1.0] Loaded');
})();