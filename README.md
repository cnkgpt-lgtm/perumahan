# SISTER — Sistem Informasi Cluster

Papan informasi lingkungan dan buku iuran untuk cluster/perumahan, dibangun dengan **Next.js 15 + Tailwind CSS v4 + Prisma/PostgreSQL + NextAuth v5**. Siap deploy ke Vercel.

- **Warga (tanpa login)**: pengumuman, berita, kegiatan, status iuran per rumah, buku kas transparan, kuitansi digital, pembayaran online (QRIS dinamis / transfer + kode unik otomatis), serta cek status pengajuan.
- **Pengurus (login di `/masuk`)**: mencatat pembayaran iuran (tunai / transfer), memeriksa bukti bayar (terima penuh / sebagian / tolak), kirim kuitansi ke WhatsApp warga, kelola kabar, data rumah & penghuni dengan OCR Kartu Keluarga, jenis iuran, pengeluaran kas, rekening/QRIS, dan akun pengurus.

## Fitur Utama

- 📢 **Papan Informasi Warga**: pengumuman (pin + popup), berita, agenda kegiatan, tombol bagikan ke WhatsApp.
- 💳 **Pembayaran Online & QRIS**: QRIS dinamis per nominal (dari payload statis), transfer bank, kode unik 3 digit otomatis per rumah, unggah bukti bayar, verifikasi pengurus.
- 🧾 **Kuitansi Digital**: nomor otomatis (`SIST-YYYYMM-XXXX`), nominal terbilang, stempel "✓ LUNAS", siap cetak/PDF.
- 💬 **Integrasi WhatsApp**: kirim kuitansi via WA, pengingat iuran, salin rekap kas untuk grup WA.
- 👨‍👩‍👧‍👦 **Pendataan Penghuni & OCR KK**: rekap anggota keluarga per rumah + scan Kartu Keluarga otomatis (tesseract.js, di browser).
- 📊 **Transparansi Kas**: buku kas umum + saldo berjalan, ekspor CSV.
- 📱 **REST API**: endpoint publik & admin + dokumentasi interaktif di `/docs/api`.

## Setup Lokal

```sh
npm install
cp .env.example .env   # isi DATABASE_URL, DIRECT_URL, AUTH_SECRET, ADMIN_*
npx prisma migrate dev
npx prisma db seed     # membuat akun admin dari ADMIN_*
npm run dev
```

Buka http://localhost:3000 — login pengurus di `/masuk`.

## Deploy

Lihat [DEPLOY.md](DEPLOY.md) untuk panduan lengkap deploy ke Vercel (GitHub → Vercel → Neon).

## Struktur

```
src/app/(publik)/   halaman warga: beranda, kabar, iuran, kas, kuitansi, bayar
src/app/admin/       panel pengurus
src/app/api/v1/      REST API + /api/v1/openapi.json
src/app/docs/api/    dokumentasi API (Scalar)
src/lib/             db, format, ledger, qris, settings
prisma/              schema + seed
```

## Kredit

Dibangun ulang dari [Kabar Warga](https://github.com/rizalahmaddd/kabarwarga) (Laravel) ke stack Next.js, dengan tampilan yang dipertahankan.
