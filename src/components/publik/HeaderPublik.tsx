"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Beranda", match: (p: string) => p === "/" },
  { href: "/kabar", label: "Kabar", match: (p: string) => p.startsWith("/kabar") },
  { href: "/iuran", label: "Iuran Warga", match: (p: string) => p.startsWith("/iuran") },
  { href: "/bayar", label: "Bayar Iuran", match: (p: string) => p.startsWith("/bayar") },
  { href: "/kas", label: "Kas RT", match: (p: string) => p.startsWith("/kas") },
];

function LogoMark({ className = "size-5.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

const MOBILE_TABS = [
  {
    href: "/",
    label: "Beranda",
    match: (p: string) => p === "/",
    icon: (active: boolean) => (
      <svg className={`size-5.5 ${active ? "stroke-[2.4]" : "stroke-[1.8]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/kabar",
    label: "Kabar",
    match: (p: string) => p.startsWith("/kabar"),
    icon: (active: boolean) => (
      <svg className={`size-5.5 ${active ? "stroke-[2.4]" : "stroke-[1.8]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" />
        <path d="M15 18h-5" />
        <path d="M10 6h8v4h-8V6Z" />
      </svg>
    ),
  },
  {
    href: "/bayar",
    label: "Bayar",
    match: (p: string) => p.startsWith("/bayar"),
    center: true,
    icon: (active: boolean) => (
      <div className="p-0.5">
        <div className={`size-8 rounded-lg ${active ? "bg-daun-dark" : "bg-daun"} text-white shadow-xs flex items-center justify-center`}>
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
            <line x1="6" x2="10" y1="15" y2="15" />
          </svg>
        </div>
      </div>
    ),
  },
  {
    href: "/iuran",
    label: "Cek Iuran",
    match: (p: string) => p.startsWith("/iuran"),
    icon: (active: boolean) => (
      <svg className={`size-5.5 ${active ? "stroke-[2.4]" : "stroke-[1.8]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <rect width="8" height="4" x="8" y="2" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/kas",
    label: "Kas RT",
    match: (p: string) => p.startsWith("/kas"),
    icon: (active: boolean) => (
      <svg className={`size-5.5 ${active ? "stroke-[2.4]" : "stroke-[1.8]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" x2="12" y1="2" y2="22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

export default function HeaderPublik({
  siteName,
  siteTagline,
  isAuthed,
}: {
  siteName: string;
  siteTagline: string;
  isAuthed: boolean;
}) {
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-shadow print:hidden">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 no-underline group min-w-0">
            <div className="size-10 rounded-xl bg-gradient-to-br from-daun to-emerald-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <LogoMark />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-lg text-slate-900 leading-tight truncate tracking-tight">
                {siteName}
              </span>
              <span className="block text-xs text-slate-500 font-medium truncate">
                {siteTagline || "Portal Warga Digital"}
              </span>
            </div>
          </Link>

          <nav aria-label="Menu utama" className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all no-underline ${
                    active
                      ? "bg-white text-daun-dark shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            {isAuthed ? (
              <Link href="/admin" className="btn btn-sm btn-quiet flex items-center gap-1.5 text-xs text-daun-dark font-bold no-underline">
                <span className="size-2 rounded-full bg-daun animate-pulse"></span>
                Panel Pengurus
              </Link>
            ) : (
              <Link href="/masuk" className="btn btn-sm btn-quiet text-xs font-bold text-slate-700 no-underline">
                Masuk Pengurus
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav aria-label="Navigasi bawah mobile" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] print:hidden">
        <div className="grid grid-cols-5 items-center justify-around">
          {MOBILE_TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href + tab.label}
                href={tab.href}
                className={`flex flex-col items-center justify-center py-1 rounded-xl text-center no-underline transition-all active:scale-95 ${
                  active ? "text-daun font-bold" : tab.center ? "text-slate-700 font-semibold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <div className="relative p-1">
                  {tab.icon(active)}
                  {active && !tab.center && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-daun"></span>
                  )}
                </div>
                <span className="text-[11px] leading-tight mt-0.5">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
