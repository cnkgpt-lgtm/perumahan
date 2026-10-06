import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker, Badge, WaIcon, EmptyState } from "@/components/ui";
import { waLink } from "@/lib/settings";
import { hapusRumah } from "./actions";
import HapusButton from "../_ui/HapusButton";

const PER_HALAMAN = 20;

export default async function RumahAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; halaman?: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const halaman = Math.max(1, parseInt(sp.halaman ?? "1", 10) || 1);

  const where = q
    ? {
        OR: [
          { number: { contains: q, mode: "insensitive" as const } },
          { headName: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.household.count({ where }),
    prisma.household.findMany({
      where,
      orderBy: { number: "asc" },
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      include: { _count: { select: { members: true, payments: true } } },
    }),
  ]);
  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const linkHal = (h: number) =>
    `/admin/rumah?halaman=${h}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Kicker>Data Master</Kicker>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Daftar Rumah Warga
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {total} rumah terdata{q && <> · hasil pencarian “{q}”</>}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/rumah/export" className="btn btn-quiet">
            ⬇️ Unduh CSV
          </a>
          <Link href="/admin/rumah/baru" className="btn btn-primary">
            ＋ Tambah Rumah Baru
          </Link>
        </div>
      </div>

      <form method="get" className="mt-5 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nomor rumah atau nama kepala keluarga…"
          className="input flex-1"
        />
        <button type="submit" className="btn btn-quiet shrink-0">
          🔍 Cari
        </button>
        {q && (
          <Link href="/admin/rumah" className="btn btn-quiet shrink-0">
            ✕
          </Link>
        )}
      </form>

      <div className="mt-4 space-y-3">
        {rows.length === 0 && (
          <EmptyState
            judul="Tidak ada rumah ditemukan"
            deskripsi={q ? "Coba kata kunci lain." : "Tambahkan rumah pertama untuk mulai mendata warga."}
            aksi={
              !q ? (
                <Link href="/admin/rumah/baru" className="btn btn-primary">
                  ＋ Tambah Rumah Baru
                </Link>
              ) : undefined
            }
          />
        )}
        {rows.map((r) => (
          <div key={r.id} className="sheet p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-ink text-white font-mono">{r.number}</span>
              <span className="font-bold text-ink">{r.headName}</span>
              {r.occupancyStatus === "kontrak" ? (
                <span className="badge bg-amber-50 text-amber-800 border border-amber-200/60">
                  Kontrak
                </span>
              ) : (
                <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                  Pemilik
                </span>
              )}
              {r.kkNumber && (
                <span className="text-xs font-mono text-ink-muted">KK: {r.kkNumber}</span>
              )}
              {!r.isActive && <Badge variant="danger">Nonaktif</Badge>}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-ink-muted">
              {r._count.members > 0 ? (
                <Link
                  href={`/admin/rumah/${r.id}/penghuni`}
                  className="font-semibold text-indigo-700 hover:underline no-underline"
                >
                  👥 {r._count.members} penghuni
                </Link>
              ) : (
                <Link
                  href={`/admin/rumah/${r.id}/penghuni`}
                  className="font-semibold text-indigo-700 hover:underline no-underline"
                >
                  Belum didata
                </Link>
              )}
              {r.phone ? (
                <a
                  href={waLink(r.phone, `Halo Bapak/Ibu ${r.headName},`)}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 font-semibold text-daun-dark hover:underline no-underline"
                >
                  <WaIcon className="size-4" /> {r.phone}
                </a>
              ) : (
                <span className="text-ink-subtle">Tanpa nomor HP</span>
              )}
              <span>{r._count.payments} riwayat bayar</span>
              {r.note && <span className="italic">“{r.note}”</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Link
                href={`/admin/rumah/${r.id}/penghuni`}
                className="btn btn-sm bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 no-underline"
              >
                👥 Penghuni ({r._count.members})
              </Link>
              <Link
                href={`/admin?rumah=${r.id}`}
                className="btn btn-sm btn-primary"
              >
                ＋ Catat Bayar
              </Link>
              <Link
                href={`/admin/pembayaran?rumah=${r.id}`}
                className="btn btn-sm btn-quiet"
              >
                🧾 Riwayat
              </Link>
              <Link href={`/admin/rumah/${r.id}/ubah`} className="btn btn-sm btn-quiet">
                ✏️ Ubah
              </Link>
              <HapusButton aksi={hapusRumah.bind(null, r.id)} />
            </div>
          </div>
        ))}
      </div>

      {totalHalaman > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {halaman > 1 && (
            <Link href={linkHal(halaman - 1)} className="btn btn-sm btn-quiet">
              ← Sebelumnya
            </Link>
          )}
          <span className="text-sm text-ink-muted">
            Halaman {halaman} dari {totalHalaman}
          </span>
          {halaman < totalHalaman && (
            <Link href={linkHal(halaman + 1)} className="btn btn-sm btn-quiet">
              Berikutnya →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
