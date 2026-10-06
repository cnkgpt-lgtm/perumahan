import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSettings, waLink } from "@/lib/settings";
import { rupiah, tanggalPanjang, labelPeriode } from "@/lib/format";
import { Kicker, Badge, EmptyState, WaIcon } from "@/components/ui";
import FilterBayar from "./FilterBayar";
import TombolHapus from "./TombolHapus";

export const metadata = { title: "Riwayat Bayar" };

const PER_HALAMAN = 20;

export default async function RiwayatPage({
  searchParams,
}: {
  searchParams: Promise<{ rumah?: string; jenis?: string; hal?: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const sp = await searchParams;
  const settings = await getSettings();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const [households, types] = await Promise.all([
    prisma.household.findMany({ orderBy: { number: "asc" } }),
    prisma.duesType.findMany({ orderBy: { name: "asc" } }),
  ]);
  const rumahAktif = households.some((h) => h.id === sp.rumah) ? (sp.rumah as string) : "";
  const jenisAktif = types.some((t) => t.id === sp.jenis) ? (sp.jenis as string) : "";

  const where = {
    ...(rumahAktif ? { householdId: rumahAktif } : {}),
    ...(jenisAktif ? { duesTypeId: jenisAktif } : {}),
  };
  const total = await prisma.payment.count({ where });
  const totalHal = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const hal = Math.min(Math.max(1, Number(sp.hal) || 1), totalHal);

  const rows = await prisma.payment.findMany({
    where,
    orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }],
    take: PER_HALAMAN,
    skip: (hal - 1) * PER_HALAMAN,
    include: { household: true, duesType: true, recordedBy: true },
  });

  const q = new URLSearchParams();
  if (rumahAktif) q.set("rumah", rumahAktif);
  if (jenisAktif) q.set("jenis", jenisAktif);
  const qs = q.toString() ? `&${q.toString()}` : "";

  return (
    <div>
      <Kicker>Audit Transaksi</Kicker>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Riwayat Pembayaran</h1>
          <p className="text-ink-muted mt-2 max-w-2xl text-sm sm:text-base">
            Daftar semua pembayaran yang telah dicatat. Jika ada salah catat, hapus lalu input kembali.
          </p>
        </div>
        <Link href="/admin" className="btn btn-primary btn-sm no-underline shrink-0">
          + Catat Pembayaran
        </Link>
      </div>

      <FilterBayar
        households={households.map((h) => ({ id: h.id, number: h.number, headName: h.headName }))}
        types={types.map((t) => ({ id: t.id, name: t.name }))}
        rumahAktif={rumahAktif}
        jenisAktif={jenisAktif}
      />

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState judul="Belum ada pembayaran" deskripsi="Belum ada catatan pembayaran yang cocok dengan saringan." />
        </div>
      ) : (
        <>
          <div className="sheet mt-4 divide-y divide-rule-soft">
            {rows.map((p) => {
              const wa = p.household.phone
                ? waLink(
                    p.household.phone,
                    `Halo Bpk/Ibu ${p.household.headName}, berikut bukti tanda terima pembayaran iuran ${p.duesType.name} (${labelPeriode(p.period)}): ${appUrl}/kuitansi/${p.id}`
                  )
                : "";
              return (
                <div key={p.id} className="px-4 sm:px-5 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center justify-center min-w-14 px-2 py-1 rounded-lg bg-ink text-white text-sm font-extrabold">
                      {p.household.number}
                    </span>
                    <span className="font-bold">{p.household.headName}</span>
                    <Badge variant="success">{p.duesType.name} · {labelPeriode(p.period)}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-extrabold text-lg text-ink">{rupiah(p.amount)}</span>
                    <Badge variant="neutral">{p.method.toUpperCase()}</Badge>
                    <span className="text-ink-muted text-xs">Diterima {tanggalPanjang(p.paidOn)}</span>
                    {p.recordedBy && (
                      <span className="text-ink-subtle text-xs">· Oleh {p.recordedBy.name}</span>
                    )}
                  </div>
                  {p.note && <p className="text-xs text-ink-muted italic mt-1">“{p.note}”</p>}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer"
                        className="btn btn-sm btn-quiet no-underline text-emerald-700">
                        <WaIcon className="size-4 text-emerald-600" /> Kirim WA
                      </a>
                    )}
                    <Link href={`/kuitansi/${p.id}`} target="_blank" rel="noopener noreferrer"
                      className="btn btn-sm btn-quiet no-underline">
                      Kuitansi
                    </Link>
                    <TombolHapus id={p.id} label={`${p.household.number} · ${p.duesType.name} ${labelPeriode(p.period)}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {totalHal > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Link href={`/admin/pembayaran?hal=${hal - 1}${qs}`}
                aria-disabled={hal <= 1}
                className={`btn btn-sm btn-quiet no-underline ${hal <= 1 ? "opacity-40 pointer-events-none" : ""}`}>
                ← Sebelumnya
              </Link>
              <span className="text-sm font-bold text-ink-muted">Halaman {hal} dari {totalHal}</span>
              <Link href={`/admin/pembayaran?hal=${hal + 1}${qs}`}
                aria-disabled={hal >= totalHal}
                className={`btn btn-sm btn-quiet no-underline ${hal >= totalHal ? "opacity-40 pointer-events-none" : ""}`}>
                Berikutnya →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
