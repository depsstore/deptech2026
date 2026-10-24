/**
 * products.js - Product API Layer
 * @version 1.0.0
 * 
 * Fungsi: Handle semua request terkait produk
 * Path: src/backend/javascript/server/products.js
 * 
 * Bergantung pada: server.js (ServerAPI)
 */

(function() {
    'use strict';

    // ============================================================
    // CEK DEPENDENCY
    // ============================================================
    if (typeof window.ServerAPI === 'undefined') {
        console.error('[Products] ServerAPI belum di-load! Pastikan server.js di-load dulu.');
    }

    // ============================================================
    // CACHE PRODUK (biar tidak fetch berulang)
    // ============================================================
    var productsCache = {
        data: null,
        timestamp: 0,
        ttl: 60000 // 1 menit
    };

    // ============================================================
    // NORMALIZE PRODUK (dari API response)
    // ============================================================
    function normalizeProduct(raw) {
        return {
            id: raw.id || '',
            name: raw.name || 'Produk',
            category: raw.category || 'Umum',
            category_code: raw.category_code || '001',
            price: Number(raw.price) || 0,
            originalPrice: Number(raw.original_price || raw.originalPrice) || 0,
            stock: Number(raw.stock) || 0,
            description: raw.description || '',
            image: raw.image || '',
            status: raw.status || 'active',
            rating: Number(raw.rating) || 4.5,
            sold: Number(raw.sold) || 0,
            store: raw.store || 'DepTech Official',
            product_type: raw.product_type || 'digital',
            auto_provider: raw.auto_provider || '',
            auto_config: raw.auto_config || '{}',
            created_at: raw.created_at || new Date().toISOString(),
            updated_at: raw.updated_at || new Date().toISOString()
        };
    }

    // ============================================================
    // GET ALL PRODUCTS (dengan cache)
    // ============================================================
    function getAllProducts(forceRefresh) {
        var now = Date.now();

        // Kalau cache valid dan tidak force refresh
        if (!forceRefresh && productsCache.data && (now - productsCache.timestamp) < productsCache.ttl) {
            console.log('[Products] Return from cache:', productsCache.data.length, 'produk');
            return Promise.resolve(productsCache.data);
        }

        console.log('[Products] Fetch from API...');

        return window.ServerAPI.get('/products')
            .then(function(response) {
                var items = [];
                if (response && response.success) {
                    items = response.items || response.data || [];
                } else if (Array.isArray(response)) {
                    items = response;
                }

                // Normalize
                var normalized = items.map(normalizeProduct);

                // Save cache
                productsCache.data = normalized;
                productsCache.timestamp = now;

                console.log('[Products] Loaded:', normalized.length, 'produk');
                return normalized;
            })
            .catch(function(error) {
                console.error('[Products] Failed to load:', error);
                throw error;
            });
    }

    // ============================================================
    // GET PRODUCT BY ID
    // ============================================================
    function getProductById(id) {
        if (!id) return Promise.reject(new Error('ID produk wajib diisi'));

        return getAllProducts().then(function(products) {
            for (var i = 0; i < products.length; i++) {
                if (String(products[i].id) === String(id)) {
                    return products[i];
                }
            }
            return null;
        });
    }

    // ============================================================
    // GET PRODUCTS BY CATEGORY
    // ============================================================
    function getProductsByCategory(category) {
        if (!category || category === 'all') {
            return getAllProducts();
        }

        return getAllProducts().then(function(products) {
            return products.filter(function(p) {
                return String(p.category).toLowerCase() === String(category).toLowerCase();
            });
        });
    }

    // ============================================================
    // SEARCH PRODUCTS
    // ============================================================
    function searchProducts(keyword) {
        if (!keyword) return getAllProducts();

        var search = String(keyword).toLowerCase().trim();

        return getAllProducts().then(function(products) {
            return products.filter(function(p) {
                return (p.name || '').toLowerCase().indexOf(search) !== -1 ||
                       (p.description || '').toLowerCase().indexOf(search) !== -1 ||
                       (p.category || '').toLowerCase().indexOf(search) !== -1;
            });
        });
    }

    // ============================================================
    // SORT PRODUCTS
    // ============================================================
    function sortProducts(products, sortBy) {
        var sorted = products.slice();

        switch (sortBy) {
            case 'termurah':
                sorted.sort(function(a, b) { return a.price - b.price; });
                break;
            case 'termahal':
                sorted.sort(function(a, b) { return b.price - a.price; });
                break;
            case 'terbaru':
                sorted.sort(function(a, b) {
                    return new Date(b.created_at) - new Date(a.created_at);
                });
                break;
            case 'relevan':
            default:
                // Sort by rating + sold
                sorted.sort(function(a, b) {
                    return (b.rating * 100 + b.sold) - (a.rating * 100 + a.sold);
                });
                break;
        }

        return sorted;
    }

    // ============================================================
    // FILTER PRODUK AUTO-ACCOUNT (Alight Motion dll)
    // ============================================================
    function getAutoAccountProducts() {
        return getAllProducts().then(function(products) {
            return products.filter(function(p) {
                return p.product_type === 'auto_account';
            });
        });
    }

    // ============================================================
    // GET PRODUK PREMIUM (Alight Motion / Jaky)
    // ============================================================
    function getAlightMotionProducts() {
        return getAllProducts().then(function(products) {
            return products.filter(function(p) {
                return p.product_type === 'auto_account' &&
                       p.auto_provider === 'jaky_alight';
            });
        });
    }

    // ============================================================
    // CLEAR CACHE (untuk refresh manual)
    // ============================================================
    function clearCache() {
        productsCache.data = null;
        productsCache.timestamp = 0;
        console.log('[Products] Cache cleared');
    }

    // ============================================================
    // EXPOSE
    // ============================================================
    window.ProductsAPI = {
        getAll: getAllProducts,
        getById: getProductById,
        getByCategory: getProductsByCategory,
        search: searchProducts,
        sort: sortProducts,
        getAutoAccount: getAutoAccountProducts,
        getAlightMotion: getAlightMotionProducts,
        clearCache: clearCache,
        normalize: normalizeProduct
    };

    console.log('[ProductsAPI] Loaded');

})();