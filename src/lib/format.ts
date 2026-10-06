// Util format khas Indonesia: rupiah, terbilang, tanggal.

export function rupiah(n: number | null | undefined): string {
  return "Rp" + Number(n ?? 0).toLocaleString("id-ID");
}

const KATA = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

export function terbilang(n: number): string {
  n = Math.abs(Math.floor(n));
  if (n === 0) return "nol";
  if (n < 12) return KATA[n];
  if (n < 20) return terbilang(n - 10) + " belas";
  if (n < 100) {
    const sisa = n % 10;
    return (terbilang(Math.floor(n / 10)) + " puluh " + (sisa ? KATA[sisa] : "")).trim();
  }
  if (n < 200) return ("seratus " + (n > 100 ? terbilang(n - 100) : "")).trim();
  if (n < 1000)
    return (terbilang(Math.floor(n / 100)) + " ratus " + (n % 100 ? terbilang(n % 100) : "")).trim();
  if (n < 2000) return ("seribu " + (n > 1000 ? terbilang(n - 1000) : "")).trim();
  if (n < 1_000_000)
    return (terbilang(Math.floor(n / 1000)) + " ribu " + (n % 1000 ? terbilang(n % 1000) : "")).trim();
  if (n < 1_000_000_000)
    return (
      terbilang(Math.floor(n / 1_000_000)) + " juta " + (n % 1_000_000 ? terbilang(n % 1_000_000) : "")
    ).trim();
  if (n < 1_000_000_000_000)
    return (
      terbilang(Math.floor(n / 1_000_000_000)) +
      " milyar " +
      (n % 1_000_000_000 ? terbilang(n % 1_000_000_000) : "")
    ).trim();
  return String(n);
}

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function namaBulan(bulan: number): string {
  return NAMA_BULAN[bulan - 1] ?? "";
}

/** "2026-10" -> "Oktober 2026"; "" -> "Sekali bayar" */
export function labelPeriode(periode: string): string {
  if (!periode) return "Sekali bayar";
  const [t, b] = periode.split("-");
  return `${namaBulan(Number(b))} ${t}`;
}

export function tanggalPanjang(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return `${dt.getDate()} ${namaBulan(dt.getMonth() + 1)} ${dt.getFullYear()}`;
}

export function tanggalWaktu(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const jam = String(dt.getHours()).padStart(2, "0");
  const menit = String(dt.getMinutes()).padStart(2, "0");
  return `${tanggalPanjang(dt)}, ${jam}.${menit}`;
}

/** Nomor kuitansi: SIST-YYYYMM-XXXX (XXXX = id numerik pembayaran) */
export function nomorKuitansi(paidOn: Date | string, idNumerik: number): string {
  const dt = typeof paidOn === "string" ? new Date(paidOn) : paidOn;
  const prefix = `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, "0")}`;
  return `SIST-${prefix}-${String(idNumerik).padStart(4, "0")}`;
}

/** Nomor urut pembayaran dari cuid (untuk nomor kuitansi) — diisi saat seed/migrasi. */
export function slugify(teks: string): string {
  return teks
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
