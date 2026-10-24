/* =====================================================
   DEPTECH - AVATAR HELPER
   Render avatar di mana saja (konsisten)
===================================================== */

var AvatarHelper = (function () {
    'use strict';

    // =====================================================
    // RENDER AVATAR KE ELEMENT
    // =====================================================
    function render(element) {
        if (!element) return;
        if (typeof DeptechStore === 'undefined') return;

        var avatar = DeptechStore.getAvatarDisplay();

        // Reset dulu
        element.innerHTML = '';
        element.style.backgroundImage = '';
        element.style.backgroundSize = '';
        element.style.backgroundPosition = '';
        element.style.backgroundRepeat = '';

        if (avatar.type === 'photo' && avatar.value) {
            // Foto — pakai <img> biar bisa fallback kalau gagal load
            var img = document.createElement('img');
            img.src = avatar.value;
            img.alt = 'Avatar';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = 'inherit';

            img.onerror = function () {
                // Kalau foto gagal load, fallback ke huruf
                var user = DeptechStore.getUser();
                var letter = (user && user.name) ? user.name.charAt(0).toUpperCase() : '?';
                element.innerHTML = '';
                element.textContent = letter;
            };

            element.appendChild(img);
        } else {
            // Huruf
            element.textContent = avatar.value || '?';
        }
    }

    // =====================================================
    // AUTO-RENDER SEMUA ELEMEN DENGAN data-avatar
    // =====================================================
    function renderAll() {
        document.querySelectorAll('[data-avatar]').forEach(function (el) {
            render(el);
        });
    }

    // =====================================================
    // SET AVATAR (dari halaman pilih avatar)
    // =====================================================
    function setLetter(letter) {
        letter = String(letter || '?').toUpperCase().charAt(0);
        if (typeof DeptechStore !== 'undefined') {
            DeptechStore.setAvatar({ type: 'letter', value: letter });
        }
    }

    function setPhoto(dataUrl) {
        if (typeof DeptechStore !== 'undefined') {
            DeptechStore.setAvatar({ type: 'photo', value: dataUrl });
        }
    }

    function reset() {
        if (typeof DeptechStore !== 'undefined') {
            DeptechStore.clearAvatar();
        }
    }

    // =====================================================
    // AUTO-INIT
    // =====================================================
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderAll);
        } else {
            renderAll();
        }
    }

    init();

    // =====================================================
    // EXPORT
    // =====================================================
    return {
        render: render,
        renderAll: renderAll,
        setLetter: setLetter,
        setPhoto: setPhoto,
        reset: reset
    };

})();