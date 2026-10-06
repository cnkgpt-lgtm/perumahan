import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker, Stamp, Badge, EmptyState } from "@/components/ui";
import { tanggalPanjang } from "@/lib/format";
import { hapusKabar } from "./actions";
import HapusButton from "../_ui/HapusButton";

import { Prisma } from "@prisma/client";

const TAB = [
  { key: "", label: "Semua" },
  { key: "pengumuman", label: "Pengumuman" },
  { key: "berita", label: "Berita" },
  { key: "kegiatan", label: "Kegiatan" },
  { key: "iuran", label: "Iuran" },
];

type BarisKabar = {
  id: string;
  title: string;
  slug: string;
  category: string;
  publishedAt: Date | null;
  isPinned: boolean;
  isPopup: boolean;
  adaFoto: boolean;
};

export default async function KabarAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const sp = await searchParams;
  const kategori = TAB.some((t) => t.key === sp.kategori) ? (sp.kategori ?? "") : "";

  const filter = kategori ? Prisma.sql`WHERE category = ${kategori}` : Prisma.empty;
  const rows = await prisma.$queryRaw<BarisKabar[]>`
    SELECT id, title, slug, category, "publishedAt", "isPinned", "isPopup",
           image IS NOT NULL AS "adaFoto"
    FROM "Post"
    ${filter}
    ORDER BY "publishedAt" DESC NULLS LAST, "createdAt" DESC
  `;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Kicker>Konten Web Warga</Kicker>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Kabar &amp; Pengumuman
          </h1>
        </div>
        <Link href="/admin/kabar/baru" className="btn btn-primary">
          ✏️ Tulis Kabar Baru
        </Link>
      </div>

      <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar pb-1">
        {TAB.map((t) => {
          const aktif = kategori === t.key;
          return (
            <Link
              key={t.key}
              href={aktif ? "/admin/kabar" : `/admin/kabar?kategori=${t.key}`}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold no-underline transition-all ${
                aktif
                  ? "bg-daun text-white shadow-xs"
                  : "bg-white border border-rule text-ink-muted hover:border-daun/50 hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 && (
          <EmptyState
            judul="Belum ada kabar"
            deskripsi="Tulis kabar pertama untuk mengisi papan informasi warga."
            aksi={
              <Link href="/admin/kabar/baru" className="btn btn-primary">
                ✏️ Tulis Kabar Baru
              </Link>
            }
          />
        )}
        {rows.map((p) => (
          <div key={p.id} className="sheet p-4 flex gap-4 items-start">
            {p.adaFoto ? (
              <img
                src={`/api/gambar/kabar/${p.id}`}
                alt=""
                className="size-16 rounded-xl object-cover shrink-0 bg-slate-100"
                loading="lazy"
              />
            ) : (
              <div className="size-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Stamp kategori={p.category} />
                {!p.publishedAt ? (
                  <Badge variant="warning">Draf</Badge>
                ) : (
                  <span className="text-xs text-ink-subtle">{tanggalPanjang(p.publishedAt)}</span>
                )}
                {p.isPinned && <Badge variant="danger">📌 Tersemat</Badge>}
                {p.isPopup && (
                  <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                    🪟 Popup
                  </span>
                )}
              </div>
              <p className="font-bold text-ink leading-snug">{p.title}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {p.publishedAt ? (
                  <a
                    href={`/kabar/${p.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-sm btn-quiet"
                  >
                    👁️ Lihat
                  </a>
                ) : (
                  <span className="btn btn-sm btn-quiet opacity-50 pointer-events-none">👁️ Lihat</span>
                )}
                <Link href={`/admin/kabar/${p.id}/ubah`} className="btn btn-sm btn-quiet">
                  ✏️ Ubah
                </Link>
                <HapusButton aksi={hapusKabar.bind(null, p.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
