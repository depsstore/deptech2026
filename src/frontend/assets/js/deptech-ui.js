/* =====================================================
   DEPTECH UI — Canvas & Toggle Mata
   Reusable untuk semua halaman
===================================================== */

// =====================================================
// CANVAS BACKGROUND — ikut tema (light/dark) & accent
// =====================================================
(function () {
    var canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');

    function getCssVar(name, fallback) {
        var val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return val || fallback;
    }

    function isDark() {
        return document.documentElement.classList.contains('dark-mode') ||
               document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function draw() {
        var dpr = window.devicePixelRatio || 1;
        var w = window.innerWidth;
        var h = window.innerHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var dark = isDark();
        var bgTop = getCssVar('--bg-canvas-top', dark ? '#1e293b' : '#2563eb');
        var bgBottom = getCssVar('--bg-canvas-bottom', dark ? '#0f172a' : '#f8faff');

        // Latar bawah
        ctx.fillStyle = dark ? '#0f172a' : '#f8faff';
        ctx.fillRect(0, 0, w, h);

        // Gradient atas — ikut accent
        var gradTop = ctx.createLinearGradient(0, 0, w, h * 0.4);
        gradTop.addColorStop(0, bgTop);
        gradTop.addColorStop(0.6, bgTop);
        gradTop.addColorStop(1, dark ? bgTop : '#1d4ed8');

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(w, h * 0.28);
        ctx.quadraticCurveTo(w * 0.5, h * 0.42, 0, h * 0.32);
        ctx.closePath();
        ctx.fillStyle = gradTop;
        ctx.fill();

        // Dekorasi lingkaran
        ctx.beginPath();
        ctx.arc(w * 0.9, h * 0.08, 90, 0, Math.PI * 2);
        ctx.fillStyle = dark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(255, 255, 255, 0.07)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(w * 0.1, h * 0.22, 50, 0, Math.PI * 2);
        ctx.fillStyle = dark ? 'rgba(148, 163, 184, 0.03)' : 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
    }

    draw();
    window.addEventListener('resize', draw);

    // Redraw saat tema berubah
    window.addEventListener('deptech:theme-changed', draw);

    // Fallback: MutationObserver untuk perubahan class dark-mode
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            if (m.attributeName === 'class' || m.attributeName === 'data-theme') {
                draw();
            }
        });
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme', 'data-accent']
    });

    // Redraw saat accent berubah (setelah style di-apply)
    setTimeout(draw, 100);
})();

// =====================================================
// TOGGLE MATA (GLOBAL)
// =====================================================
(function () {
    document.querySelectorAll('[data-value]').forEach(function (el) {
        var key = el.dataset.value;
        if (key) el.dataset.original = el.textContent.trim();
    });

    document.querySelectorAll('.eye-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var key = this.dataset.eye;
            var valueEl = document.querySelector('[data-value="' + key + '"]');
            var targetEl = document.querySelector('[data-target="' + key + '"]');
            var sisaEl = document.querySelector('[data-sisa="' + key + '"]');
            var icon = this.querySelector('i');

            var isHidden = this.classList.toggle('hidden');

            if (valueEl) {
                if (isHidden) {
                    valueEl.dataset.original = valueEl.textContent.trim();
                    valueEl.textContent = 'Rp ••••••';
                    valueEl.classList.add('hidden-value');
                } else {
                    if (valueEl.dataset.original) {
                        valueEl.textContent = valueEl.dataset.original;
                    }
                    valueEl.classList.remove('hidden-value');
                }
            }

            if (targetEl) {
                if (isHidden) {
                    targetEl.dataset.original = targetEl.textContent.trim();
                    targetEl.textContent = '/ Rp ••••••';
                    targetEl.classList.add('hidden-value');
                } else {
                    if (targetEl.dataset.original) {
                        targetEl.textContent = targetEl.dataset.original;
                    }
                    targetEl.classList.remove('hidden-value');
                }
            }

            if (sisaEl) {
                if (isHidden) {
                    sisaEl.dataset.original = sisaEl.innerHTML;
                    sisaEl.innerHTML = '<i class="fa-solid fa-coins"></i> Sisa Rp ••••••';
                    sisaEl.classList.add('hidden-value');
                } else {
                    if (sisaEl.dataset.original) {
                        sisaEl.innerHTML = sisaEl.dataset.original;
                    }
                    sisaEl.classList.remove('hidden-value');
                }
            }

            if (icon) {
                icon.className = isHidden ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
            }
        });
    });
})();