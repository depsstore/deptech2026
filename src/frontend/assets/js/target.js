/* =====================================================
   DEPTECH - TARGET LOGIC
   Store, CRUD, Utility — versi halaman (tanpa modal)
===================================================== */

var currentView = 'grid';

// =====================================================
// UTILITY
// =====================================================
function parseRupiah(val) {
    return parseInt(String(val).replace(/[^\d]/g, ''), 10) || 0;
}

function hitungProgress(currentAmount, targetAmount, isLimited) {
    var cur = Number(currentAmount) || 0;
    var tgt = Number(targetAmount) || 0;
    if (!isLimited || tgt <= 0) return 0;

    var progress = Math.floor((cur / tgt) * 100);
    if (progress < 1 && cur > 0) progress = 1;
    if (progress > 100) progress = 100;
    return progress;
}

// =====================================================
// DATE FORMAT (untuk deadline card target)
// =====================================================
function formatDateShort(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var day = d.getDate();
    var month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()];
    var year = d.getFullYear();
    return day + ' ' + month + ' ' + year;
}

// =====================================================
// TARGET STORE — wrapper ke DeptechStore
// =====================================================
var TargetStore = {
    getAll: function () {
        return DeptechStore.getTargets();
    },
    getById: function (id) {
        return DeptechStore.getTargetById(id);
    },
    add: function (data) {
        return DeptechStore.addTarget(data);
    },
    update: function (id, data) {
        return DeptechStore.updateTarget(id, data);
    },
    remove: function (id) {
        DeptechStore.deleteTarget(id);
    },
    addSavings: function (id, amount, note) {
        return DeptechStore.addTargetSavings(id, amount, note);
    },
    getLogs: function (id) {
        return DeptechStore.getTargetLogs(id);
    },
    addLog: function (id, type, amount, note) {
        DeptechStore.addTargetLog(id, type, amount, note);
    },
    getLogById: function (logId) {
        var logs = DeptechStore.getTargetLogs();
        for (var i = 0; i < logs.length; i++) {
            if (String(logs[i].id) === String(logId)) return logs[i];
        }
        return null;
    },
    updateLog: function (logId, amount, note) {
        var logs = DeptechStore.getTargetLogs();
        for (var i = 0; i < logs.length; i++) {
            if (String(logs[i].id) === String(logId)) {
                var diff = Number(amount) - Number(logs[i].amount);
                logs[i].amount = Number(amount);
                logs[i].note = note || '';
                localStorage.setItem(DeptechStore.KEYS.targetLogs, JSON.stringify(logs));

                var t = DeptechStore.getTargetById(logs[i].targetId);
                if (t) {
                    if (logs[i].type === 'in') {
                        t.currentAmount += diff;
                    } else {
                        t.currentAmount -= diff;
                    }
                    if (t.currentAmount < 0) t.currentAmount = 0;
                    DeptechStore.updateTarget(t.id, t);
                }
                return logs[i];
            }
        }
        return null;
    },
    deleteLog: function (logId) {
        DeptechStore.deleteTargetLog(logId);
    }
};

// =====================================================
// SELECT LIMIT TOGGLE (dipakai di tambah.html & edit.html)
// =====================================================
function selectLimit(value) {
    var isLimited = value === 'limited';
    var isLimitedEl = document.getElementById('isLimited');
    if (isLimitedEl) isLimitedEl.value = isLimited ? 'true' : 'false';

    var amountGroup = document.getElementById('groupTargetAmount');
    if (amountGroup) {
        if (isLimited) {
            amountGroup.style.display = '';
        } else {
            amountGroup.style.display = 'none';
            var amtEl = document.getElementById('targetAmount');
            if (amtEl) amtEl.value = '';
        }
    }

    // Sync radio checked (untuk saat dipanggil dari initEditPage)
    var radio = document.querySelector('input[name="jenis"][value="' + value + '"]');
    if (radio) radio.checked = true;
}

// =====================================================
// DELETE TARGET (dipakai di index.html)
// =====================================================
function deleteTarget(id) {
    var t = TargetStore.getById(id);
    if (!t) return;

    var msg = 'Hapus target "' + t.name + '"?\n\n' +
              'Semua data terkait akan dihapus:\n' +
              '• Saldo target\n' +
              '• Transaksi tabungan\n' +
              '• Riwayat tabungan\n\n' +
              'Tindakan ini tidak bisa dibatalkan!';

    if (!confirm(msg)) return;

    TargetStore.remove(id);
    showSuccess('Target "' + t.name + '" berhasil dihapus!');
    renderTargets();

    DeptechStore.logActivity({
        action: 'target_delete',
        title: 'Target Dihapus',
        description: '"' + t.name + '" beserta semua data terkait',
        icon: 'fa-trash-can',
        iconType: 'expense'
    });
}

