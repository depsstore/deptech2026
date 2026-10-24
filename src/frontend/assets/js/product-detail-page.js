/**
 * product-detail-page.js - Detail Produk DepTech
 * @version 1.1.0
 *
 * Changelog:
 *  - v1.1.0: Fix infinite recursion (rename showError → showPageError)
 *            Tambah retry button saat API gagal
 *            Guard ProductsAPI tidak tersedia
 *
 * Path: src/frontend/assets/js/product-detail-page.js
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        var slider = document.getElementById('productSlider');
        if (!slider) return;

        // ============================================================
        // GUARD DEPENDENCY
        // ============================================================
        if (typeof window.ProductsAPI === 'undefined' ||
            typeof window.ProductsAPI.getAll !== 'function') {
            console.error('[ProductDetail] ProductsAPI tidak tersedia');
            showPageError('Katalog produk belum siap. Coba refresh halaman.');
            return;
        }

        // ============================================================
        // AMBIL ID DARI URL
        // ============================================================
        var params = new URLSearchParams(window.location.search);
        var productId = params.get('id');

        if (!productId) {
            showNotFound();
            return;
        }

        // ============================================================
        // LOADING STATE + FETCH
        // ============================================================
        showLoading();

        ProductsAPI.getAll()
            .then(function(products) {
                var product = null;
                for (var i = 0; i < products.length; i++) {
                    if (String(products[i].id) === String(productId)) {
                        product = products[i];
                        break;
                    }
                }

                if (!product) {
                    showNotFound();
                    return;
                }

                renderProduct(product);
                renderRecommendations(products, productId);
                setupSlider();
                setupVariants();
                setupDescription(product);

                window.currentProduct = product;
            })
            .catch(function(error) {
                console.error('[ProductDetail] Failed:', error);
                showPageError(error && error.message
                    ? error.message
                    : 'Gagal memuat produk. Periksa koneksi internet Anda.');
            });

        // ============================================================
        // RENDER PRODUK
        // ============================================================
        function renderProduct(product) {
            var nameEl = document.getElementById('productName');
            if (nameEl) nameEl.textContent = product.name;

            var tagEl = document.getElementById('productTag');
            if (tagEl) {
                var tags = ['Produk Unggulan', 'Best Seller', 'Terbaru', 'Premium'];
                // Deterministik (tidak random per reload)
                var seed = 0;
                var pid = String(product.id || '');
                for (var k = 0; k < pid.length; k++) seed += pid.charCodeAt(k);
                tagEl.textContent = tags[seed % tags.length];
            }

            var priceEl = document.getElementById('productPrice');
            if (priceEl) {
                priceEl.innerHTML = 'Rp' + Number(product.price).toLocaleString('id-ID');
            }

            var originalEl = document.getElementById('originalPrice');
            if (originalEl) {
                var originalPrice = Math.round(Number(product.price) * 1.2);
                if (product.originalPrice && product.originalPrice > product.price) {
                    originalEl.textContent = 'Rp' + Number(product.originalPrice).toLocaleString('id-ID');
                    originalEl.style.display = 'inline';
                } else if (originalPrice > product.price) {
                    originalEl.textContent = 'Rp' + originalPrice.toLocaleString('id-ID');
                    originalEl.style.display = 'inline';
                } else {
                    originalEl.style.display = 'none';
                }
            }

            var ratingEl = document.getElementById('productRating');
            if (ratingEl) {
                ratingEl.innerHTML =
                    '<span class="stars">' +
                    '<i class="fa-solid fa-star"></i>' +
                    '<i class="fa-solid fa-star"></i>' +
                    '<i class="fa-solid fa-star"></i>' +
                    '<i class="fa-solid fa-star"></i>' +
                    '<i class="fa-regular fa-star"></i>' +
                    '</span>' +
                    '<span>' + (product.rating || 4.5) + ' (Belum ada penilaian)</span>' +
                    '<span class="divider"></span>' +
                    '<span>Stok: ' + (product.stock || 0) + '</span>';
            }

            var slides = document.querySelectorAll('.slide .product-icon');
            if (slides.length > 0) {
                slides.forEach(function(el) {
                    el.className = 'fa-solid fa-box product-icon';
                });

                if (product.image) {
                    var firstSlide = document.querySelector('.slide[data-slide="0"] .detail-image-container');
                    if (firstSlide) {
                        firstSlide.innerHTML = '<img src="' + escapeAttr(product.image) + '" ' +
                            'alt="' + escapeAttr(product.name) + '" ' +
                            'class="w-full h-full object-contain p-4" ' +
                            'onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<i class=&quot;fa-solid fa-box product-icon&quot;></i>\'">';
                    }
                }
            }
        }

        // ============================================================
        // REKOMENDASI
        // ============================================================
        function renderRecommendations(products, currentId) {
            var recGrid = document.getElementById('recGrid');
            if (!recGrid) return;

            var others = products.filter(function(p) {
                return String(p.id) !== String(currentId) && p.status === 'active';
            });

            // Deterministik: ambil 4 pertama (bukan random, biar stabil antar reload)
            var recs = others.slice(0, 4);

            if (recs.length === 0) {
                recGrid.innerHTML = '<div class="col-span-full text-center py-10 text-[var(--text-muted)] text-sm">Tidak ada produk lain</div>';
                return;
            }

            var html = '';
            var icons = ['fa-box', 'fa-cube', 'fa-gift', 'fa-star'];

            recs.forEach(function(p, index) {
                var price = 'Rp ' + Number(p.price || 0).toLocaleString('id-ID');
                var iconClass = icons[index % icons.length];
                var imageUrl = p.image || '';

                html += '<div class="rec-item" onclick="window.location.href=\'detail.html?id=' + encodeURIComponent(p.id) + '\'">' +
                    '<div class="rec-img">' +
                    (imageUrl
                        ? '<img src="' + escapeAttr(imageUrl) + '" alt="' + escapeAttr(p.name) + '" class="w-full h-full object-cover" ' +
                          'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
                          '<i class="fa-solid ' + iconClass + '" style="display:none;"></i>'
                        : '<i class="fa-solid ' + iconClass + '"></i>') +
                    '</div>' +
                    '<div class="rec-body">' +
                    '<div class="rec-name">' + escapeHtml(p.name) + '</div>' +
                    '<div class="rec-price">' + price + '</div>' +
                    '<div class="rec-sold">Stok: ' + (p.stock || 0) + '</div>' +
                    '</div>' +
                    '</div>';
            });

            recGrid.innerHTML = html;
        }

        // ============================================================
        // SLIDER
        // ============================================================
        function setupSlider() {
            var currentSlide = 0;
            var totalSlides = document.querySelectorAll('.slide').length;
            var sliderContainer = document.getElementById('sliderContainer');
            var dots = document.querySelectorAll('.dot');
            if (totalSlides === 0) return;

            function goToSlide(index) {
                if (index < 0) index = totalSlides - 1;
                if (index >= totalSlides) index = 0;
                currentSlide = index;
                if (sliderContainer) {
                    sliderContainer.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
                }
                dots.forEach(function(dot, i) {
                    dot.classList.toggle('active', i === currentSlide);
                });
            }

            var prevBtn = document.getElementById('prevSlide');
            if (prevBtn) prevBtn.addEventListener('click', function() { goToSlide(currentSlide - 1); });

            var nextBtn = document.getElementById('nextSlide');
            if (nextBtn) nextBtn.addEventListener('click', function() { goToSlide(currentSlide + 1); });

            dots.forEach(function(dot) {
                dot.addEventListener('click', function() {
                    goToSlide(parseInt(this.dataset.index, 10) || 0);
                });
            });
        }

        // ============================================================
        // VARIAN
        // ============================================================
        function setupVariants() {
            window.selectVariant = function(element) {
                var parent = element.closest('.variant-options');
                if (!parent) return;
                parent.querySelectorAll('.option').forEach(function(o) {
                    o.classList.remove('active');
                });
                element.classList.add('active');
                if (typeof showToast === 'function') {
                    showToast('Varian ' + element.textContent + ' dipilih');
                }
            };
        }

        // ============================================================
        // DESKRIPSI
        // ============================================================
        function setupDescription(product) {
            var descEl = document.getElementById('descText');
            if (!descEl) return;

            var fullDesc = product.description || (product.name + ' - produk digital premium');
            var isExpanded = false;
            var TRUNCATE_AT = 120;

            function renderCollapsed() {
                if (fullDesc.length > TRUNCATE_AT) {
                    descEl.innerHTML = escapeHtml(fullDesc.substring(0, TRUNCATE_AT)) +
                        '... <span class="show-more" onclick="toggleDescription()">... lihat selengkapnya</span>';
                } else {
                    descEl.textContent = fullDesc;
                }
            }

            function renderExpanded() {
                descEl.innerHTML = escapeHtml(fullDesc) +
                    ' <span class="show-more" onclick="toggleDescription()">... sembunyikan</span>';
            }

            renderCollapsed();

            window.toggleDescription = function() {
                isExpanded = !isExpanded;
                if (isExpanded) renderExpanded();
                else renderCollapsed();
            };
        }

        // ============================================================
        // ADD TO CART
        // ============================================================
        window.addToCart = function() {
            var product = window.currentProduct;
            if (!product) return;

            if (window.DeptechStore && typeof DeptechStore.addToCart === 'function') {
                DeptechStore.addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price
                });
            }

            if (typeof showToast === 'function') {
                showToast('Produk ditambahkan ke keranjang');
            }
        };

        // ============================================================
        // HELPER: LOADING / NOT FOUND / PAGE ERROR
        // ============================================================
        function showLoading() {
            var nameEl = document.getElementById('productName');
            if (nameEl) nameEl.textContent = 'Memuat...';

            var priceEl = document.getElementById('productPrice');
            if (priceEl) priceEl.textContent = 'Rp 0';
        }

        function showNotFound() {
            var nameEl = document.getElementById('productName');
            if (nameEl) nameEl.textContent = 'Produk tidak ditemukan';

            var priceEl = document.getElementById('productPrice');
            if (priceEl) priceEl.textContent = '-';

            var recGrid = document.getElementById('recGrid');
            if (recGrid) {
                recGrid.innerHTML = '<div class="col-span-full text-center py-10 text-[var(--text-muted)] text-sm">' +
                    '<i class="fa-regular fa-folder-open text-3xl block mb-2"></i>' +
                    'Produk yang Anda cari tidak tersedia.</div>';
            }
        }

        /**
         * ✅ FIX: sebelumnya fungsi ini bernama `showError` dan
         * memanggil dirinya sendiri → infinite recursion.
         * Sekarang dinamai `showPageError` dan memanggil
         * `window.showError` (global) via guard eksplisit.
         */
        function showPageError(message) {
            var nameEl = document.getElementById('productName');
            if (nameEl) nameEl.textContent = 'Gagal memuat produk';

            var priceEl = document.getElementById('productPrice');
            if (priceEl) priceEl.textContent = '-';

            // Render error + tombol retry di area rekomendasi (visible)
            var recGrid = document.getElementById('recGrid');
            if (recGrid) {
                recGrid.innerHTML =
                    '<div class="col-span-full text-center py-8">' +
                    '<i class="fa-solid fa-triangle-exclamation text-3xl text-[var(--danger)] block mb-3"></i>' +
                    '<strong class="block text-sm text-[var(--text-primary)] mb-1">Gagal memuat produk</strong>' +
                    '<p class="text-xs text-[var(--text-muted)] mb-4">' +
                    escapeHtml(message || 'Terjadi kesalahan.') +
                    '</p>' +
                    '<button onclick="location.reload()" ' +
                    'class="px-5 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold">' +
                    '<i class="fa-solid fa-rotate-right mr-1"></i> Coba Lagi' +
                    '</button>' +
                    '</div>';
            }

            // Panggil global showError jika ada (bukan dirinya sendiri!)
            if (typeof window.showError === 'function' &&
                window.showError !== showPageError) {
                window.showError(message);
            }
        }

        // ============================================================
        // ESCAPE
        // ============================================================
        function escapeHtml(s) {
            if (s == null) return '';
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function escapeAttr(s) {
            return String(s == null ? '' : s)
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

    });
})();