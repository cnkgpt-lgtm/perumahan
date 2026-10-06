import Link from "next/link";

// Badge status & stamp kategori — port dari komponen Blade x-badge / x-stamp.

const STAMP_WARNA: Record<string, string> = {
  kegiatan: "border-emerald-600 text-emerald-700 bg-emerald-50",
  pengumuman: "border-amber-600 text-amber-700 bg-amber-50",
  berita: "border-blue-600 text-blue-700 bg-blue-50",
  iuran: "border-teal-600 text-teal-700 bg-teal-50",
};

export function Stamp({ kategori, label }: { kategori: string; label?: string }) {
  const warna = STAMP_WARNA[kategori] ?? "border-slate-500 text-slate-600 bg-slate-50";
  return <span className={`stamp ${warna}`}>{label ?? kategori}</span>;
}

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: "success" | "warning" | "danger" | "neutral";
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
}

export function EmptyState({
  judul,
  deskripsi,
  aksi,
}: {
  judul: string;
  deskripsi?: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="sheet p-8 sm:p-10 text-center">
      <div className="mx-auto size-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
        </svg>
      </div>
      <p className="font-serif font-bold text-lg text-ink">{judul}</p>
      {deskripsi && <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">{deskripsi}</p>}
      {aksi && <div className="mt-4">{aksi}</div>}
    </div>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-daun mb-2">{children}</p>
  );
}

export function WaIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.04 2C6.56 2 2.1 6.45 2.1 11.93c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.48 0 9.93-4.45 9.93-9.93 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2" />
    </svg>
  );
}

export function Flash({ pesan, jenis = "sukses" }: { pesan?: string | null; jenis?: "sukses" | "galat" }) {
  if (!pesan) return null;
  return (
    <div
      className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
        jenis === "sukses"
          ? "border-daun/30 bg-daun-soft text-daun-dark"
          : "border-terakota/30 bg-terakota-soft text-terakota"
      }`}
    >
      {pesan}
    </div>
  );
}

export type PostRingkas = {
  id: string;
  title: string;
  slug: string;
  category: string;
  body: string;
  imageId?: string | null;
  eventStartsAt?: Date | string | null;
  eventLocation?: string | null;
  isPinned: boolean;
  publishedAt?: Date | string | null;
  authorName?: string | null;
};

export function excerpt(teks: string, panjang = 140): string {
  const bersih = teks.replace(/[#>*_`\-]/g, "").replace(/\s+/g, " ").trim();
  return bersih.length > panjang ? bersih.slice(0, panjang).trimEnd() + "…" : bersih;
}

export function PostCard({ post }: { post: PostRingkas }) {
  const tgl = post.publishedAt ? new Date(post.publishedAt) : null;
  return (
    <Link href={`/kabar/${post.slug}`} className="sheet p-4 sm:p-5 flex gap-4 no-underline hover:border-daun/40 hover:shadow-sm transition-all group">
      {post.imageId ? (
        <img
          src={`/api/gambar/kabar/${post.imageId}`}
          alt=""
          className="size-20 sm:size-24 rounded-xl object-cover shrink-0 bg-slate-100"
          loading="lazy"
        />
      ) : (
        <div className="size-20 sm:size-24 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 shrink-0">
          <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <Stamp kategori={post.category} />
          {post.isPinned && <span className="badge badge-danger">📌 Dipasang</span>}
          {tgl && (
            <span className="text-xs text-ink-subtle">
              {tgl.getDate()} {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][tgl.getMonth()]} {tgl.getFullYear()}
            </span>
          )}
        </div>
        <h3 className="font-bold text-ink leading-snug group-hover:text-daun-dark transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-ink-muted mt-1 line-clamp-2">{excerpt(post.body)}</p>
      </div>
    </Link>
  );
}

export function EventDate({ tanggal }: { tanggal: Date | string }) {
  const d = new Date(tanggal);
  const BULAN = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
  return (
    <div className="shrink-0 w-14 rounded-xl border border-rule bg-white text-center overflow-hidden">
      <div className="bg-daun text-white text-[10px] font-bold py-0.5 tracking-wider">{BULAN[d.getMonth()]}</div>
      <div className="text-xl font-extrabold text-ink py-1">{d.getDate()}</div>
    </div>
  );
}
