# DepTech — Manual Test Checklist (Fase 1)
✅ ❌ ⚠️ 
> **Cara pakai:** jalankan `npx serve` atau `python -m http.server 3000` dari root project.
> Buka `http://127.0.0.1:5500`. Jangan buka via `file://` (path absolute `/src/...` akan gagal).

## Fase 1 — Bug Fix & Integrasi Produk

### T4 — product/index.html tidak ReferenceError

- [ ] Buka `http://127.0.0.1:5500/src/frontend/pages/product/index.html`
- [ ] Buka DevTools Console
- [✅] **Ekspektasi**: Tidak ada `ReferenceError: ProductsAPI is not defined`
- [⚠️Knp tidak dari api backend] **Ekspektasi**: Tidak ada `ProductsAPI is undefined`
- [⚠️muncul yg dummy] **Ekspektasi**: Log `[ProductsAPI v2] Loaded — mode: static data (14 produk)`
- [✅] **Ekspektasi**: Grid menampilkan 14 produk
- [✅] **Ekspektasi**: Counter "14 produk" muncul di toolbar

### T5 — product/detail.html tidak crash

- [ ] Buka `http://127.0.0.1:5500/src/frontend/pages/product/detail.html?id=pulsa-10k`
- [ ] Buka DevTools Console
- [✅] **Ekspektasi**: Tidak ada `Maximum call stack size exceeded`
- [✅] **Ekspektasi**: Nama produk "Pulsa Telkomsel 10.000" tampil
- [✅] **Ekspektasi**: Harga "Rp11.000" tampil
- [✅] **Ekspektasi**: Rating & stok tampil
- [✅] **Ekspektasi**: Rekomendasi produk tampil (4 item)
- [✅] Klik deskripsi "lihat selengkapnya" → deskripsi expand
- [✅] Klik "sembunyikan" → deskripsi collapse

### T5b — product/detail.html saat API gagal (simulasi)

- [ ] Buka `detail.html?id=produk-tidak-ada`
- [✅] **Ekspektasi**: "Produk tidak ditemukan" tampil (bukan crash)
- [✅] **Ekspektasi**: Tidak ada error di Console

- [✅] Di DevTools Console, jalankan: `ProductsAPI.getAll = () => Promise.reject(new Error('Test error'))`
- [✅] Refresh halaman
- [✅] **Ekspektasi**: Toast error muncul
- [✅] **Ekspektasi**: Pesan "Gagal memuat produk" + tombol "Coba Lagi" tampil
- [✅] **Ekspektasi**: **Tidak ada** `Maximum call stack size exceeded`

### T6 — Pencarian & filter kategori

- [ ] Buka `product/index.html`
- [✅] Ketik "pulsa" di search → **Ekspektasi**: hanya produk pulsa muncul (2 produk)
- [✅] Hapus search → semua produk kembali
- [✅] Klik tab "game" → **Ekspektasi**: hanya produk game (2 produk)
- [✅] Klik tab "rumah" → **Ekspektasi**: 2 produk rumah
- [✅] Klik tab "elektronik" → **Ekspektasi**: 2 produk elektronik
- [✅] Cek Console: tidak ada error
- [✅] **Ekspektasi**: Hanya ada **satu** handler aktif (bukan duplikasi) — search & filter responsif

### T6b — Empty state informatif

- [✅] Cari "xyz-tidak-ada" → **Ekspektasi**: "Tidak ada produk untuk 'xyz-tidak-ada'"
- [ ✅] Klik tab "fashion" lalu cari "pulsa" → **Ekspektasi**: empty state muncul
- [✅ ] Tidak ada layout shift yang aneh

### T7 — Toast queue (H-03)

- [ ✅ ] Buka halaman apa saja yang load `global.js`
- [ ✅ ] Di Console, jalankan cepat berturut-turut:
  ```js
  showSuccess('Test sukses 1');
  showError('Test error 1');
  showToast('Test default 1');