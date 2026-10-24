/* =====================================================
   DEPTECH - SERVER JAVASCRIPT
   Data provider dari DeptechStore + katalog produk
===================================================== */

var SERVER_CONFIG = {
    apiUrl: 'http://localhost:3000/api',
    version: '1.0.0',
    environment: 'development'
};

// =====================================================
// API CALLS
// =====================================================
async function apiGet(endpoint) {
    try {
        var response = await fetch(SERVER_CONFIG.apiUrl + endpoint);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

async function apiPost(endpoint, data) {
    try {
        var response = await fetch(SERVER_CONFIG.apiUrl + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// =====================================================
// DATA PROVIDER (dari DeptechStore)
// =====================================================
function getUsers() {
    var user = DeptechStore.getUser();
    return user ? [user] : [];
}

function getTransactions() {
    return DeptechStore.getTransactions();
}

function getTargets() {
    return DeptechStore.getTargets();
}

function getProducts() {
    return [
        { id: 1, name: 'Laptop Gaming Premium', category: 'elektronik', price: 12999000, rating: 4.8, sold: 1234 },
        { id: 2, name: 'Smartphone Flagship 5G', category: 'gadget', price: 8499000, rating: 4.9, sold: 2345 },
        { id: 3, name: 'Headphone Wireless ANC', category: 'aksesoris', price: 850000, rating: 4.7, sold: 567 }
    ];
}

// =====================================================
// EXPORT
// =====================================================
window.ServerAPI = {
    apiGet: apiGet,
    apiPost: apiPost,
    getUsers: getUsers,
    getTransactions: getTransactions,
    getTargets: getTargets,
    getProducts: getProducts,
    SERVER_CONFIG: SERVER_CONFIG
};

// =====================================================
// PRODUK - INDEX
// =====================================================
document.addEventListener('DOMContentLoaded', function() {

    if (document.getElementById('productGrid')) {

        var grid = document.getElementById('productGrid');
        var totalCount = document.getElementById('totalCount');
        var searchInput = document.getElementById('searchInput');
        var allProducts = grid.querySelectorAll('.product-card');
        var currentCategory = 'all';
        var currentSort = 'relevan';
        var currentSearch = '';

        function renderProducts() {
            var visibleCount = 0;
            var productsArray = [];

            allProducts.forEach(function(card) {
                var category = card.dataset.category;
                var name = card.dataset.name || '';
                var matchCategory = currentCategory === 'all' || category === currentCategory;
                var matchSearch = name.toLowerCase().includes(currentSearch.toLowerCase());

                if (matchCategory && matchSearch) {
                    productsArray.push(card);
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            productsArray.sort(function(a, b) {
                var priceA = parseInt(a.dataset.price) || 0;
                var priceB = parseInt(b.dataset.price) || 0;
                var nameA = a.dataset.name || '';
                var nameB = b.dataset.name || '';

                if (currentSort === 'termurah') return priceA - priceB;
                if (currentSort === 'termahal') return priceB - priceA;
                return nameA.localeCompare(nameB);
            });

            productsArray.forEach(function(card) {
                grid.appendChild(card);
            });

            if (totalCount) totalCount.textContent = visibleCount;

            var emptyState = document.getElementById('emptyState');
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.id = 'emptyState';
                emptyState.className = 'col-span-full text-center py-[60px] text-[#6b8bb0]';
                emptyState.innerHTML =
                    '<i class="fa-regular fa-folder-open text-[32px] block mb-3"></i>' +
                    '<strong class="block text-[13px] text-[#4b6a8b]">Produk tidak ditemukan</strong>' +
                    '<span class="text-[9px]">Coba gunakan kata pencarian lain.</span>';
                emptyState.style.display = 'none';
                grid.appendChild(emptyState);
            }

            emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        window.filterCategory = function(element, category) {
            document.querySelectorAll('#categoryTabs button').forEach(function(btn) {
                btn.classList.remove('tab-active', 'bg-[#2563eb]', 'text-white');
            });
            element.classList.add('tab-active', 'bg-[#2563eb]', 'text-white');
            currentCategory = category;
            renderProducts();
        };

        window.sortProducts = function(element, sort) {
            document.querySelectorAll('#sortOptions button').forEach(function(btn) {
                btn.classList.remove('sort-active', 'bg-[#eff6ff]', 'text-[#2563eb]');
            });
            element.classList.add('sort-active', 'bg-[#eff6ff]', 'text-[#2563eb]');
            currentSort = sort;
            renderProducts();
        };

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                currentSearch = this.value;
                renderProducts();
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
                if (productId && typeof DeptechStore !== 'undefined') {
                    DeptechStore.toggleWishlist(productId);
                }
                showToast('Dihapus dari wishlist');
            } else {
                icon.className = 'fa-solid fa-heart';
                btn.classList.add('liked');
                if (productId && typeof DeptechStore !== 'undefined') {
                    DeptechStore.toggleWishlist(productId);
                }
                showToast('Ditambahkan ke wishlist');
            }
        };

        allProducts.forEach(function(card) {
            card.addEventListener('click', function(e) {
                if (e.target.closest('.wishlist')) return;
                var productId = this.dataset.id || 1;
                window.location.href = 'detail.html?id=' + productId;
            });
        });

        var activeTab = document.querySelector('#categoryTabs .tab-active');
        if (activeTab) activeTab.classList.add('bg-[#2563eb]', 'text-white');

        var activeSort = document.querySelector('#sortOptions .sort-active');
        if (activeSort) activeSort.classList.add('bg-[#eff6ff]', 'text-[#2563eb]');

        renderProducts();
    }

    // =====================================================
    // PRODUK - DETAIL
    // =====================================================
    if (document.getElementById('productSlider')) {

        var allProductsData = {
            1: {
                id: 1,
                name: 'Laptop Gaming Premium 16GB RAM 512GB SSD',
                price: 12999000,
                originalPrice: 15500000,
                rating: 4.8,
                sold: 2345,
                image: 'fa-laptop',
                tag: 'Produk Unggulan',
                description: 'Laptop gaming premium dengan prosesor terbaru, RAM 16GB, dan penyimpanan SSD 512GB.',
                images: ['fa-laptop', 'fa-mobile-screen-button', 'fa-headphones']
            },
            2: {
                id: 2,
                name: 'Smartphone Flagship 5G 256GB Camera 108MP',
                price: 8499000,
                originalPrice: null,
                rating: 4.9,
                sold: 5678,
                image: 'fa-mobile-screen-button',
                tag: 'Best Seller',
                description: 'Smartphone flagship dengan kamera 108MP, layar AMOLED 120Hz, dan baterai 5000mAh.',
                images: ['fa-mobile-screen-button', 'fa-camera', 'fa-bolt']
            },
            3: {
                id: 3,
                name: 'Headphone Wireless ANC Premium 40 Jam',
                price: 850000,
                originalPrice: 1200000,
                rating: 4.7,
                sold: 890,
                image: 'fa-headphones',
                tag: 'Audio Premium',
                description: 'Headphone wireless dengan Active Noise Cancellation, baterai tahan 40 jam.',
                images: ['fa-headphones', 'fa-bluetooth', 'fa-battery-full']
            },
            4: {
                id: 4,
                name: 'Smart TV 55 Inch 4K UHD Smart TV',
                price: 4999000,
                originalPrice: null,
                rating: 4.6,
                sold: 432,
                image: 'fa-tv',
                tag: 'Home Theater',
                description: 'Smart TV 55 inch 4K UHD dengan HDR10, Dolby Vision, dan Dolby Atmos.',
                images: ['fa-tv', 'fa-display', 'fa-play']
            },
            5: {
                id: 5,
                name: 'Smartwatch Fitness Tracker AMOLED',
                price: 1250000,
                originalPrice: null,
                rating: 4.4,
                sold: 5678,
                image: 'fa-clock',
                tag: 'Wearable',
                description: 'Smartwatch dengan layar AMOLED, sensor detak jantung, GPS, dan pemantauan tidur.',
                images: ['fa-clock', 'fa-heart', 'fa-shoe-prints']
            }
        };

        var urlParams = new URLSearchParams(window.location.search);
        var productId = parseInt(urlParams.get('id')) || 1;

        function getRecommendations(currentId) {
            var ids = Object.keys(allProductsData).map(Number);
            var others = ids.filter(function(id) { return id !== currentId; });
            return others.sort(function() { return 0.5 - Math.random(); }).slice(0, 4);
        }

        var recommendationIds = getRecommendations(productId);

        function renderRecommendations() {
            var recGrid = document.getElementById('recGrid');
            if (!recGrid) return;

            recGrid.innerHTML = '';

            recommendationIds.forEach(function(id) {
                var p = allProductsData[id];
                if (!p) return;

                var item = document.createElement('div');
                item.className = 'rec-item';
                item.setAttribute('onclick', "window.location.href='detail.html?id=" + p.id + "'");
                item.innerHTML =
                    '<div class="rec-img"><i class="fa-solid ' + p.image + '"></i></div>' +
                    '<div class="rec-body">' +
                    '<div class="rec-name">' + p.name + '</div>' +
                    '<div class="rec-price">Rp' + p.price.toLocaleString() + '</div>' +
                    '<div class="rec-sold">Terjual ' + p.sold.toLocaleString() + '</div>' +
                    '</div>';
                recGrid.appendChild(item);
            });
        }

        function updateDetailUI(product) {
            if (!product) return;

            var nameEl = document.querySelector('.product-name');
            var priceEl = document.querySelector('.product-price');
            var ratingEl = document.querySelector('.product-rating');
            var tagEl = document.querySelector('.product-tag');
            var iconEl = document.querySelector('.product-icon');
            var descEl = document.getElementById('descText');

            if (nameEl) nameEl.textContent = product.name;
            if (tagEl) tagEl.textContent = product.tag;

            if (priceEl) {
                var originalHtml = product.originalPrice ?
                    ' <span class="original-price">Rp' + product.originalPrice.toLocaleString() + '</span>' : '';
                priceEl.innerHTML = 'Rp' + product.price.toLocaleString() + originalHtml;
            }

            if (ratingEl) {
                var stars = '';
                var fullStars = Math.floor(product.rating);
                for (var i = 0; i < fullStars; i++) stars += '<i class="fa-solid fa-star"></i>';
                if (product.rating % 1 >= 0.5) stars += '<i class="fa-solid fa-star-half-stroke"></i>';
                for (var j = fullStars + (product.rating % 1 >= 0.5 ? 1 : 0); j < 5; j++) stars += '<i class="fa-regular fa-star"></i>';

                ratingEl.innerHTML =
                    '<span class="stars">' + stars + '</span>' +
                    '<span id="ratingText">' + product.rating + ' (' + product.sold + ' penilaian)</span>' +
                    '<span class="divider"></span>' +
                    '<span id="soldText">Terjual ' + product.sold.toLocaleString() + '</span>';
            }

            if (iconEl) iconEl.className = 'fa-solid ' + product.image;

            if (descEl) {
                window.fullText = product.description;
                descEl.innerHTML = product.description +
                    ' <span class="show-more" id="showMore" onclick="toggleDescription()">... lihat selengkapnya</span>';
            }

            var slides = document.querySelectorAll('.slide .product-icon');
            if (slides.length > 0 && product.images && product.images.length > 0) {
                slides.forEach(function(el, index) {
                    var imgIndex = index % product.images.length;
                    el.className = 'fa-solid ' + product.images[imgIndex] + ' product-icon';
                });
            }
        }

        var product = allProductsData[productId] || allProductsData[1];

        if (productId !== product.id) {
            window.history.replaceState({}, '', 'detail.html?id=' + product.id);
        }

        updateDetailUI(product);
        renderRecommendations();

        var currentSlide = 0;
        var totalSlides = document.querySelectorAll('.slide').length;
        var sliderContainer = document.getElementById('sliderContainer');
        var dots = document.querySelectorAll('.dot');

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
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                goToSlide(currentSlide - 1);
            });
        }

        var nextBtn = document.getElementById('nextSlide');
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                goToSlide(currentSlide + 1);
            });
        }

        dots.forEach(function(dot) {
            dot.addEventListener('click', function() {
                goToSlide(parseInt(this.dataset.index));
            });
        });

        var autoSlide = setInterval(function() {
            goToSlide(currentSlide + 1);
        }, 4000);

        var slider = document.getElementById('productSlider');
        if (slider) {
            slider.addEventListener('touchstart', function() {
                clearInterval(autoSlide);
            });
            slider.addEventListener('touchend', function() {
                autoSlide = setInterval(function() {
                    goToSlide(currentSlide + 1);
                }, 4000);
            });
        }

        window.selectVariant = function(element) {
            var parent = element.closest('.variant-options');
            parent.querySelectorAll('.option').forEach(function(o) {
                o.classList.remove('active');
            });
            element.classList.add('active');
            showToast('Varian ' + element.textContent + ' dipilih');
        };

        var isExpanded = false;

        window.toggleDescription = function() {
            var descEl = document.getElementById('descText');
            if (!descEl) return;

            var productData = allProductsData[productId] || allProductsData[1];
            var fullText = productData.description;

            isExpanded = !isExpanded;
            if (isExpanded) {
                descEl.innerHTML = fullText +
                    ' <span class="show-more" id="showMore" onclick="toggleDescription()">... sembunyikan</span>';
            } else {
                descEl.innerHTML = fullText.substring(0, 120) +
                    '... <span class="show-more" id="showMore" onclick="toggleDescription()">... lihat selengkapnya</span>';
            }
        };

        window.addToCart = function() {
            if (typeof DeptechStore !== 'undefined') {
                DeptechStore.addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price
                });
            }
            showToast('Produk ditambahkan ke keranjang');
            var badge = document.querySelector('.cart-badge .badge');
            if (badge) {
                var count = parseInt(badge.textContent) + 1;
                badge.textContent = count;
            }
        };

        window.goBack = function() {
            window.history.back();
        };
    }
});