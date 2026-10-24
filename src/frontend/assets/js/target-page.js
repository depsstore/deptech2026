/* =====================================================
   DEPTECH - TARGET PAGE LOGIC
   Logic untuk halaman: tambah, edit, detail,
   tambah-uang, riwayat, edit-riwayat
===================================================== */

// =====================================================
// UTILITY
// =====================================================
function getUrlParam(key) {
    var params = new URLSearchParams(window.location.search);
    return params.get(key);
}

function redirectTo(page) {
    window.location.href = page;
}

// =====================================================
// HALAMAN: TAMBAH TARGET
// =====================================================
function initTambahPage() {
    document.getElementById('isLimited').value = 'true';
    selectLimit('limited');
}

function submitTarget() {
    var name = document.getElementById('targetName').value.trim();
    var isLimited = document.getElementById('isLimited').value === 'true';
    var targetAmount = isLimited ? parseRupiah(document.getElementById('targetAmount').value) : 0;
    var currentAmount = parseRupiah(document.getElementById('currentAmount').value);
    var deadline = document.getElementById('deadline').value || null;

    if (!name) { showError('Nama target wajib diisi!'); return; }
    if (isLimited && targetAmount <= 0) { showError('Nominal target harus lebih dari 0!'); return; }
    if (isLimited && currentAmount > targetAmount) { showError('Jumlah terkumpul tidak boleh melebihi target!'); return; }

    var data = {
        name: name,
        icon: 'fa-bullseye',
        targetAmount: targetAmount,
        currentAmount: currentAmount,
        deadline: deadline,
        isLimited: isLimited
    };

    var newT = TargetStore.add(data);
    showSuccess('Target berhasil ditambahkan!');

    DeptechStore.logActivity({
        action: 'target_create',
        title: 'Target Baru Dibuat',
        description: '"' + name + '" — Rp' + targetAmount.toLocaleString('id-ID'),
        icon: 'fa-bullseye',
        iconType: 'promo',
        meta: { targetId: newT.id }
    });

    setTimeout(function() {
        redirectTo('index.html');
    }, 800);
}

// =====================================================
// HALAMAN: EDIT TARGET
// =====================================================
function initEditPage() {
    var id = getUrlParam('id');
    if (!id) { showError('ID target tidak ditemukan!'); redirectTo('index.html'); return; }

    var t = TargetStore.getById(id);
    if (!t) { showError('Target tidak ditemukan!'); redirectTo('index.html'); return; }

    document.getElementById('targetId').value = t.id;
    document.getElementById('targetName').value = t.name;
    document.getElementById('targetAmount').value = t.targetAmount;
    document.getElementById('currentAmount').value = t.currentAmount;
    document.getElementById('deadline').value = t.deadline || '';
    selectLimit(t.isLimited ? 'limited' : 'unlimited');
}

function submitEditTarget() {
    var id = document.getElementById('targetId').value;
    var name = document.getElementById('targetName').value.trim();
    var isLimited = document.getElementById('isLimited').value === 'true';
    var targetAmount = isLimited ? parseRupiah(document.getElementById('targetAmount').value) : 0;
    var currentAmount = parseRupiah(document.getElementById('currentAmount').value);
    var deadline = document.getElementById('deadline').value || null;

    if (!name) { showError('Nama target wajib diisi!'); return; }
    if (isLimited && targetAmount <= 0) { showError('Nominal target harus lebih dari 0!'); return; }
    if (isLimited && currentAmount > targetAmount) { showError('Jumlah terkumpul tidak boleh melebihi target!'); return; }

    var data = {
        name: name,
        icon: 'fa-bullseye',
        targetAmount: targetAmount,
        currentAmount: currentAmount,
        deadline: deadline,
        isLimited: isLimited
    };

    TargetStore.update(id, data);
    showSuccess('Target berhasil diperbarui!');

    DeptechStore.logActivity({
        action: 'target_edit',
        title: 'Target Diperbarui',
        description: '"' + name + '"',
        icon: 'fa-pen-to-square',
        iconType: 'info'
    });

    setTimeout(function() {
        redirectTo('index.html');
    }, 800);
}

// =====================================================
// HALAMAN: DETAIL TARGET
// =====================================================
function initDetailPage() {
    var id = getUrlParam('id');
    if (!id) { showError('ID target tidak ditemukan!'); redirectTo('index.html'); return; }

    renderDetailPage(id);
}

