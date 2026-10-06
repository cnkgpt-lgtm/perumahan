"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

const JUDUL: Record<string, string> = {
  "/admin": "Catat Bayar",
  "/admin/konfirmasi": "Konfirmasi Bayar",
  "/admin/buku-iuran": "Buku Iuran",
  "/admin/pembayaran": "Riwayat Bayar",
  "/admin/pengeluaran": "Kas & Pengeluaran",
  "/admin/kabar": "Kabar Warga",
  "/admin/rumah": "Rumah Warga",
  "/admin/jenis-iuran": "Jenis Iuran",
  "/admin/rekening": "Rekening Bank",
  "/admin/pengurus": "Kelola Pengurus",
  "/admin/pengaturan": "Pengaturan Portal",
};

type ItemMenu = { href: string; label: string; ikon: string; badge?: number };

const MENU: { grup: string; items: ItemMenu[] }[] = [
  {
    grup: "Keuangan & Iuran",
    items: [
      { href: "/admin", label: "Catat Bayar", ikon: "catat" },
      { href: "/admin/konfirmasi", label: "Konfirmasi Bayar", ikon: "cek" },
      { href: "/admin/buku-iuran", label: "Buku Iuran", ikon: "buku" },
      { href: "/admin/pembayaran", label: "Riwayat Bayar", ikon: "riwayat" },
      { href: "/admin/pengeluaran", label: "Kas & Pengeluaran", ikon: "kas" },
    ],
  },
  {
    grup: "Warga & Konten",
    items: [
      { href: "/admin/kabar", label: "Kabar Warga", ikon: "kabar" },
      { href: "/admin/rumah", label: "Rumah Warga", ikon: "rumah" },
    ],
  },
  {
    grup: "Master & Pengaturan",
    items: [
      { href: "/admin/jenis-iuran", label: "Jenis Iuran", ikon: "jenis" },
      { href: "/admin/rekening", label: "Rekening Bank", ikon: "rekening" },
      { href: "/admin/pengurus", label: "Kelola Pengurus", ikon: "pengurus" },
      { href: "/admin/pengaturan", label: "Pengaturan Portal", ikon: "pengaturan" },
    ],
  },
];

const MENU_LAINNYA: ItemMenu[] = [
  { href: "/admin/pembayaran", label: "Riwayat Bayar", ikon: "riwayat" },
  { href: "/admin/pengeluaran", label: "Kas & Pengeluaran", ikon: "kas" },
  { href: "/admin/rumah", label: "Rumah Warga", ikon: "rumah" },
  { href: "/admin/jenis-iuran", label: "Jenis Iuran", ikon: "jenis" },
  { href: "/admin/rekening", label: "Rekening Bank", ikon: "rekening" },
  { href: "/admin/pengurus", label: "Kelola Pengurus", ikon: "pengurus" },
  { href: "/admin/pengaturan", label: "Pengaturan Portal", ikon: "pengaturan" },
];

const IKON: Record<string, React.ReactNode> = {
  catat: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>),
  cek: (<><rect width="18" height="18" x="3" y="3" rx="4" /><path d="m8.5 12.5 2.5 2.5 5-5.5" /></>),
  buku: (<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>),
  riwayat: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  kas: (<><path d="M20 7H4a2 2 0 0 1 0-4h14v4" /><path d="M4 7v12a2 2 0 0 0 2 2h14V7" /><circle cx="17" cy="14" r="1.4" /></>),
  kabar: (<><path d="m3 11 18-7-7 18-2.5-7.5Z" /></>),
  rumah: (<><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M9 22V12h6v10" /></>),
  jenis: (<><path d="M12 2H2v10l9.3 9.3a1 1 0 0 0 1.4 0l8.6-8.6a1 1 0 0 0 0-1.4Z" /><circle cx="7" cy="7" r="1.4" /></>),
  rekening: (<><rect width="20" height="14" x="2" y="5" rx="3" /><path d="M2 10h20" /></>),
  pengurus: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></>),
  pengaturan: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z" /></>),
  web: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></>),
  keluar: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>),
  x: (<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>),
};

function Ikon({ nama, className = "size-5" }: { nama: string; className?: string }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {IKON[nama] ?? IKON.buku}
    </svg>
  );
}

function Logo({ siteName, kecil = false }: { siteName: string; kecil?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="shrink-0 size-10 rounded-xl bg-gradient-to-br from-daun to-daun-dark flex items-center justify-center shadow-xs">
        <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 13c0 5-3.5 7.5-7.7 9a.6.6 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.3-2.7a1 1 0 0 1 1.4 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className={`block font-extrabold text-white leading-tight truncate ${kecil ? "text-sm" : "text-base"}`}>{siteName}</span>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Pengurus RT</span>
      </span>
    </div>
  );
}

function itemAktif(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
}

