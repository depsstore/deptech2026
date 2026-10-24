/**
 * products.js - ProductsAPI Frontend Layer
 * @version 2.0.0
 *
 * Changelog:
 *  - v2.0.0: Rewrite total. Default pakai data statis lokal (12+ produk).
 *            Jika window.DEPTECH_API_BASE di-set, fetch dari API.
 *            API shape: { getAll, getById, filter, sort, search }
 *
 * Path: src/frontend/assets/js/products.js
 *
 * Cara pakai:
 *   <script src="/src/frontend/assets/js/products.js"></script>
 *   ProductsAPI.getAll().then(list => { ... });
 *
 * Untuk pakai API backend (opsional):
 *   <script>window.DEPTECH_API_BASE = 'https://apiserverdepsstore.vercel.app/api/v2';</script>
 *   ... sebelum load products.js
 */

(function() {
    'use strict';

    // ============================================================
    // CACHE
    // ============================================================
    var cache = {
        data: null,
        timestamp: 0,
        ttl: 60000 // 1 menit
    };

    // ============================================================
    // DATA STATIS LOKAL — 14 produk (multi kategori)
    // ============================================================
    var STATIC_PRODUCTS = [
        {
            id: 'pulsa-10k',
            name: 'Pulsa Telkomsel 10.000',
            category: 'pulsa',
            price: 11000,
            originalPrice: 12000,
            stock: 9999,
            description: 'Pulsa Telkomsel 10.000. Proses instan, bisa untuk semua nomor Telkomsel.',
            image: '',
            status: 'active',
            rating: 4.8,
            sold: 15420
        },
        {
            id: 'pulsa-50k',
            name: 'Pulsa Indosat 50.000',
            category: 'pulsa',
            price: 50500,
            originalPrice: 52000,
            stock: 9999,
            description: 'Pulsa Indosat 50.000. Proses instan 24 jam.',
            image: '',
            status: 'active',
            rating: 4.7,
            sold: 8920
        },
        {
            id: 'data-10gb',
            name: 'Paket Data 10 GB / 30 Hari',
            category: 'data',
            price: 55000,
            originalPrice: 65000,
            stock: 5000,
            description: 'Paket data 10 GB untuk semua operator. Masa aktif 30 hari.',
            image: '',
            status: 'active',
            rating: 4.6,
            sold: 3210
        },
        {
            id: 'data-unlimited',
            name: 'Paket Data Unlimited 7 Hari',
            category: 'data',
            price: 35000,
            originalPrice: 45000,
            stock: 3000,
            description: 'Paket data unlimited (FUP 3 GB/hari) selama 7 hari.',
            image: '',
            status: 'active',
            rating: 4.5,
            sold: 2100
        },
        {
            id: 'game-ml-86',
            name: 'Diamond Mobile Legends 86',
            category: 'game',
            price: 22000,
            originalPrice: 25000,
            stock: 999,
            description: 'Diamond Mobile Legends 86. Masuk otomatis via User ID + Zone ID.',
            image: '',
            status: 'active',
            rating: 4.9,
            sold: 45600
        },
        {
            id: 'game-ff-355',
            name: 'Diamond Free Fire 355',
            category: 'game',
            price: 49000,
            originalPrice: 52000,
            stock: 999,
            description: 'Diamond Free Fire 355. Proses instan setelah pembayaran.',
            image: '',
            status: 'active',
            rating: 4.8,
            sold: 12300
        },
        {
            id: 'voucher-grab-25',
            name: 'Voucher Grab Rp25.000',
            category: 'voucher',
            price: 23000,
            originalPrice: 25000,
            stock: 500,
            description: 'Voucher Grab Rp25.000. Bisa untuk GrabBike & GrabFood.',
            image: '',
            status: 'active',
            rating: 4.7,
            sold: 8900
        },
        {
            id: 'voucher-google-play',
            name: 'Voucher Google Play Rp50.000',
            category: 'voucher',
            price: 47000,
            originalPrice: 50000,
            stock: 300,
            description: 'Voucher Google Play Rp50.000. Kode dikirim via email.',
            image: '',
            status: 'active',
            rating: 4.8,
            sold: 3400
        },
        {
            id: 'fashion-kaos',
            name: 'Kaos Premium Cotton Combed 30s',
            category: 'fashion',
            price: 79000,
            originalPrice: 99000,
            stock: 50,
            description: 'Kaos premium bahan cotton combed 30s. Tersedia semua ukuran S-XXL.',
            image: '',
            status: 'active',
            rating: 4.6,
            sold: 2100
        },
        {
            id: 'fashion-tas',
            name: 'Tas Ransel Anti Air 30L',
            category: 'fashion',
            price: 185000,
            originalPrice: 220000,
            stock: 30,
            description: 'Tas ransel anti air kapasitas 30L. Cocok untuk kerja & traveling.',
            image: '',
            status: 'active',
            rating: 4.5,
            sold: 950
        },
        {
            id: 'rumah-lampu',
            name: 'Lampu LED Pintar RGB 10W',
            category: 'rumah',
            price: 65000,
            originalPrice: 85000,
            stock: 100,
            description: 'Lampu LED pintar RGB 10W. Kontrol via aplikasi, 16 juta warna.',
            image: '',
            status: 'active',
            rating: 4.7,
            sold: 1800
        },
        {
            id: 'rumah-rice-cooker',
            name: 'Rice Cooker Mini 1.2L',
            category: 'rumah',
            price: 235000,
            originalPrice: 280000,
            stock: 20,
            description: 'Rice cooker mini 1.2L. Cocok untuk 1-3 orang. Anti lengket.',
            image: '',
            status: 'active',
            rating: 4.6,
            sold: 620
        },
        {
            id: 'elektronik-headphone',
            name: 'Headphone Wireless ANC',
            category: 'elektronik',
            price: 425000,
            originalPrice: 550000,
            stock: 15,
            description: 'Headphone wireless dengan Active Noise Cancellation, baterai 40 jam.',
            image: '',
            status: 'active',
            rating: 4.8,
            sold: 430
        },
        {
            id: 'elektronik-smartwatch',
            name: 'Smartwatch Fitness Tracker',
            category: 'elektronik',
            price: 325000,
            originalPrice: 399000,
            stock: 25,
            description: 'Smartwatch dengan layar AMOLED, sensor detak jantung, GPS, monitor tidur.',
            image: '',
            status: 'active',
            rating: 4.5,
            sold: 780
        }
    ];

    // ============================================================
    // NORMALIZE — bentuk produk konsisten
    // ============================================================
    function normalize(raw) {
        if (!raw) return null;
        return {
            id: String(raw.id != null ? raw.id : ''),
            name: String(raw.name || 'Produk'),
            category: String(raw.category || 'lainnya').toLowerCase(),
            price: Number(raw.price) || 0,
            originalPrice: Number(raw.originalPrice || raw.original_price) || 0,
            stock: Number(raw.stock) || 0,
            description: String(raw.description || ''),
            image: String(raw.image || ''),
            status: raw.status || 'active',
            rating: Number(raw.rating) || 4.5,
            sold: Number(raw.sold) || 0
        };
    }

    // ============================================================
    // FETCH DARI API (jika di-set)
    // ============================================================
    function fetchFromApi() {
        var base = window.DEPTECH_API_BASE;
        if (!base) return Promise.resolve(null);

        var url = base.replace(/\/+$/, '') + '/products';

        return fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        })
        .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function(json) {
            var items = [];
            if (Array.isArray(json)) items = json;
            else if (json && json.success && Array.isArray(json.items)) items = json.items;
            else if (json && json.success && Array.isArray(json.data)) items = json.data;
            return items.map(normalize).filter(Boolean);
        })
        .catch(function(err) {
            console.warn('[ProductsAPI] Fetch API gagal, fallback ke data statis:', err.message);
            return null;
        });
    }

    // ============================================================
    // GET ALL
    // ============================================================
    function getAll(forceRefresh) {
        var now = Date.now();

        if (!forceRefresh && cache.data && (now - cache.timestamp) < cache.ttl) {
            return Promise.resolve(cache.data.slice());
        }

        return fetchFromApi().then(function(fromApi) {
            var list = fromApi && fromApi.length > 0
                ? fromApi
                : STATIC_PRODUCTS.map(normalize);

            cache.data = list;
            cache.timestamp = now;
            return list.slice();
        });
    }

    // ============================================================
    // GET BY ID
    // ============================================================
    function getById(id) {
        if (!id) return Promise.reject(new Error('ID produk wajib diisi'));
        return getAll().then(function(list) {
            for (var i = 0; i < list.length; i++) {
                if (String(list[i].id) === String(id)) return list[i];
            }
            return null;
        });
    }

    // ============================================================
    // FILTER
    // ============================================================
    function filter(list, opts) {
        opts = opts || {};
        var category = opts.category && opts.category !== 'all'
            ? String(opts.category).toLowerCase()
            : null;
        var q = opts.q ? String(opts.q).toLowerCase().trim() : '';

        return list.filter(function(p) {
            if (p.status !== 'active') return false;
            if (category && p.category !== category) return false;
            if (q) {
                var inName = p.name.toLowerCase().indexOf(q) !== -1;
                var inDesc = (p.description || '').toLowerCase().indexOf(q) !== -1;
                var inCat = (p.category || '').toLowerCase().indexOf(q) !== -1;
                if (!inName && !inDesc && !inCat) return false;
            }
            return true;
        });
    }

    // ============================================================
    // SORT
    // ============================================================
    function sort(list, by) {
        var arr = list.slice();
        switch (by) {
            case 'termurah':
                arr.sort(function(a, b) { return a.price - b.price; });
                break;
            case 'termahal':
                arr.sort(function(a, b) { return b.price - a.price; });
                break;
            case 'terbaru':
                arr.sort(function(a, b) { return String(b.id).localeCompare(String(a.id)); });
                break;
            case 'relevan':
            default:
                arr.sort(function(a, b) {
                    return (b.rating * 100 + b.sold) - (a.rating * 100 + a.sold);
                });
        }
        return arr;
    }

    // ============================================================
    // SEARCH
    // ============================================================
    function search(q) {
        return getAll().then(function(list) {
            return filter(list, { q: q });
        });
    }

    // ============================================================
    // CLEAR CACHE
    // ============================================================
    function clearCache() {
        cache.data = null;
        cache.timestamp = 0;
    }

    // ============================================================
    // EXPORT
    // ============================================================
    window.ProductsAPI = {
        getAll: getAll,
        getById: getById,
        filter: filter,
        sort: sort,
        search: search,
        clearCache: clearCache
    };

    console.log('[ProductsAPI v2] Loaded — ' +
        (window.DEPTECH_API_BASE ? 'mode: API' : 'mode: static data') +
        ' (' + STATIC_PRODUCTS.length + ' produk)');

})();