/**
 * product-page.js - Katalog Produk DepTech
 * @version 1.1.0
 *
 * Changelog:
 *  - v1.1.0: Pakai ProductsAPI.filter & sort (bukan inline logic).
 *            Empty state informatif per kategori.
 *            Guard ProductsAPI tidak tersedia.
 *
 * Path: src/frontend/assets/js/product-page.js
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        var grid = document.getElementById('productGrid');
        if (!grid) return;

        // ============================================================
        // GUARD DEPENDENCY
        // ============================================================
        if (typeof window.ProductsAPI === 'undefined') {
            grid.innerHTML =
                '<div class="col-span-full text-center py-16 text-[var(--danger)]">' +
                '<i class="fa-solid fa-triangle-exclamation text-3xl mb-3 block"></i>' +
                '<p class="text-sm font-semibold">Katalog produk belum siap</p>' +
                '<p class="text-xs mt-2 text-[var(--text-muted)]">' +
                'ProductsAPI tidak ditemukan. Coba refresh halaman.</p>' +
                '</div>';
            return;
        }

        // ============================================================
        // STATE
        // ============================================================
        var allProducts = [];
        var currentCategory = 'all';
        var currentSort = 'relevan';
        var currentSearch = '';

        // ============================================================
        // LOADING
        // ============================================================
        grid.innerHTML =
            '<div class="col-span-full text-center py-[60px] text-[var(--text-muted)]">' +
            '<div class="loading-spinner mx-auto"></div>' +
            '<p class="mt-3 text-[11px]">Memuat produk...</p>' +
            '</div>';

        // ============================================================
        // FETCH
        // ============================================================
        ProductsAPI.getAll()
            .then(function(products) {
                allProducts = products || [];
                renderProducts();
            })
            .catch(function(error) {
                console.error('[ProductPage] Failed:', error);
                grid.innerHTML =
                    '<div class="col-span-full text-center py-[60px] text-[var(--danger)]">' +
                    '<i class="fa-solid fa-triangle-exclamation text-3xl mb-3 block"></i>' +
                    '<strong class="block text-sm">Gagal memuat produk</strong>' +
                    '<p class="text-xs mt-2 text-[var(--text-muted)]">' +
                    escapeHtml(error.message || '') + '</p>' +
                    '<button onclick="location.reload()" ' +
                    'class="mt-3 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold">' +
                    'Coba Lagi</button>' +
                    '</div>';
            });

        // ============================================================
        // RENDER
        // ============================================================
        function renderProducts() {
            var filtered = ProductsAPI.filter(allProducts, {
                category: currentCategory,
                q: currentSearch
            });
            filtered = ProductsAPI.sort(filtered, currentSort);

            updateCount(filtered.length);

            if (filtered.length === 0) {
                renderEmptyState();
                return;
            }

            var html = '';
            filtered.forEach(function(p) {
                html += renderCard(p);
            });
            grid.innerHTML = html;

            grid.querySelectorAll('.product-card').forEach(function(card) {
                card.addEventListener('click', function(e) {
                    if (e.target.closest('.wishlist')) return;
                    var id = this.dataset.id;
                    window.location.href = 'detail.html?id=' + encodeURIComponent(id);
                });
            });
        }

        function renderEmptyState() {
            var msg, sub;
            if (currentSearch) {
                msg = 'Tidak ada produk untuk "' + currentSearch + '"';
                sub = 'Coba kata pencarian lain atau hapus filter.';
            } else if (currentCategory !== 'all') {
                msg = 'Kategori "' + currentCategory + '" belum tersedia';
                sub = 'Pilih kategori lain atau lihat semua produk.';
            } else {
                msg = 'Belum ada produk';
                sub = 'Produk akan muncul di sini.';
            }

            grid.innerHTML =
                '<div class="col-span-full text-center py-[60px] text-[var(--text-muted)]">' +
                '<i class="fa-regular fa-folder-open text-[32px] block mb-3"></i>' +
                '<strong class="block text-[13px] text-[var(--text-secondary)]">' +
                escapeHtml(msg) + '</strong>' +
                '<span class="text-[10px]">' + escapeHtml(sub) + '</span>' +
                '</div>';
        }

        // ============================================================
        // RENDER CARD
        // ============================================================
        function renderCard(p) {
            var priceFormatted = 'Rp' + Number(p.price).toLocaleString('id-ID');
            var isOutOfStock = p.stock < 1;

            var badgeHtml = '';
            if (isOutOfStock) {
                badgeHtml = '<span class="badge-sale" style="background:linear-gradient(135deg,#ef4444,#dc2626);">Habis</span>';
            } else if (p.stock < 5) {
                badgeHtml = '<span class="badge-sale" style="background:linear-gradient(135deg,#f59e0b,#d97706);">Stok Terbatas</span>';
            }

            var imageHtml = p.image
                ? '<img src="' + escapeAttr(p.image) + '" alt="' + escapeAttr(p.name) + '" ' +
                  'class="product-img" ' +
                  'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
                : '';
            var iconStyle = p.image ? 'display:none;' : 'display:flex;';

            return '<div class="product-card" ' +
                'data-id="' + escapeAttr(p.id) + '" ' +
                'data-category="' + escapeAttr(p.category) + '" ' +
                'data-price="' + p.price + '" ' +
                'data-name="' + escapeAttr(p.name) + '">' +
                '<div class="card-image">' +
                imageHtml +
                '<i class="fa-solid fa-box product-icon-fallback" style="' + iconStyle + '"></i>' +
                badgeHtml +
                '<button class="wishlist" onclick="event.stopPropagation();toggleWishlist(this)" ' +
                'aria-label="Tambah ke wishlist">' +
                '<i class="fa-regular fa-heart"></i>' +
                '</button>' +
                '</div>' +
                '<div class="p-[10px_12px_12px]">' +
                '<div class="product-name">' + escapeHtml(p.name) + '</div>' +
                '<div class="text-[8px] text-[var(--text-secondary)] mb-1">' +
                escapeHtml(p.category) + '</div>' +
                '<div class="text-[14px] font-extrabold text-[var(--danger)]">' +
                priceFormatted + '</div>' +
                '<div class="text-[8px] text-[var(--text-muted)] mt-0.5">Stok: ' + p.stock + '</div>' +
                '<div class="text-[8px] text-[var(--text-secondary)] mt-0.5">' +
                '<i class="fa-regular fa-store text-[7px] text-[var(--accent)] mr-0.5"></i> DepTech Official' +
                '</div>' +
                '</div>' +
                '</div>';
        }

        // ============================================================
        // HELPERS
        // ============================================================
        function updateCount(n) {
            var el = document.getElementById('totalCount');
            if (el) el.textContent = n;
        }

        function escapeHtml(s) {
            if (s == null) return '';
            var div = document.createElement('div');
            div.textContent = String(s);
            return div.innerHTML;
        }

        function escapeAttr(s) {
            return String(s == null ? '' : s)
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // ============================================================
        // HANDLERS
        // ============================================================
        window.filterCategory = function(el, category) {
            document.querySelectorAll('#categoryTabs button').forEach(function(b) {
                b.classList.remove('tab-active', 'bg-[var(--accent)]', 'text-white');
            });
            if (el) el.classList.add('tab-active', 'bg-[var(--accent)]', 'text-white');
            currentCategory = category;
            renderProducts();
        };

        window.sortProducts = function(el, sort) {
            document.querySelectorAll('#sortOptions button').forEach(function(b) {
                b.classList.remove('sort-active', 'bg-[var(--accent-soft)]', 'text-[var(--accent)]');
            });
            if (el) el.classList.add('sort-active', 'bg-[var(--accent-soft)]', 'text-[var(--accent)]');
            currentSort = sort;
            renderProducts();
        };

        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
            var debounceTimer;
            searchInput.addEventListener('input', function() {
                var val = this.value;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                    currentSearch = val;
                    renderProducts();
                }, 200);
            });
        }

        window.toggleWishlist = function(btn) {
            var icon = btn.querySelector('i');
            var isLiked = icon.classList.contains('fa-solid');
            var card = btn.closest('.product-card');
            var productId = card ? card.dataset.id : null;

            if (isLiked) {
                icon.className = 'fa-regular fa-heart';
                btn.classList.remove('liked');
                if (productId && window.DeptechStore && typeof DeptechStore.toggleWishlist === 'function') {
                    DeptechStore.toggleWishlist(productId);
                }
                if (typeof showToast === 'function') showToast('Dihapus dari wishlist');
            } else {
                icon.className = 'fa-solid fa-heart';
                btn.classList.add('liked');
                if (productId && window.DeptechStore && typeof DeptechStore.toggleWishlist === 'function') {
                    DeptechStore.toggleWishlist(productId);
                }
                if (typeof showToast === 'function') showToast('Ditambahkan ke wishlist');
            }
        };

        // Init
        var activeTab = document.querySelector('#categoryTabs .tab-active');
        if (activeTab) activeTab.classList.add('bg-[var(--accent)]', 'text-white');
        var activeSort = document.querySelector('#sortOptions .sort-active');
        if (activeSort) activeSort.classList.add('bg-[var(--accent-soft)]', 'text-[var(--accent)]');
    });
})();