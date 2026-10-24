/**
 * server.js - Backend Fetch Layer
 * @version 1.1.0
 *
 * Changelog:
 *  - v1.1.0: Hapus blok DOMContentLoaded duplikat (grid render & handler override).
 *            Layer ini SEKARANG hanya bertugas sebagai fetch wrapper (ServerAPI).
 *            Semua rendering produk ditangani di product-page.js.
 *
 * Path: src/backend/javascript/server/server.js
 */

(function() {
    'use strict';

    // ============================================================
    // KONFIGURASI API
    // ============================================================
    var SERVER_CONFIG = {
        apiUrl: 'https://apiserverdepsstore.vercel.app/api/v2',
        timeout: 30000,
        version: '1.1.0',
        environment: 'production'
    };

    // ============================================================
    // FETCH HELPER (dengan timeout)
    // ============================================================
    function fetchWithTimeout(url, options) {
        options = options || {};
        var timeout = options.timeout || SERVER_CONFIG.timeout;

        var controller = new AbortController();
        var timeoutId = setTimeout(function() {
            controller.abort();
        }, timeout);

        return fetch(url, Object.assign({}, options, {
            signal: controller.signal
        })).then(function(response) {
            clearTimeout(timeoutId);
            return response;
        }).catch(function(error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        });
    }

    // ============================================================
    // GET REQUEST
    // ============================================================
    function apiGet(endpoint) {
        var url = endpoint.indexOf('http') === 0
            ? endpoint
            : SERVER_CONFIG.apiUrl + endpoint;

        console.log('[ServerAPI] GET:', url);

        return fetchWithTimeout(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        })
        .catch(function(error) {
            console.error('[ServerAPI] GET Error:', url, error.message);
            throw error;
        });
    }

    // ============================================================
    // POST REQUEST
    // ============================================================
    function apiPost(endpoint, data) {
        var url = endpoint.indexOf('http') === 0
            ? endpoint
            : SERVER_CONFIG.apiUrl + endpoint;

        console.log('[ServerAPI] POST:', url);

        return fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data || {})
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        })
        .catch(function(error) {
            console.error('[ServerAPI] POST Error:', url, error.message);
            throw error;
        });
    }

    // ============================================================
    // EXPOSE
    // ============================================================
    window.ServerAPI = {
        get: apiGet,
        post: apiPost,
        config: SERVER_CONFIG
    };

    console.log('[ServerAPI] Loaded — API:', SERVER_CONFIG.apiUrl);

})();