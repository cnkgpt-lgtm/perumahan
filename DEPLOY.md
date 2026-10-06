# Panduan Deploy SISTER ke Vercel

Panduan ini membawa aplikasi **SISTER — Sistem Informasi Cluster** dari folder ini sampai live di Vercel.

**Yang dibutuhkan:**
1. Akun GitHub
2. Akun Vercel (login dengan GitHub)
3. Database PostgreSQL gratis — pilih salah satu:
   - [Neon](https://neon.tech) (disarankan, gratis, cepat), atau
   - [Supabase](https://supabase.com) (pakai *Connection string* mode Session/pooler)

> SISTER menyimpan semua gambar (bukti bayar, foto kabar, QRIS, KK) langsung di database, jadi tidak butuh layanan penyimpanan file tambahan.

---

## Langkah 1 — Push ke GitHub

```bash
cd sister
git init
git add .
git commit -m "SISTER v1.0 - Sistem Informasi Cluster"
git branch -M main
git remote add origin https://github.com/USERNAME/sister.git
git push -u origin main
```

> Ganti `USERNAME` dengan username GitHub Anda. Buat repository kosong dulu di github.com/new (jangan centang "Add a README").

## Langkah 2 — Import ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new), pilih repository `sister` → **Import**.
2. Framework Preset otomatis terdeteksi **Next.js**. Biarkan default.
3. **Jangan deploy dulu** — isi Environment Variables dulu (langkah 3).

## Langkah 3 — Environment Variables

Di halaman import (atau **Settings → Environment Variables**), isi:

| Nama | Wajib | Contoh / Cara isi |
|---|---|---|
| `DATABASE_URL` | Ya | Connection string Postgres dari Neon/Supabase (pakai yang pooler) |
| `DIRECT_URL` | Ya | Connection string langsung (tanpa pooler) — untuk migrasi |
| `AUTH_SECRET` | Ya | String acak 32+ karakter. Generate: `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Ya | Email login pengurus pertama, mis. `admin@cluster.id` |
| `ADMIN_NAME` | Ya | Nama pengurus, mis. `Pengurus` |
| `ADMIN_PASSWORD` | Ya | Kata sandi awal (min. 8 karakter) — ganti setelah login |
| `NEXT_PUBLIC_APP_URL` | Ya | URL Vercel Anda, mis. `https://sister.vercel.app` |

> ⚠️ Secret yang diawali `NEXT_PUBLIC_` akan terlihat di browser. Jangan pernah menaruh `DATABASE_URL` atau `AUTH_SECRET` dengan prefix itu.

## Langkah 4 — Database: migrasi otomatis & seed

Build di Vercel otomatis menjalankan `prisma migrate deploy && prisma generate && next build`, jadi tabel database langsung terbentuk.

Setelah deploy pertama **Ready**, buat akun admin awal dengan menjalankan seed. Cara termudah: lewat Vercel CLI atau endpoint lokal:

```bash
# Di komputer Anda (dengan .env terisi DATABASE_URL yang sama):
npx prisma db seed
```

Atau via `npx tsx prisma/seed.ts` dengan `DATABASE_URL` menunjuk ke database production.

## Langkah 5 — Cek & isi data awal

1. Buka URL Vercel Anda → halaman beranda publik langsung bisa dibuka (tanpa login).
2. Login pengurus di `/masuk` dengan `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Buka **Pengaturan Portal** → isi nama cluster, slogan, alamat, kontak WA bendahara, petunjuk pembayaran.
4. Buka **Rumah Warga** → tambah data rumah. **Jenis Iuran** → buat jenis iuran. **Rekening Bank** → tambah rekening/QRIS agar **Bayar Iuran** online aktif.
5. Ganti kata sandi di **Pengaturan Portal → Ganti Kata Sandi**.

---

## Catatan

- **QRIS dinamis**: isi kolom "payload QRIS statis" di form rekening (salin dari QRIS statis Anda). Halaman bayar otomatis membuat QR nominal + kode unik per rumah.
- **OCR Kartu Keluarga**: berjalan di browser pengurus (tesseract.js, bahasa Indonesia) — butuh koneksi internet saat pertama kali memuat model bahasa.
- **API mobile**: dokumentasi interaktif tersedia di `/docs/api`.
- **Cetak kuitansi**: buka kuitansi → "Cetak / Simpan PDF" (tampilan cetak otomatis bersih tanpa header web).
