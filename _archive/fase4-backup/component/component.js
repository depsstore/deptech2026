/**
 * component.js - Component Renderer
 * @version 1.0.0
 * 
 * Fungsi: Render komponen HTML dari data produk
 * Path: src/backend/javascript/component/component.js
 */

(function() {
    'use strict';

    // ============================================================
    // ESCAPE HTML
    // ============================================================
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================================
    // RENDER PRODUCT CARD
    // ============================================================
    function renderProductCard(p) {
        if (!p) return '';

        var priceFormatted = 'Rp' + p.price.toLocaleString('id-ID');
        var isOutOfStock = p.stock < 1;

        var badgeHtml = '';
        if (isOutOfStock) {
            badgeHtml = '<span class="badge-sale" style="background:linear-gradient(135deg,#ef4444,#dc2626);">Habis</span>';
        } else if (p.product_type === 'auto_account') {
            badgeHtml = '<span class="badge-sale" style="background:linear-gradient(135deg,#f59e0b,#d97706);">Premium Instan</span>';
        } else if (p.stock < 5) {
            badgeHtml = '<span class="badge-sale" style="background:linear-gradient(135deg,#f59e0b,#d97706);">Stok Terbatas</span>';
        }

        var imageHtml = p.image
            ? '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.name) + '" class="product-img" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
            : '';
        var iconStyle = p.image ? 'display:none;' : 'display:flex;';

        return '<div class="product-card" ' +
            'data-id="' + escapeHtml(p.id) + '" ' +
            'data-category="' + escapeHtml(p.category) + '" ' +
            'data-price="' + p.price + '" ' +
            'data-name="' + escapeHtml(p.name) + '">' +
            '<div class="card-image">' +
            imageHtml +
            '<i class="fa-solid fa-box product-icon-fallback" style="' + iconStyle + '"></i>' +
            badgeHtml +
            '<button class="wishlist" onclick="event.stopPropagation();toggleWishlist(this)">' +
            '<i class="fa-regular fa-heart"></i>' +
            '</button>' +
            '</div>' +
            '<div class="p-[10px_12px_12px]">' +
            '<div class="product-name">' + escapeHtml(p.name) + '</div>' +
            '<div class="text-[8px] text-[#4b6a8b] mb-1">' + escapeHtml(p.category) + '</div>' +
            '<div class="text-[14px] font-extrabold text-[#dc2626]">' + priceFormatted + '</div>' +
            '<div class="text-[8px] text-[#4b6a8b] mt-0.5">' +
            '<i class="fa-regular fa-store text-[7px] text-[#2563eb] mr-0.5"></i> DepTech Official' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    // ============================================================
    // RENDER PRODUCT GRID
    // ============================================================
    function renderProductGrid(products) {
        if (!products || products.length === 0) {
            return '<div class="col-span-full text-center py-[60px] text-[#6b8bb0]">' +
                '<i class="fa-regular fa-folder-open text-[32px] block mb-3"></i>' +
                '<strong class="block text-[13px] text-[#4b6a8b]">Belum ada produk</strong>' +
                '<span class="text-[9px]">Produk akan muncul di sini.</span>' +
                '</div>';
        }

        var html = '';
        products.forEach(function(p) {
            html += renderProductCard(p);
        });
        return html;
    }

    // ============================================================
    // RENDER LOADING
    // ============================================================
    function renderLoading() {
        return '<div class="col-span-full text-center py-[60px] text-[#6b8bb0]">' +
            '<div class="loading-spinner mx-auto"></div>' +
            '<p class="mt-3 text-[11px]">Memuat produk...</p>' +
            '</div>';
    }

    // ============================================================
    // RENDER ERROR
    // ============================================================
    function renderError(message) {
        return '<div class="col-span-full text-center py-[60px] text-[#dc2626]">' +
            '<i class="fa-solid fa-triangle-exclamation text-[32px] block mb-3"></i>' +
            '<strong class="block text-[13px]">Gagal memuat produk</strong>' +
            '<span class="text-[9px] text-[#6b8bb0]">' + escapeHtml(message || '') + '</span>' +
            '<button onclick="location.reload()" class="mt-3 px-4 py-2 bg-[#eff6ff] text-[#2563eb] rounded-lg text-[10px]">' +
            'Coba Lagi' +
            '</button>' +
            '</div>';
    }

    // ============================================================
    // EXPOSE
    // ============================================================
    window.ComponentAPI = {
        productCard: renderProductCard,
        productGrid: renderProductGrid,
        loading: renderLoading,
        error: renderError,
        escape: escapeHtml
    };

    console.log('[ComponentAPI] Loaded');

})();