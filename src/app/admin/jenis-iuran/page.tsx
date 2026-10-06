import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker, Badge, EmptyState } from "@/components/ui";
import { rupiah, tanggalPanjang, namaBulan } from "@/lib/format";
import { hapusJenis } from "./actions";
import HapusButton from "../_ui/HapusButton";
import TampilanJenis from "./TampilanJenis";

function labelMulai(d: Date | null): string {
  if (!d) return "—";
  return `${namaBulan(d.getMonth() + 1)} ${d.getFullYear()}`;
}

export default async function JenisIuranPage() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");

  const [types, agg] = await Promise.all([
    prisma.duesType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    prisma.payment.groupBy({
      by: ["duesTypeId"],
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const perJenis = new Map(agg.map((a) => [a.duesTypeId, a]));
  const totalTerkumpul = agg.reduce((a, x) => a + (x._sum.amount ?? 0), 0);
  const totalTransaksi = agg.reduce((a, x) => a + x._count._all, 0);
  const nAktif = types.filter((t) => t.isActive).length;
  const nBulanan = types.filter((t) => t.frequency === "bulanan").length;
  const nSekali = types.length - nBulanan;

  const kartu = (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {types.map((t) => {
        const a = perJenis.get(t.id);
        const terkumpul = a?._sum.amount ?? 0;
        const nTrx = a?._count._all ?? 0;
        return (
          <div key={t.id} className="sheet p-5 flex flex-col">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {t.frequency === "bulanan" ? (
                <Badge variant="success">Bulanan</Badge>
              ) : (
                <Badge variant="warning">Sekali Bayar</Badge>
              )}
              {t.isActive ? (
                <Badge variant="success">Aktif</Badge>
              ) : (
                <Badge variant="neutral">Nonaktif</Badge>
              )}
            </div>
            <p className="font-extrabold text-lg text-ink tracking-tight">{t.name}</p>
            <p className="mt-1">
              <span className="text-2xl font-extrabold text-daun-dark">{rupiah(t.amount)}</span>
              <span className="text-sm text-ink-muted">
                {t.frequency === "bulanan" ? "/bulan" : "/rumah"}
              </span>
            </p>
            <div className="mt-3 rounded-xl bg-slate-50 border border-rule-soft px-3 py-2.5 text-xs text-ink-muted space-y-1">
              {t.frequency === "bulanan" ? (
                <p>
                  Mulai: <strong className="text-ink">{labelMulai(t.startsOn)}</strong>
                </p>
              ) : (
                <p>
                  Batas bayar:{" "}
                  <strong className="text-ink">
                    {t.dueOn ? tanggalPanjang(t.dueOn) : "—"}
                  </strong>
                </p>
              )}
              <p>
                Terkumpul <strong className="text-ink">{nTrx}×</strong> ·{" "}
                <strong className="text-ink">{rupiah(terkumpul)}</strong>
              </p>
            </div>
            {t.description && (
              <p className="text-xs text-ink-muted mt-2 line-clamp-2">{t.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-rule-soft">
              <Link
                href={`/admin/buku-iuran?jenis=${t.id}`}
                className="btn btn-sm btn-quiet"
              >
                📒 Buku Iuran
              </Link>
              <Link href={`/admin/jenis-iuran/${t.id}/ubah`} className="btn btn-sm btn-quiet">
                ✏️ Ubah
              </Link>
              <HapusButton aksi={hapusJenis.bind(null, t.id)} />
            </div>
          </div>
        );
      })}
    </div>
  );

  const tabel = (
    <div className="sheet overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="bg-slate-50 text-left">
              {["Nama", "Frekuensi", "Nominal", "Status", "Terkumpul", "Aksi"].map((h) => (
                <th key={h} className="px-4 py-2.5 font-bold text-ink-muted text-xs uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((t) => {
              const a = perJenis.get(t.id);
              return (
                <tr key={t.id} className="border-t border-rule hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-ink">{t.name}</td>
                  <td className="px-4 py-3">
                    {t.frequency === "bulanan" ? (
                      <Badge variant="success">Bulanan</Badge>
                    ) : (
                      <Badge variant="warning">Sekali Bayar</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-daun-dark whitespace-nowrap">
                    {rupiah(t.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {t.isActive ? <Badge variant="success">Aktif</Badge> : <Badge variant="neutral">Nonaktif</Badge>}
                  </td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {a?._count._all ?? 0}× · {rupiah(a?._sum.amount ?? 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/buku-iuran?jenis=${t.id}`} className="btn btn-sm btn-quiet">
                        📒 Buku
                      </Link>
                      <Link href={`/admin/jenis-iuran/${t.id}/ubah`} className="btn btn-sm btn-quiet">
                        Ubah
                      </Link>
                      <HapusButton aksi={hapusJenis.bind(null, t.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Kicker>Data Master</Kicker>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Jenis Iuran</h1>
        </div>
        <Link href="/admin/jenis-iuran/baru" className="btn btn-primary">
          ＋ Tambah Jenis Iuran
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-5">
        <div className="sheet p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
            Total Terkumpul
          </p>
          <p className="text-2xl font-extrabold text-daun-dark mt-1">{rupiah(totalTerkumpul)}</p>
          <p className="text-xs text-ink-subtle mt-1">{totalTransaksi} transaksi tercatat</p>
        </div>
        <div className="sheet p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">Iuran Aktif</p>
          <p className="text-2xl font-extrabold text-ink mt-1">
            {nAktif} <span className="text-sm font-semibold text-ink-subtle">aktif</span>
          </p>
          <p className="text-xs text-ink-subtle mt-1">{types.length - nAktif} nonaktif</p>
        </div>
        <div className="sheet p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">Kategori</p>
          <p className="text-2xl font-extrabold text-ink mt-1">
            {nBulanan} <span className="text-sm font-semibold text-ink-subtle">Bulanan</span>
          </p>
          <p className="text-xs text-ink-subtle mt-1">{nSekali} Sekali Bayar</p>
        </div>
      </div>

      <div className="mt-6">
        {types.length === 0 ? (
          <EmptyState
            judul="Belum ada jenis iuran"
            deskripsi="Buat jenis iuran pertama agar warga bisa mulai membayar."
            aksi={
              <Link href="/admin/jenis-iuran/baru" className="btn btn-primary">
                ＋ Tambah Jenis Iuran
              </Link>
            }
          />
        ) : (
          <TampilanJenis kartu={kartu} tabel={tabel} />
        )}
      </div>
    </div>
  );
}
