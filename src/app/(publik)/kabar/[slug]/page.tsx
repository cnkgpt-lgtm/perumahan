import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings, waLink } from "@/lib/settings";
import { tanggalPanjang } from "@/lib/format";
import { Stamp, EventDate, Badge } from "@/components/ui";
import Markdown from "@/components/Markdown";
import TombolBagikan from "@/components/publik/TombolBagikan";

export default async function KabarDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: true },
  });
  if (!post || !post.publishedAt || post.publishedAt > new Date()) notFound();

  const settings = await getSettings();
  const siteName = settings.site_name || "SISTER";

  const terkait = await prisma.post.findMany({
    where: {
      id: { not: post.id },
      category: post.category,
      publishedAt: { not: null, lte: new Date() },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const urlKabar = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/kabar/${post.slug}`;
  const waBagikan = waLink(
    "",
    `*${post.title}*\n\nBaca selengkapnya: ${urlKabar}\n\n— ${siteName}`,
  );

  return (
    <article className="max-w-3xl mx-auto">
      <Link href="/kabar" className="text-sm font-bold inline-flex items-center gap-1 mb-4">
        ← Kembali ke Kabar Warga
      </Link>

      {!post.publishedAt || post.publishedAt > new Date() ? null : null}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Stamp kategori={post.category} />
        {post.isPinned && <span className="badge badge-danger">📌 Dipasang Pengurus</span>}
        {post.publishedAt && (
          <span className="text-xs text-ink-subtle">
            {tanggalPanjang(post.publishedAt)}
            {post.author ? ` · Oleh ${post.author.name}` : ""}
          </span>
        )}
      </div>

      <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{post.title}</h1>

      {post.category === "kegiatan" && post.eventStartsAt && (
        <div className="mt-4 rounded-2xl bg-daun-soft border border-daun/20 px-4 py-3 flex items-center gap-3">
          <EventDate tanggal={post.eventStartsAt} />
          <div>
            <p className="font-bold text-daun-dark">Jadwal Acara Warga</p>
            <p className="text-sm text-ink-muted">
              {tanggalPanjang(post.eventStartsAt)} ·{" "}
              {String(new Date(post.eventStartsAt).getHours()).padStart(2, "0")}:
              {String(new Date(post.eventStartsAt).getMinutes()).padStart(2, "0")}
              {post.eventLocation ? ` · ${post.eventLocation}` : ""}
            </p>
          </div>
        </div>
      )}

      {post.image && (
        <img
          src={`/api/gambar/kabar/${post.id}`}
          alt={post.title}
          className="w-full rounded-2xl mt-5 border border-rule object-cover max-h-[420px]"
        />
      )}

      <div className="sheet p-5 sm:p-7 mt-5">
        <Markdown teks={post.body} />
      </div>

      {post.category === "iuran" && (
        <Link
          href="/iuran"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-daun-soft border border-daun/30 px-5 py-4 no-underline hover:bg-daun-soft/70 transition-colors"
        >
          <span className="font-bold text-daun-dark">Cek status iuran Anda sekarang</span>
          <span className="text-daun-dark font-extrabold">→</span>
        </Link>
      )}

      <div className="sheet p-5 mt-5">
        <p className="text-sm font-bold mb-3">Bagikan Kabar Ini:</p>
        <TombolBagikan waUrl={waBagikan} tautan={urlKabar} />
      </div>

      {terkait.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold tracking-tight mb-3">Kabar {post.category} Lainnya</h2>
          <div className="space-y-3">
            {terkait.map((t) => (
              <Link key={t.id} href={`/kabar/${t.slug}`} className="sheet p-4 flex items-center gap-3 no-underline hover:border-daun/40 transition-colors">
                <Stamp kategori={t.category} />
                <span className="font-bold text-ink line-clamp-1 flex-1">{t.title}</span>
                <span className="text-daun-dark font-extrabold shrink-0">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
