/**
 * main.js - Backend Entry Point
 * @version 1.0.0
 * 
 * Fungsi: Load semua module backend + cek dependency
 * Path: src/backend/javascript/main.js
 */

(function() {
    'use strict';

    // ============================================================
    // CEK MODULE
    // ============================================================
    function checkModules() {
        var status = {
            ServerAPI: typeof window.ServerAPI !== 'undefined',
            ProductsAPI: typeof window.ProductsAPI !== 'undefined'
        };

        if (!status.ServerAPI) {
            console.error('[Backend] ServerAPI missing');
        }
        if (!status.ProductsAPI) {
            console.error('[Backend] ProductsAPI missing');
        }

        return status;
    }

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        console.log('[Backend] DepTech Backend v1.0.0');
        checkModules();
    }

    // ============================================================
    // EXPOSE
    // ============================================================
    window.DepTechBackend = {
        init: init,
        checkModules: checkModules,
        version: '1.0.0'
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();