function renderDetailPage(id) {
    var container = document.getElementById('detailContent');
    if (!container) return;

    var target = TargetStore.getById(id);
    if (!target) {
        container.innerHTML = '<div class="history-empty"><p>Target tidak ditemukan</p></div>';
        return;
    }

    var progress = hitungProgress(target.currentAmount, target.targetAmount, target.isLimited);
    var limitLabel = target.isLimited ? 'Terbatas' : 'Tidak Terbatas';
    var limitClass = target.isLimited ? 'limited' : 'unlimited';

    var sisa = 0;
    if (target.isLimited && Number(target.targetAmount) > 0) {
        sisa = Number(target.targetAmount) - Number(target.currentAmount);
        if (sisa < 0) sisa = 0;
    }

    var sisaHtml = target.isLimited ?
        '<div class="value">Rp' + sisa.toLocaleString('id-ID') + '</div>' :
        '<div class="value">Tanpa batas</div>';

    var progressHtml = '';
    if (target.isLimited) {
        progressHtml =
            '<div class="progress-section">' +
            '<div class="progress-value">' +
            '<span>Rp' + Number(target.currentAmount).toLocaleString('id-ID') + '</span>' +
            '<span>Rp' + Number(target.targetAmount).toLocaleString('id-ID') + '</span>' +
            '</div>' +
            '<div class="progress-bar">' +
            '<div class="fill" style="width:' + progress + '%"></div>' +
            '</div>' +
            '<div class="progress-percent">' + progress + '% tercapai</div>' +
            '</div>';
    } else {
        progressHtml =
            '<div class="progress-section">' +
            '<div class="progress-value">' +
            '<span>Rp' + Number(target.currentAmount).toLocaleString('id-ID') + '</span>' +
            '<span>terkumpul</span>' +
            '</div>' +
            '</div>';
    }

    container.innerHTML =
        '<div class="detail-card">' +
        '<div class="target-icon"><i class="fa-solid ' + target.icon + '"></i></div>' +
        '<div class="target-name">' + target.name + '</div>' +
        '<div class="target-status"><span class="badge ' + limitClass + '">' + limitLabel + '</span></div>' +
        progressHtml +
        '<div class="info-grid">' +
        '<div class="info-item"><div class="label">Sisa Target</div>' + sisaHtml + '</div>' +
        '<div class="info-item"><div class="label">Deadline</div><div class="value">' + (target.deadline || 'Tanpa deadline') + '</div></div>' +
        '<div class="info-item"><div class="label">Dibuat</div><div class="value">' + formatDate(target.createdAt) + '</div></div>' +
        '<div class="info-item"><div class="label">Status</div><div class="value">' +
        (target.isLimited && progress >= 100 ? 'Selesai' : 'Berjalan') +
        '</div></div>' +
        '</div>' +
        '<div class="action-buttons">' +
        '<button class="btn btn-secondary" onclick="redirectTo(\'riwayat.html?id=' + target.id + '\')">' +
        '<i class="fa-solid fa-clock-rotate-left"></i> Riwayat' +
        '</button>' +
        '<button class="btn btn-primary" onclick="redirectTo(\'tambah-uang.html?id=' + target.id + '\')">' +
        '<i class="fa-solid fa-plus"></i> Tambah Uang' +
        '</button>' +
        '<button class="btn btn-danger" onclick="deleteTargetFromDetail(\'' + target.id + '\')">' +
        '<i class="fa-regular fa-trash-can"></i>' +
        '</button>' +
        '</div>' +
        '</div>';
}

function deleteTargetFromDetail(id) {
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

    DeptechStore.logActivity({
        action: 'target_delete',
        title: 'Target Dihapus',
        description: '"' + t.name + '" beserta semua data terkait',
        icon: 'fa-trash-can',
        iconType: 'expense'
    });

    setTimeout(function() {
        redirectTo('index.html');
    }, 800);
}

// =====================================================
// HALAMAN: TAMBAH UANG
// =====================================================
function initTambahUangPage() {
    var id = getUrlParam('id');
    if (!id) { showError('ID target tidak ditemukan!'); redirectTo('index.html'); return; }

    var t = TargetStore.getById(id);
    if (!t) { showError('Target tidak ditemukan!'); redirectTo('index.html'); return; }

    document.getElementById('addMoneyTargetId').value = t.id;
    document.getElementById('targetInfoName').textContent = t.name;
}

