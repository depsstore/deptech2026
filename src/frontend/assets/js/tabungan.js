/* =====================================================
   DEPTECH - TABUNGAN ACTIONS
   Export, Import, Reset, Sync + Toast Loading
===================================================== */

var TabunganActions = (function () {
    'use strict';

    var KEYS = {
        targets: 'deptech_targets',
        targetLogs: 'deptech_target_logs',
        transactions: 'deptech_transactions',
        activityLog: 'deptech_activity_log',
        lastSync: 'deptech_tabungan_sync_at',
        lastExport: 'deptech_tabungan_export_at',
        lastImport: 'deptech_tabungan_import_at'
    };

    // =====================================================
    // TOAST UPLOAD MODERN
    // =====================================================
    function showUploadToast(options) {
        var opts = options || {};
        var title = opts.title || 'Memproses...';
        var subtitle = opts.subtitle || 'Mohon tunggu sebentar';
        var iconType = opts.icon || 'cloud'; // 'cloud' | 'download' | 'upload' | 'trash'

        // Ikon SVG berdasarkan tipe
        var iconSvg = '';
        if (iconType === 'cloud') {
            iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>';
        } else if (iconType === 'download') {
            iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
        } else if (iconType === 'upload') {
            iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
        } else if (iconType === 'trash') {
            iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
        }

        // Buat elemen toast
        var toast = document.createElement('div');
        toast.className = 'toast-upload';
        toast.innerHTML =
            '<div class="header">' +
            '<div class="file-thumb" data-thumb>' + iconSvg + '</div>' +
            '<div class="file-info">' +
            '<strong data-title>' + title + '</strong>' +
            '<span data-meta>' + subtitle + '</span>' +
            '</div>' +
            '</div>' +
            '<div class="progress-wrap">' +
            '<div class="progress-meta">' +
            '<span data-status>' + title + '</span>' +
            '<span class="percent" data-percent>0%</span>' +
            '</div>' +
            '<div class="progress-track">' +
            '<div class="progress-fill" data-fill></div>' +
            '</div>' +
            '</div>';

        document.body.appendChild(toast);

        var fill = toast.querySelector('[data-fill]');
        var percent = toast.querySelector('[data-percent]');
        var status = toast.querySelector('[data-status]');
        var meta = toast.querySelector('[data-meta]');
        var thumb = toast.querySelector('[data-thumb]');

        var progress = 0;
        var timer = setInterval(function () {
            progress += Math.random() * 15 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(timer);
                finish(true);
            }
            fill.style.width = progress + '%';
            percent.textContent = Math.round(progress) + '%';
        }, 200);

        function finish(success) {
            if (success) {
                toast.classList.add('success');
                status.textContent = 'Berhasil';
                meta.textContent = subtitle + ' · Selesai';
                thumb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                fill.style.width = '100%';
                percent.textContent = '100%';

                setTimeout(function () {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(-20px) scale(0.95)';
                    setTimeout(function () {
                        toast.remove();
                    }, 400);
                }, 1500);
            } else {
                toast.classList.add('error');
                status.textContent = 'Gagal';
                meta.textContent = subtitle + ' · Gagal';
                thumb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

                setTimeout(function () {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(-20px) scale(0.95)';
                    setTimeout(function () {
                        toast.remove();
                    }, 400);
                }, 2000);
            }
        }

        return {
            success: function () { finish(true); },
            error: function () { finish(false); }
        };
    }

    // =====================================================
    // SIMPAN TIMESTAMP
    // =====================================================
    function saveTimestamp(key) {
        try {
            localStorage.setItem(key, new Date().toISOString());
        } catch (e) { }
    }

    // =====================================================
    // FORMAT RELATIVE
    // =====================================================
    function formatRelative(dateStr) {
        if (!dateStr) return 'Belum pernah';
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

    // =====================================================
    // UPDATE CARD STATUS
    // =====================================================
    function updateCardStatus() {
        var syncEl = document.getElementById('tabunganSyncStatus');
        var exportEl = document.getElementById('tabunganExportStatus');
        var importEl = document.getElementById('tabunganImportStatus');

        if (syncEl) {
            syncEl.textContent = 'Terakhir sync: ' + formatRelative(localStorage.getItem(KEYS.lastSync));
        }
        if (exportEl) {
            exportEl.textContent = 'Terakhir export: ' + formatRelative(localStorage.getItem(KEYS.lastExport));
        }
        if (importEl) {
            importEl.textContent = 'Terakhir import: ' + formatRelative(localStorage.getItem(KEYS.lastImport));
        }
    }

    // =====================================================
    // EXPORT — Simpan ke file .json
    // =====================================================
    function exportTabungan() {
        var targets = JSON.parse(localStorage.getItem(KEYS.targets) || '[]');
        var targetLogs = JSON.parse(localStorage.getItem(KEYS.targetLogs) || '[]');

        if (targets.length === 0) {
            if (typeof showError === 'function') {
                showError('Belum ada target untuk di-export');
            }
            return;
        }

        var toast = showUploadToast({
            title: 'Menyiapkan file...',
            subtitle: targets.length + ' target akan di-export',
            icon: 'download'
        });

        setTimeout(function () {
            try {
                var data = {
                    app: 'DepTech',
                    type: 'tabungan-backup',
                    version: '1.0',
                    exportedAt: new Date().toISOString(),
                    totalTargets: targets.length,
                    totalLogs: targetLogs.length,
                    targets: targets,
                    targetLogs: targetLogs
                };

                var json = JSON.stringify(data, null, 2);
                var blob = new Blob([json], { type: 'application/json' });
                var url = URL.createObjectURL(blob);

                var tanggal = new Date().toISOString().split('T')[0];
                var jam = new Date().toTimeString().slice(0, 5).replace(':', '');
                var filename = 'deptech-tabungan-' + tanggal + '-' + jam + '.json';

                var a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                saveTimestamp(KEYS.lastExport);
                toast.success();
                updateCardStatus();

                if (typeof DeptechStore !== 'undefined' && typeof DeptechStore.logActivity === 'function') {
                    DeptechStore.logActivity({
                        action: 'tabungan_export',
                        title: 'Tabungan Di-export',
                        description: targets.length + ' target disimpan ke file',
                        icon: 'fa-download',
                        iconType: 'info'
                    });
                }
            } catch (err) {
                console.error('[TabunganActions] Export error:', err);
                toast.error();
            }
        }, 400);
    }

    // =====================================================
    // IMPORT — Baca file .json
    // =====================================================
    function triggerImportTabungan() {
        var input = document.getElementById('importTabunganFile');
        if (!input) {
            console.error('[TabunganActions] Element #importTabunganFile tidak ditemukan');
            return;
        }
        input.value = '';
        input.click();
    }

    function handleImportFile(event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            if (typeof showError === 'function') {
                showError('File terlalu besar (max 5MB)');
            }
            return;
        }

        var reader = new FileReader();

        reader.onload = function (e) {
            try {
                var data = JSON.parse(e.target.result);

                if (!data.targets || !Array.isArray(data.targets)) {
                    throw new Error('Struktur file tidak valid');
                }

                var jumlahTarget = data.targets.length;
                var jumlahLog = (data.targetLogs || []).length;

                var msg = 'Import ' + jumlahTarget + ' target';
                if (jumlahLog > 0) msg += ' + ' + jumlahLog + ' riwayat';
                msg += '?\n\nData tabungan saat ini akan DIGANTI.\nData lain (saldo, transaksi, dll) tetap aman.';

                if (!confirm(msg)) return;

                var toast = showUploadToast({
                    title: 'Mengimpor data...',
                    subtitle: jumlahTarget + ' target · ' + jumlahLog + ' riwayat',
                    icon: 'upload'
                });

                setTimeout(function () {
                    try {
                        localStorage.setItem(KEYS.targets, JSON.stringify(data.targets));
                        localStorage.setItem(KEYS.targetLogs, JSON.stringify(data.targetLogs || []));

                        saveTimestamp(KEYS.lastImport);
                        toast.success();
                        updateCardStatus();

                        if (typeof DeptechStore !== 'undefined' && typeof DeptechStore.logActivity === 'function') {
                            DeptechStore.logActivity({
                                action: 'tabungan_import',
                                title: 'Tabungan Di-import',
                                description: jumlahTarget + ' target dipulihkan dari file',
                                icon: 'fa-upload',
                                iconType: 'info'
                            });
                        }

                        setTimeout(function () {
                            window.location.reload();
                        }, 1800);
                    } catch (err) {
                        console.error('[TabunganActions] Import error:', err);
                        toast.error();
                    }
                }, 400);

            } catch (err) {
                console.error('[TabunganActions] Import error:', err);
                if (typeof showError === 'function') {
                    showError('File tidak valid: ' + err.message);
                }
            }
        };

        reader.onerror = function () {
            if (typeof showError === 'function') {
                showError('Gagal membaca file');
            }
        };

        reader.readAsText(file);
    }

    // =====================================================
    // RESET — Hapus semua target & log
    // =====================================================
    function resetTabungan() {
        var targets = JSON.parse(localStorage.getItem(KEYS.targets) || '[]');

        if (targets.length === 0) {
            if (typeof showError === 'function') {
                showError('Belum ada target untuk dihapus');
            }
            return;
        }

        // Konfirmasi 1
        if (!confirm(
            'Reset Total Data Tabungan?\n\n' +
            'Semua data berikut akan DIHAPUS PERMANEN:\n' +
            '• ' + targets.length + ' target\n' +
            '• Semua riwayat tabungan\n' +
            '• Semua transaksi tabungan\n' +
            '• Saldo akan menjadi Rp0\n' +
            '• Notifikasi & aktivitas terkait\n\n' +
            'Data ini tidak bisa dikembalikan!'
        )) {
            return;
        }

        // Konfirmasi 2 (double-check)
        if (!confirm(
            '⚠️ KONFIRMASI TERAKHIR\n\n' +
            'Yakin hapus SEMUA data tabungan?\n' +
            'Setelah ini, tidak ada cara untuk mengembalikan.'
        )) {
            return;
        }

        var toast = showUploadToast({
            title: 'Menghapus semua data...',
            subtitle: targets.length + ' target + transaksi + saldo',
            icon: 'trash'
        });

        setTimeout(function () {
            try {
                // =====================================================
                // 1. LOG AKTIVITAS DULU (sebelum dihapus)
                // =====================================================
                if (typeof DeptechStore !== 'undefined' && typeof DeptechStore.logActivity === 'function') {
                    DeptechStore.logActivity({
                        action: 'tabungan_reset',
                        title: 'Tabungan Di-reset Total',
                        description: 'Semua ' + targets.length + ' target + saldo + transaksi dihapus',
                        icon: 'fa-rotate-left',
                        iconType: 'expense'
                    });
                }

                // =====================================================
                // 2. HAPUS TARGETS
                // =====================================================
                localStorage.removeItem('deptech_targets');

                // =====================================================
                // 3. HAPUS TARGET LOGS
                // =====================================================
                localStorage.removeItem('deptech_target_logs');

                // =====================================================
                // 4. RESET BALANCE KE 0
                // =====================================================
                localStorage.setItem('deptech_balance', '0');

                // =====================================================
                // 5. HAPUS SEMUA TRANSAKSI (kategori tabungan + meta.targetId)
                // =====================================================
                try {
                    var transactions = JSON.parse(localStorage.getItem('deptech_transactions') || '[]');
                    var filtered = transactions.filter(function (trx) {
                        // Hapus kalau kategori tabungan
                        if (trx.category === 'tabungan') return false;
                        // Hapus kalau punya meta.targetId
                        if (trx.meta && trx.meta.targetId) return false;
                        // Hapus kalau description mulai dengan "Tabungan:"
                        if (trx.description && trx.description.indexOf('Tabungan:') === 0) return false;
                        return true;
                    });
                    localStorage.setItem('deptech_transactions', JSON.stringify(filtered));
                } catch (e) {
                    console.warn('[Reset] Transactions error:', e);
                }

                // =====================================================
                // 6. HAPUS NOTIF READ
                // =====================================================
                localStorage.removeItem('deptech_notif_read');

                // =====================================================
                // 7. HAPUS TIMESTAMP CACHE
                // =====================================================
                localStorage.removeItem(KEYS.lastSync);
                localStorage.removeItem(KEYS.lastExport);
                localStorage.removeItem(KEYS.lastImport);

                // =====================================================
                // 8. HAPUS BACKUP FILE
                // =====================================================
                localStorage.removeItem('deptech_tabungan_backup');

                // =====================================================
                // 9. HAPUS ACTIVITY LOG KHUSUS TABUNGAN
                // =====================================================
                try {
                    var activities = JSON.parse(localStorage.getItem('deptech_activity_log') || '[]');
                    var filteredActivities = activities.filter(function (act) {
                        // Hapus aktivitas terkait tabungan
                        var actionsToDelete = [
                            'target_create',
                            'target_edit',
                            'target_delete',
                            'tabungan_import',
                            'tabungan_reset',
                            'tabungan_backup',
                            'tabungan_export'
                        ];
                        return actionsToDelete.indexOf(act.action) === -1;
                    });
                    localStorage.setItem('deptech_activity_log', JSON.stringify(filteredActivities));
                } catch (e) {
                    console.warn('[Reset] Activity log error:', e);
                }

                // =====================================================
                // 10. SUKSES
                // =====================================================
                toast.success();

                // Reload setelah 1.8 detik
                setTimeout(function () {
                    window.location.reload();
                }, 1800);

            } catch (err) {
                console.error('[TabunganActions] Reset error:', err);
                toast.error();
            }
        }, 400);
    }

    // =====================================================
    // SYNC — Backup lokal
    // =====================================================
    function syncTabungan() {
        var targets = JSON.parse(localStorage.getItem(KEYS.targets) || '[]');
        var targetLogs = JSON.parse(localStorage.getItem(KEYS.targetLogs) || '[]');

        if (targets.length === 0 && targetLogs.length === 0) {
            if (typeof showError === 'function') {
                showError('Belum ada data untuk di-backup');
            }
            return;
        }

        if (!confirm('Backup data tabungan ke penyimpanan lokal?\n\nBerguna untuk restore jika data utama hilang.')) {
            return;
        }

        var toast = showUploadToast({
            title: 'Menyinkronkan...',
            subtitle: targets.length + ' target · ' + targetLogs.length + ' riwayat',
            icon: 'cloud'
        });

        setTimeout(function () {
            try {
                var backup = {
                    app: 'DepTech',
                    type: 'tabungan-local-backup',
                    version: '1.0',
                    backedAt: new Date().toISOString(),
                    targets: targets,
                    targetLogs: targetLogs
                };

                localStorage.setItem('deptech_tabungan_backup', JSON.stringify(backup));

                saveTimestamp(KEYS.lastSync);
                toast.success();
                updateCardStatus();

                if (typeof DeptechStore !== 'undefined' && typeof DeptechStore.logActivity === 'function') {
                    DeptechStore.logActivity({
                        action: 'tabungan_backup',
                        title: 'Backup Lokal',
                        description: targets.length + ' target di-backup',
                        icon: 'fa-cloud-arrow-up',
                        iconType: 'info'
                    });
                }
            } catch (e) {
                console.error('[TabunganActions] Sync error:', e);
                toast.error();
            }
        }, 400);
    }

    // =====================================================
    // AUTO-SETUP
    // =====================================================
    function setupFileInput() {
        var input = document.getElementById('importTabunganFile');
        if (input && !input.dataset.listenerAttached) {
            input.addEventListener('change', handleImportFile);
            input.dataset.listenerAttached = 'true';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setupFileInput();
            updateCardStatus();
        });
    } else {
        setupFileInput();
        updateCardStatus();
    }

    // =====================================================
    // EXPORT KE WINDOW
    // =====================================================
    return {
        exportTabungan: exportTabungan,
        triggerImportTabungan: triggerImportTabungan,
        resetTabungan: resetTabungan,
        syncTabungan: syncTabungan,
        updateCardStatus: updateCardStatus,
        showUploadToast: showUploadToast,
        formatRelative: formatRelative
    };

})();

// =====================================================
// GLOBAL FUNCTIONS — dipanggil dari HTML onclick
// =====================================================
function exportTabungan() {
    TabunganActions.exportTabungan();
}

function triggerImportTabungan() {
    TabunganActions.triggerImportTabungan();
}

function resetTabungan() {
    TabunganActions.resetTabungan();
}

function syncTabungan() {
    TabunganActions.syncTabungan();
}