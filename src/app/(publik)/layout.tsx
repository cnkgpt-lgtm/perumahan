export const dynamic = "force-dynamic";

import Link from "next/link";
import HeaderPublik from "@/components/publik/HeaderPublik";
import { getSettings } from "@/lib/settings";
import { auth } from "@/auth";

export default async function PublikLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const session = await auth();
  const siteName = settings.site_name || "SISTER";
  const siteTagline = settings.site_tagline || "Sistem Informasi Cluster";

  return (
    <>
      <a href="#isi" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 btn btn-primary z-50 shadow-lg print:hidden">
        Langsung ke isi
      </a>
      <HeaderPublik siteName={siteName} siteTagline={siteTagline} isAuthed={!!session?.user} />
      <main id="isi" className="flex-1 mx-auto w-full max-w-5xl px-4 py-5 sm:py-8 focus:outline-none print:p-0 print:m-0 print:max-w-none pb-20 lg:pb-0">
        {children}
      </main>
      <footer className="mt-auto border-t border-slate-200/80 bg-white print:hidden">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-daun"></span>
                {siteName}
              </p>
              {settings.address && <p className="text-xs text-slate-500">{settings.address}</p>}
              {settings.treasurer_contact && (
                <p className="text-xs text-slate-500">
                  Kontak Bendahara: <strong className="text-slate-700">{settings.treasurer_contact}</strong>
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs">
              {session?.user ? (
                <Link href="/admin" className="font-bold text-daun hover:underline">
                  Panel Pengurus
                </Link>
              ) : (
                <Link href="/masuk" className="font-bold text-slate-600 hover:text-daun">
                  Akses Khusus Pengurus
                </Link>
              )}
              <span className="text-slate-300">·</span>
              <span>SISTER v1.0</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