export default function AdminShell({
  siteName,
  userName,
  pendingCount,
  children,
}: {
  siteName: string;
  userName: string;
  pendingCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const judul = JUDUL[pathname] ?? "Panel Pengurus";

  const keluar = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const tautanMenu = (item: ItemMenu, mobile = false) => {
    const aktif = itemAktif(item.href, pathname);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setDrawer(false)}
        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold no-underline transition-colors ${
          aktif
            ? "bg-daun/20 text-white"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        } ${mobile ? "py-3" : ""}`}
      >
        <Ikon nama={item.ikon} />
        <span className="flex-1">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span className="min-w-6 h-6 px-1.5 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-full">
      {/* ===== Sidebar desktop ===== */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-slate-900 z-40">
        <div className="px-5 pt-6 pb-4">
          <Logo siteName={siteName} />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
          {MENU.map((g) => (
            <div key={g.grup}>
              <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">{g.grup}</p>
              <div className="space-y-0.5">
                {g.items.map((it) =>
                  tautanMenu({
                    ...it,
                    badge: it.href === "/admin/konfirmasi" ? pendingCount : undefined,
                  })
                )}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-3 pb-3">
          <div className="rounded-xl bg-white/5 px-3.5 py-3 mb-2">
            <p className="text-xs text-slate-400">Masuk sebagai</p>
            <p className="text-sm font-bold text-white truncate">{userName}</p>
          </div>
          <Link href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 no-underline hover:bg-white/5 hover:text-white">
            <Ikon nama="web" /> Lihat Web Warga
          </Link>
          <button onClick={keluar}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer">
            <Ikon nama="keluar" /> Keluar dari Admin
          </button>
        </div>
      </aside>

      {/* ===== Top bar mobile ===== */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900 text-white">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex-1 min-w-0">
            <Logo siteName={siteName} kecil />
          </div>
          <Link href="/" target="_blank" rel="noopener noreferrer" aria-label="Lihat web warga"
            className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white no-underline">
            <Ikon nama="web" className="size-5" />
          </Link>
          <button onClick={keluar} aria-label="Keluar dari admin"
            className="size-10 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer">
            <Ikon nama="keluar" className="size-5" />
          </button>
        </div>
      </header>

      {/* ===== Konten ===== */}
      <div className="lg:pl-64 min-h-full flex flex-col">
        {/* Topbar desktop */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-rule">
          <div className="w-full max-w-6xl mx-auto px-6 py-3.5 flex items-center gap-4">
            <p className="text-sm text-ink-muted">
              Pengurus RT <span className="mx-1 text-rule">/</span> <span className="font-bold text-ink">{judul}</span>
            </p>
            <div className="ml-auto flex items-center gap-2">
              {pendingCount > 0 && (
                <Link href="/admin/konfirmasi"
                  className="badge badge-warning !py-1.5 !px-3 no-underline hover:border-amber-400">
                  {pendingCount} Konfirmasi Menunggu
                </Link>
              )}
              <Link href="/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-quiet no-underline">
                Lihat Web Warga
              </Link>
              <button onClick={keluar} className="btn btn-sm btn-quiet cursor-pointer">Keluar</button>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 pb-28 lg:pb-10">
          {/* Banner konfirmasi global */}
          {pendingCount > 0 && pathname !== "/admin/konfirmasi" && (
            <div className="mb-5 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 flex items-center gap-3 flex-wrap">
              <span className="text-xl" aria-hidden="true">⏳</span>
              <p className="text-sm font-semibold text-amber-900 flex-1 min-w-40">
                {pendingCount} bukti bayar dari warga menunggu konfirmasi.
              </p>
              <Link href="/admin/konfirmasi" className="btn btn-sm btn-accent no-underline">
                Cek sekarang →
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* ===== Bottom nav mobile ===== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-white/10 pb-safe">
        <div className="grid grid-cols-5">
          {[
            { href: "/admin", label: "Catat", ikon: "catat" },
            { href: "/admin/konfirmasi", label: "Konfirmasi", ikon: "cek", badge: pendingCount },
            { href: "/admin/buku-iuran", label: "Buku", ikon: "buku" },
            { href: "/admin/kabar", label: "Kabar", ikon: "kabar" },
          ].map((t) => {
            const aktif = itemAktif(t.href, pathname);
            return (
              <Link key={t.href} href={t.href}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold no-underline ${aktif ? "text-white" : "text-slate-400"}`}>
                <span className="relative">
                  <Ikon nama={t.ikon} className="size-6" />
                  {t.badge != null && t.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-5 h-5 px-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center justify-center">
                      {t.badge}
                    </span>
                  )}
                </span>
                {t.label}
                {aktif && <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-daun" />}
              </Link>
            );
          })}
          <button onClick={() => setDrawer(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-slate-400 cursor-pointer">
            <Ikon nama="pengaturan" className="size-6" />
            Lainnya
          </button>
        </div>
      </nav>

      {/* ===== Drawer "Lainnya" mobile ===== */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu lainnya">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-slate-900 rounded-t-3xl p-5 pb-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-extrabold">Menu Lainnya</p>
              <button onClick={() => setDrawer(false)} aria-label="Tutup menu"
                className="size-9 rounded-xl bg-white/10 text-white flex items-center justify-center cursor-pointer">
                <Ikon nama="x" className="size-5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {MENU_LAINNYA.map((it) => tautanMenu(it, true))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 space-y-0.5">
              <Link href="/" target="_blank" rel="noopener noreferrer" onClick={() => setDrawer(false)}
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-300 no-underline hover:bg-white/5 hover:text-white">
                <Ikon nama="web" /> Buka Halaman Warga
              </Link>
              <button onClick={keluar}
                className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer">
                <Ikon nama="keluar" /> Keluar dari Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
