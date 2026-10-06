import Link from "next/link";
import { prisma } from "@/lib/db";
import { Kicker, PostCard, type PostRingkas } from "@/components/ui";

const KATEGORI = [
  { key: "", label: "Semua Kabar" },
  { key: "pengumuman", label: "Pengumuman" },
  { key: "berita", label: "Berita" },
  { key: "kegiatan", label: "Kegiatan" },
  { key: "iuran", label: "Iuran" },
];

const PER_HALAMAN = 10;

export default async function KabarIndex({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; halaman?: string }>;
}) {
  const sp = await searchParams;
  const kategori = sp.kategori ?? "";
  const halaman = Math.max(1, parseInt(sp.halaman ?? "1", 10) || 1);

  const where = {
    publishedAt: { not: null, lte: new Date() },
    ...(kategori ? { category: kategori } : {}),
  };
  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      include: { author: true },
    }),
  ]);
  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));

  const toRingkas = (p: (typeof posts)[number]): PostRingkas => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    body: p.body,
    imageId: p.image ? p.id : null,
    isPinned: p.isPinned,
    publishedAt: p.publishedAt,
    authorName: p.author?.name ?? null,
  });

  const linkKategori = (key: string) => `/kabar${key ? `?kategori=${key}` : ""}`;

  return (
    <div className="max-w-3xl mx-auto">
      <Kicker>Pusat Informasi Warga</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Kabar &amp; Pengumuman</h1>
      <p className="text-ink-muted mt-2">Semua pengumuman, berita, dan agenda kegiatan warga dalam satu tempat.</p>

      <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar pb-1">
        {KATEGORI.map((k) => {
          const aktif = kategori === k.key;
          return (
            <Link
              key={k.key}
              href={linkKategori(k.key)}
              className={`shrink-0 inline-flex items-center px-4 py-2 rounded-full text-sm font-bold no-underline transition-all ${
                aktif
                  ? k.key === ""
                    ? "bg-ink text-white"
                    : "bg-daun text-white"
                  : "bg-white border border-rule text-ink-muted hover:border-daun/40 hover:text-ink"
              }`}
            >
              {k.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-4 mt-6">
        {posts.map((p) => (
          <PostCard key={p.id} post={toRingkas(p)} />
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-ink-muted text-center py-10">Belum ada kabar pada kategori ini.</p>
        )}
      </div>

      {totalHalaman > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {halaman > 1 && (
            <Link
              href={`/kabar?${new URLSearchParams({ ...(kategori ? { kategori } : {}), halaman: String(halaman - 1) })}`}
              className="btn btn-quiet btn-sm no-underline"
            >
              ← Sebelumnya
            </Link>
          )}
          <span className="text-sm text-ink-muted font-semibold">
            Halaman {halaman} dari {totalHalaman}
          </span>
          {halaman < totalHalaman && (
            <Link
              href={`/kabar?${new URLSearchParams({ ...(kategori ? { kategori } : {}), halaman: String(halaman + 1) })}`}
              className="btn btn-quiet btn-sm no-underline"
            >
              Berikutnya →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
