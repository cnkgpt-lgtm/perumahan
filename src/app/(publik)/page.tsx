import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings, waLink } from "@/lib/settings";
import { rupiah, tanggalPanjang, labelPeriode, namaBulan } from "@/lib/format";
import { currentProgress } from "@/lib/ledger";
import { PostCard, Stamp, EventDate, WaIcon, type PostRingkas } from "@/components/ui";
import PopupModal from "@/components/publik/PopupModal";

function isPublished() {
  return { publishedAt: { not: null, lte: new Date() } };
}

export default async function Beranda() {
  const settings = await getSettings();
  const siteName = settings.site_name || "SISTER";
  const siteTagline = settings.site_tagline || "Sistem Informasi Cluster";

  const [pinned, upcoming, latest, popupPost, totalBalance, totalHouseholds, progress] = await Promise.all([
    prisma.post.findMany({ where: { ...isPublished(), isPinned: true }, orderBy: { publishedAt: "desc" }, include: { author: true } }),
    prisma.post.findMany({
      where: { ...isPublished(), category: "kegiatan", eventStartsAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      orderBy: { eventStartsAt: "asc" },
      take: 3,
      include: { author: true },
    }),
    prisma.post.findMany({ where: isPublished(), orderBy: { publishedAt: "desc" }, take: 6, include: { author: true } }),
    prisma.post.findFirst({ where: { ...isPublished(), isPopup: true }, orderBy: { publishedAt: "desc" }, include: { author: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }).then((p) =>
      prisma.expense.aggregate({ _sum: { amount: true } }).then((e) => (p._sum.amount ?? 0) - (e._sum.amount ?? 0)),
    ),
    prisma.household.count({ where: { isActive: true } }),
    currentProgress(),
  ]);

  const pinnedIds = new Set(pinned.map((p) => p.id));
  const upcomingIds = new Set(upcoming.map((p) => p.id));
  const latestFiltered = latest.filter((p) => !pinnedIds.has(p.id) && !upcomingIds.has(p.id));

  const today = new Date();
  const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const toRingkas = (p: (typeof pinned)[number]): PostRingkas => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    body: p.body,
    imageId: p.image ? p.id : null,
    eventStartsAt: p.eventStartsAt,
    eventLocation: p.eventLocation,
    isPinned: p.isPinned,
    publishedAt: p.publishedAt,
    authorName: p.author?.name ?? null,
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="sheet rounded-3xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <span className="badge badge-success">
            <span className="size-1.5 rounded-full bg-daun"></span>
            Portal Resmi Lingkungan
          </span>
          <span className="text-xs text-ink-subtle font-medium">
            {HARI[today.getDay()]}, {tanggalPanjang(today)}
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{siteName}</h1>
        <p className="text-ink-muted mt-2 max-w-xl">{siteTagline}</p>

        <form action="/iuran" method="GET" className="mt-5 flex gap-2 max-w-lg">
          <input
            type="search"
            name="cari"
            placeholder="Cek status iuran — ketik nomor rumah…"
            className="input flex-1"
            aria-label="Cari status iuran rumah"
          />
          <button type="submit" className="btn btn-primary shrink-0">
            Cari Status Iuran
          </button>
        </form>

        <div className="mt-5 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Akses Cepat:</span>
          <Link href="/bayar" className="btn btn-sm btn-primary no-underline">Bayar Iuran Online</Link>
          <Link href="/iuran" className="btn btn-sm btn-quiet no-underline">Cek Buku Iuran</Link>
          <Link href="/kas" className="btn btn-sm btn-quiet no-underline">Buku Kas Umum</Link>
          <Link href="/kabar" className="btn btn-sm btn-quiet no-underline">Kabar Warga</Link>
        </div>
      </section>

      {/* Statistik */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-daun-dark to-emerald-900 text-white shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">Saldo Kas RT</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-1">{rupiah(totalBalance)}</p>
        </div>
        <div className="sheet p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Warga Terdata</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-1">{totalHouseholds} <span className="text-sm font-semibold text-ink-muted">Rumah</span></p>
        </div>
        <div className="sheet p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Agenda Warga</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-1">{upcoming.length} <span className="text-sm font-semibold text-ink-muted">Kegiatan</span></p>
        </div>
        <div className="sheet p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Kabar Warga</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-1">{latest.length} <span className="text-sm font-semibold text-ink-muted">Terbitan</span></p>
        </div>
      </section>

      {/* Pengumuman disematkan */}
      {pinned.length > 0 && (
        <section className="space-y-4">
          {pinned.map((p) => (
            <article key={p.id} className="sheet p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-terakota"></div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="badge badge-danger">Disematkan</span>
                <Stamp kategori={p.category} />
                {p.publishedAt && (
                  <span className="text-xs text-ink-subtle">{tanggalPanjang(p.publishedAt)}</span>
                )}
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                <Link href={`/kabar/${p.slug}`} className="no-underline text-ink hover:text-daun-dark">{p.title}</Link>
              </h2>
              {p.category === "kegiatan" && p.eventStartsAt && (
                <div className="mt-3 rounded-xl bg-daun-soft border border-daun/20 px-4 py-3 flex items-center gap-3">
                  <EventDate tanggal={p.eventStartsAt} />
                  <div className="text-sm">
                    <p className="font-bold text-daun-dark">Jadwal Acara Warga</p>
                    <p className="text-ink-muted">
                      {tanggalPanjang(p.eventStartsAt)}
                      {p.eventLocation ? ` · ${p.eventLocation}` : ""}
                    </p>
                  </div>
                </div>
              )}
              <p className="text-ink-muted mt-3 line-clamp-3">{p.body.replace(/[#>*_`\-]/g, "").slice(0, 220)}…</p>
              <Link href={`/kabar/${p.slug}`} className="inline-flex items-center gap-1 text-sm font-bold mt-3">
                Baca selengkapnya →
              </Link>
            </article>
          ))}
        </section>
      )}

      {/* Kabar + sidebar */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">Kabar Terbaru</h2>
            <Link href="/kabar" className="text-sm font-bold">Semua kabar →</Link>
          </div>
          {latestFiltered.length === 0 ? (
            <p className="text-sm text-ink-muted">Belum ada kabar terbaru.</p>
          ) : (
            latestFiltered.map((p) => <PostCard key={p.id} post={toRingkas(p)} />)
          )}
        </div>

        <aside className="space-y-4">
          <div className="sheet p-5">
            <h3 className="font-extrabold tracking-tight mb-3">Iuran Berjalan</h3>
            <div className="space-y-4">
              {progress.map(({ type, label, paid, total }) => {
                const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
                return (
                  <div key={type.id}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-bold truncate">{type.name}</p>
                      <span className="badge badge-success shrink-0">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-daun to-emerald-500" style={{ width: `${pct}%` }}></div>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      {paid} dari {total} rumah sudah bayar · {type.frequency === "bulanan" ? labelPeriode(label) : label}
                    </p>
                  </div>
                );
              })}
              {progress.length === 0 && <p className="text-sm text-ink-muted">Belum ada iuran aktif.</p>}
            </div>
            <Link href="/iuran" className="btn btn-quiet btn-sm w-full mt-4 no-underline">Lihat Status Semua Rumah</Link>
          </div>

          <div className="sheet p-5">
            <h3 className="font-extrabold tracking-tight mb-3">Kegiatan Mendatang</h3>
            <div className="space-y-3">
              {upcoming.map((k) => (
                <Link key={k.id} href={`/kabar/${k.slug}`} className="flex gap-3 no-underline group">
                  {k.eventStartsAt && <EventDate tanggal={k.eventStartsAt} />}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink group-hover:text-daun-dark line-clamp-2">{k.title}</p>
                    {k.eventStartsAt && (
                      <p className="text-xs text-ink-muted mt-0.5">
                        {String(new Date(k.eventStartsAt).getHours()).padStart(2, "0")}.{String(new Date(k.eventStartsAt).getMinutes()).padStart(2, "0")}
                        {k.eventLocation ? ` · ${k.eventLocation}` : ""}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
              {upcoming.length === 0 && <p className="text-sm text-ink-muted">Belum ada agenda.</p>}
            </div>
          </div>

          <div className="sheet p-5">
            <h3 className="font-extrabold tracking-tight mb-2">Layanan Pengurus RT</h3>
            <p className="text-sm text-ink-muted">Butuh bantuan soal iuran atau kabar? Hubungi pengurus langsung.</p>
            <a
              href={waLink(settings.treasurer_contact, `Halo Pengurus ${siteName}, saya butuh bantuan.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm w-full mt-3 no-underline"
            >
              <WaIcon /> WhatsApp Pengurus
            </a>
          </div>
        </aside>
      </section>

      {popupPost && (
        <PopupModal
          post={{
            id: popupPost.id,
            title: popupPost.title,
            slug: popupPost.slug,
            category: popupPost.category,
            body: popupPost.body,
            hasImage: !!popupPost.popupImage,
          }}
        />
      )}
    </div>
  );
}
