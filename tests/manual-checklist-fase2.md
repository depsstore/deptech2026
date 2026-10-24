# DepTech — Manual Test Checklist (Fase 2)

> Jalankan `npx serve` di root project. Buka `http://localhost:3000`.
> **Penting**: test T1 harus di browser yang **belum pernah** dipakai login DepTech (incognito / clear storage).

## T1 — Register user baru (hash password)

- [ ] Buka DevTools → Application → Local Storage → clear all
- [ ] Buka `/src/frontend/pages/profile/account/auth/register.html`
- [ ✅berhasil register dan login tapi setelah login redirect cannot] Register: nama "Test A", email "testa@example.com", password "rahasia123"
- [ ✅] Buka DevTools → Application → Local Storage → key `deptech_users`
- [  ✅] **Ekspektasi**: field `passwordHash` (64 char hex) + `salt` (32 char hex)
- [  ✅] **Ekspektasi**: **TIDAK ADA** field `password` (plaintext)
- [ ✅ berhasil tapi gagal pas ke halaman selanjutnya ] Login sebagai "testa@example.com" → berhasil masuk

## T1b — crypto.subtle tersedia

- [✅ ] Di Console: `typeof crypto.subtle.digest` → **Ekspektasi**: `"function"`
- [ ✅] Register di `http://127.0.0.1:5500` (bukan HTTPS) → **Ekspektasi**: berhasil (localhost diperbolehkan)

## T2 — Login user lama (plaintext) → auto-upgrade hash

**Persiapan**: buat akun manual dengan format lama.

- [ ✅ ] Di Console: 
  ```js
  localStorage.setItem('deptech_users', JSON.stringify([{
    email: 'legacy@example.com',
    password: 'passwordlama',
    name: 'Legacy User',
    createdAt: new Date().toISOString()
  }]));