// =====================================================
// RENDER LIST TARGET (index.html)
// =====================================================
function renderTargets() {
    var container = document.getElementById('targetContainer');
    if (!container) return;

    var list = TargetStore.getAll();

    if (list.length === 0) {
        container.innerHTML =
            '<div class="empty-state">' +
            '<i class="fa-regular fa-folder-open"></i>' +
            '<h3>Belum ada target</h3>' +
            '<p>Buat target pertamamu dan mulai menabung.</p>' +
            '<a href="tambah.html" class="btn-primary">' +
            '<i class="fa-solid fa-plus"></i>' +
            '<span>Buat Target</span>' +
            '</a>' +
            '</div>';
        return;
    }

    var gridClass = currentView === 'grid' ? 'target-grid' : 'target-list';
    var html = '<div class="' + gridClass + '">';

    list.forEach(function (t) {
        var progress = hitungProgress(t.currentAmount, t.targetAmount, t.isLimited);

        var limitLabel = t.isLimited ? 'Terbatas' : 'Tidak Terbatas';
        var limitClass = t.isLimited ? 'limited' : 'unlimited';

        var percentHtml = t.isLimited ?
            '<span class="percent">' + progress + '%</span>' :
            '<span class="percent">∞</span>';

        var progressBarHtml = t.isLimited ?
            '<div class="mini-progress">' +
            '<div class="fill" style="width:' + progress + '%"></div>' +
            '</div>' :
            '';

        var amountHtml = t.isLimited ?
            '<span class="amount-target">/ Rp' + Number(t.targetAmount).toLocaleString('id-ID') + '</span>' :
            '<span class="amount-target">terkumpul</span>';

        html +=
            '<div class="target-item">' +
            '<div class="target-row" onclick="window.location.href=\'detail.html?id=' + t.id + '\'">' +
            '<div class="small-target-icon">' +
            '<i class="fa-solid ' + t.icon + '"></i>' +
            '</div>' +
            '<div class="target-item-content">' +
            '<div class="target-top">' +
            '<span class="name">' + t.name + '</span>' +
            percentHtml +
            '</div>' +
            progressBarHtml +
            '<div class="target-bottom">' +
            '<div class="amount-group">' +
            '<span class="amount-current">Rp' + Number(t.currentAmount).toLocaleString('id-ID') + '</span>' +
            amountHtml +
            '</div>' +
            '<span class="deadline">' +
            (t.deadline
                ? '<i class="fa-regular fa-calendar"></i> ' + formatDateShort(t.deadline)
                : 'Tanpa deadline') +
            '</span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="target-actions-row">' +
            '<a href="tambah-uang.html?id=' + t.id + '" class="tac tac-add" title="Tambah Uang">' +
            '<i class="fa-solid fa-plus"></i><span>Tambah</span>' +
            '</a>' +
            '<a href="riwayat.html?id=' + t.id + '" class="tac tac-history" title="Riwayat">' +
            '<i class="fa-solid fa-clock-rotate-left"></i><span>Riwayat</span>' +
            '</a>' +
            '<a href="edit.html?id=' + t.id + '" class="tac tac-edit" title="Edit Target">' +
            '<i class="fa-regular fa-pen-to-square"></i>' +
            '</a>' +
            '<button class="tac tac-delete" onclick="deleteTarget(\'' + t.id + '\')" title="Hapus Target">' +
            '<i class="fa-regular fa-trash-can"></i>' +
            '</button>' +
            '</div>' +
            '<div class="target-footer">' +
            '<span class="badge ' + limitClass + '">' + limitLabel + '</span>' +
            '</div>' +
            '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
}

// =====================================================
// VIEW TOGGLE (grid / list)
// =====================================================
function setView(view) {
    currentView = view;
    var buttons = document.querySelectorAll('#viewToggle button');
    buttons.forEach(function (btn) {
        btn.classList.remove('active');
        if (btn.dataset.view === view) btn.classList.add('active');
    });
    renderTargets();
}