/* =====================================================
   DEPTECH - GLOBAL JAVASCRIPT
   Utility dasar untuk seluruh aplikasi
===================================================== */

// =====================================================
// TOAST — dengan queue untuk cegah race condition
// =====================================================
var _toastTimer = null;
var _toastQueue = [];
var _toastActive = false;

/**
 * Internal: tampilkan toast dengan tipe tertentu.
 * Semua toast baru akan menunggu toast sebelumnya selesai.
 *
 * @param {string} message
 * @param {'default'|'error'|'success'} type
 * @param {number} durationMs
 */
function _showToast(message, type, durationMs) {
    _toastQueue.push({ message: message, type: type || 'default', duration: durationMs || 2200 });
    if (!_toastActive) _processToastQueue();
}

function _processToastQueue() {
    if (_toastQueue.length === 0) {
        _toastActive = false;
        return;
    }
    _toastActive = true;
    var item = _toastQueue.shift();

    var toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    // ✅ Reset class eksplisit — tidak ada "nyangkut" dari toast sebelumnya
    toast.className = 'toast';

    var prefix = '';
    if (item.type === 'error') {
        prefix = '❌ ';
        toast.classList.add('toast-error');
    } else if (item.type === 'success') {
        prefix = '✅ ';
        toast.classList.add('toast-success');
    }

    toast.textContent = prefix + item.message;

    // Force reflow supaya transisi `.show` selalu trigger
    void toast.offsetWidth;
    toast.classList.add('show');

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function() {
        toast.classList.remove('show');
        // Tunggu transisi selesai, baru lanjut ke queue berikutnya
        setTimeout(function() {
            toast.className = 'toast';
            _processToastQueue();
        }, 260);
    }, item.duration);
}

// =====================================================
// PUBLIC TOAST API
// =====================================================
function showToast(message) {
    _showToast(message, 'default', 2200);
}

function showError(message) {
    _showToast(message || 'Terjadi kesalahan!', 'error', 3000);
}

function showSuccess(message) {
    _showToast(message || 'Berhasil!', 'success', 2500);
}

function showNetworkError() {
    showError('Koneksi internet bermasalah! Periksa jaringan Anda.');
}

function showServerError() {
    showError('Server sedang sibuk. Silakan coba beberapa saat lagi.');
}

// =====================================================
// ESCAPE HTML (helper global)
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
// LOADING (tidak berubah)
// =====================================================
function showLoading(message) {
    var overlay = document.getElementById('loadingOverlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML =
            '<div class="loading-content">' +
            '<img src="../../../assets/img/brandnolatar.png" alt="DepTech" class="loading-logo logo-blue">' +
            '<div class="loading-spinner"></div>' +
            '<p class="loading-text">' + (message || 'Memproses...') + '</p>' +
            '</div>';
        document.body.appendChild(overlay);
    } else {
        var textEl = overlay.querySelector('.loading-text');
        if (textEl) textEl.textContent = message || 'Memproses...';
        overlay.style.display = 'flex';
    }

    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    var overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// =====================================================
// NAVIGASI (dengan normalisasi URL)
// =====================================================
function navigateTo(page) {
    if (!page) return;
    // Normalisasi: jangan biarkan user kirim "javascript:" atau "data:"
    var lower = String(page).trim().toLowerCase();
    if (lower.indexOf('javascript:') === 0 || lower.indexOf('data:') === 0) {
        console.error('[navigateTo] URL tidak diizinkan:', page);
        return;
    }
    window.location.href = page;
}

function goBack() {
    window.history.back();
}

// =====================================================
// FORMAT RUPIAH (tidak berubah)
// =====================================================
function formatRupiah(amount) {
    return 'Rp' + Number(amount).toLocaleString('id-ID');
}

function formatRupiahShort(amount) {
    amount = Number(amount) || 0;
    if (amount >= 1000000000) return 'Rp' + (amount / 1000000000).toFixed(1) + 'M';
    if (amount >= 1000000) return 'Rp' + (amount / 1000000).toFixed(1) + 'Jt';
    if (amount >= 1000) return 'Rp' + (amount / 1000).toFixed(0) + 'K';
    return 'Rp' + amount.toLocaleString('id-ID');
}

// =====================================================
// DATE UTILITY (tidak berubah)
// =====================================================
function getToday() {
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateString) {
    var date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    var date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// =====================================================
// UTILITY (tidak berubah)
// =====================================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
        var context = this;
        var args = arguments;
        var later = function() {
            clearTimeout(timeout);
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =====================================================
// TOGGLE BALANCE (tidak berubah)
// =====================================================
var balanceVisible = true;

function toggleBalance(element) {
    var balanceEl = document.getElementById('balance');
    if (!balanceEl) return;

    var real = 0;
    if (typeof DeptechStore !== 'undefined') {
        real = DeptechStore.getBalance();
    }

    balanceVisible = !balanceVisible;
    if (balanceVisible) {
        balanceEl.textContent = 'Rp' + real.toLocaleString('id-ID');
        if (element) element.innerHTML = '<i class="fa-regular fa-eye"></i>';
    } else {
        balanceEl.textContent = 'Rp ••••••';
        if (element) element.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
    }
}

// =====================================================
// WISHLIST TOGGLE (fallback global — tidak berubah)
// =====================================================
function toggleWishlist(btn) {
    var icon = btn.querySelector('i');
    var isLiked = icon.classList.contains('fa-solid');

    if (isLiked) {
        icon.className = 'fa-regular fa-heart';
        btn.classList.remove('liked');
        showToast('Dihapus dari wishlist');
    } else {
        icon.className = 'fa-solid fa-heart';
        btn.classList.add('liked');
        showToast('Ditambahkan ke wishlist');
    }
}

// =====================================================
// WEB NOTIFICATION (tidak berubah)
// =====================================================
function mintaIzinNotif() {
    if (typeof DeviceNotif === 'undefined') {
        showError('Notifikasi tidak didukung di browser ini');
        return;
    }

    if (!DeviceNotif.isSupported()) {
        showError('Browser Anda tidak mendukung notifikasi');
        return;
    }

    var current = DeviceNotif.getPermission();

    if (current === 'granted') {
        showSuccess('Notifikasi sudah aktif');
        DeviceNotif.show('Notifikasi Aktif', {
            body: 'Anda akan menerima notifikasi dari DepTech',
            tag: 'test'
        });
        return;
    }

    if (current === 'denied') {
        showError('Notifikasi diblokir. Aktifkan di pengaturan browser.');
        return;
    }

    DeviceNotif.requestPermission().then(function(result) {
        if (result === 'granted') {
            showSuccess('Notifikasi diaktifkan');
            setTimeout(function() {
                DeviceNotif.show('Notifikasi Aktif', {
                    body: 'Anda akan menerima notifikasi dari DepTech',
                    tag: 'welcome'
                });
            }, 800);
        } else if (result === 'denied') {
            showError('Notifikasi diblokir. Aktifkan di pengaturan browser.');
        } else {
            showToast('Izin notifikasi tidak diberikan');
        }
    });
}