function submitAddMoney() {
    var id = document.getElementById('addMoneyTargetId').value;
    var amount = parseRupiah(document.getElementById('addMoneyAmount').value);
    var note = document.getElementById('addMoneyNote').value.trim();

    if (amount <= 0) {
        showError('Nominal tidak valid!');
        return;
    }

    TargetStore.addSavings(id, amount, note);
    showSuccess('Rp' + amount.toLocaleString('id-ID') + ' ditambahkan ke target!');

    setTimeout(function() {
        redirectTo('detail.html?id=' + id);
    }, 800);
}

// =====================================================
// HALAMAN: RIWAYAT
// =====================================================
function initRiwayatPage() {
    var id = getUrlParam('id');
    if (!id) { showError('ID target tidak ditemukan!'); redirectTo('index.html'); return; }

    var t = TargetStore.getById(id);
    if (!t) { showError('Target tidak ditemukan!'); redirectTo('index.html'); return; }

    document.getElementById('historyTargetId').value = t.id;
    document.getElementById('historyTargetName').textContent = t.name;

    renderHistoryPage(id);
}

function renderHistoryPage(targetId) {
    var container = document.getElementById('historyList');
    if (!container) return;

    var logs = TargetStore.getLogs(targetId);

    if (logs.length === 0) {
        container.innerHTML =
            '<div class="history-empty">' +
            '<i class="fa-regular fa-clock"></i>' +
            '<p>Belum ada riwayat transaksi</p>' +
            '</div>';
        return;
    }

    var html = '';
    logs.forEach(function(log) {
        var isIn = log.type === 'in';
        var sign = isIn ? '+' : '-';
        var cls = isIn ? 'in' : 'out';
        var dateStr = new Date(log.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        html +=
            '<div class="history-item">' +
            '<div class="history-icon ' + cls + '">' +
            '<i class="fa-solid ' + (isIn ? 'fa-arrow-down' : 'fa-arrow-up') + '"></i>' +
            '</div>' +
            '<div class="history-info">' +
            '<div class="history-top">' +
            '<span class="history-amount ' + cls + '">' + sign + ' Rp' + Number(log.amount).toLocaleString('id-ID') + '</span>' +
            '<span class="history-date">' + dateStr + '</span>' +
            '</div>' +
            (log.note ? '<div class="history-note">' + log.note + '</div>' : '') +
            '</div>' +
            '<div class="history-actions">' +
            '<button class="history-btn edit" onclick="redirectTo(\'edit-riwayat.html?logId=' + log.id + '&targetId=' + targetId + '\')" title="Edit">' +
            '<i class="fa-regular fa-pen-to-square"></i>' +
            '</button>' +
            '<button class="history-btn delete" onclick="deleteLogFromHistory(\'' + log.id + '\', \'' + targetId + '\')" title="Hapus">' +
            '<i class="fa-regular fa-trash-can"></i>' +
            '</button>' +
            '</div>' +
            '</div>';
    });

    container.innerHTML = html;
}

function deleteLogFromHistory(logId, targetId) {
    if (!confirm('Hapus riwayat transaksi ini? Saldo target akan disesuaikan.')) return;

    TargetStore.deleteLog(logId);
    showSuccess('Riwayat dihapus!');
    renderHistoryPage(targetId);
}

// =====================================================
// HALAMAN: EDIT RIWAYAT
// =====================================================
function initEditRiwayatPage() {
    var logId = getUrlParam('logId');
    var targetId = getUrlParam('targetId');

    if (!logId) { showError('ID riwayat tidak ditemukan!'); redirectTo('index.html'); return; }
    if (!targetId) { showError('ID target tidak ditemukan!'); redirectTo('index.html'); return; }

    var log = TargetStore.getLogById(logId);
    if (!log) { showError('Riwayat tidak ditemukan!'); redirectTo('riwayat.html?id=' + targetId); return; }

    document.getElementById('editLogId').value = log.id;
    document.getElementById('editLogTargetId').value = targetId;
    document.getElementById('editLogAmount').value = log.amount;
    document.getElementById('editLogNote').value = log.note || '';
}

function submitEditLog() {
    var logId = document.getElementById('editLogId').value;
    var targetId = document.getElementById('editLogTargetId').value;
    var amount = parseRupiah(document.getElementById('editLogAmount').value);
    var note = document.getElementById('editLogNote').value.trim();

    if (amount <= 0) {
        showError('Nominal tidak valid!');
        return;
    }

    TargetStore.updateLog(logId, amount, note);
    showSuccess('Riwayat berhasil diperbarui!');

    setTimeout(function() {
        redirectTo('riwayat.html?id=' + targetId);
    }, 800);
}