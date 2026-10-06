import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rupiah, tanggalWaktu, labelPeriode } from "@/lib/format";
import { Kicker, Badge, EmptyState } from "@/components/ui";
import FormTerima from "./FormTerima";
import FormTolak from "./FormTolak";
import TombolAksi from "./TombolAksi";

export const metadata = { title: "Konfirmasi Bayar" };

function relatif(d: Date): string {
  const ms = Date.now() - d.getTime();
  const mnt = Math.floor(ms / 60000);
  if (mnt < 1) return "baru saja";
  if (mnt < 60) return `${mnt} mnt lalu`;
  const jam = Math.floor(mnt / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  return tanggalWaktu(d);
}

const TAB = [
  { v: "menunggu", label: "Menunggu" },
  { v: "disetujui", label: "Diterima" },
  { v: "ditolak", label: "Ditolak" },
] as const;

export default async function KonfirmasiPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const sp = await searchParams;
  const statusAktif = sp.status === "disetujui" || sp.status === "ditolak" ? sp.status : "menunggu";

  const [cMenunggu, cDisetujui, cDitolak] = await Promise.all([
    prisma.paymentSubmission.count({ where: { status: "menunggu" } }),
    prisma.paymentSubmission.count({ where: { status: "disetujui" } }),
    prisma.paymentSubmission.count({ where: { status: "ditolak" } }),
  ]);
  const counts: Record<string, number> = { menunggu: cMenunggu, disetujui: cDisetujui, ditolak: cDitolak };

  const subs = await prisma.paymentSubmission.findMany({
    where: { status: statusAktif },
    orderBy: { createdAt: "desc" },
    include: {
      household: { select: { id: true, number: true, headName: true, phone: true } },
      duesType: { select: { id: true, name: true, amount: true } },
      bankAccount: { select: { bankName: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  // Periode yang keburu tercatat lunas (untuk warning amber).
  const payments = await prisma.payment.findMany({
    where: {
      OR: subs.map((x) => ({ householdId: x.householdId, duesTypeId: x.duesTypeId })),
    },
    select: { householdId: true, duesTypeId: true, period: true },
  });
  const lunasSet = new Set(
    payments.map((p) => `${p.householdId}|${p.duesTypeId}|${p.period}`)
  );

  return (
    <div>
      <Kicker>Bayar Online Warga</Kicker>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Konfirmasi Pembayaran</h1>
          <p className="text-ink-muted mt-2 max-w-2xl text-sm sm:text-base">
            Cocokkan bukti dengan mutasi rekening. Setelah diterima, iuran otomatis tercatat lunas.
          </p>
        </div>
        <Link href="/admin/rekening" className="btn btn-quiet btn-sm no-underline shrink-0">
          Atur Rekening
        </Link>
      </div>

      <div className="flex gap-2 mt-5 flex-wrap">
        {TAB.map((t) => (
          <Link key={t.v} href={`/admin/konfirmasi?status=${t.v}`}
            className={`btn btn-sm no-underline ${statusAktif === t.v ? "btn-primary" : "btn-quiet"}`}>
            {t.label}
            {counts[t.v] > 0 && (
              <span className={`min-w-6 h-6 px-1.5 rounded-full text-xs font-extrabold flex items-center justify-center ${
                t.v === "menunggu" ? "bg-amber-400 text-amber-950" : "bg-slate-200 text-slate-700"
              }`}>
                {counts[t.v]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {subs.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            judul={statusAktif === "menunggu" ? "Tidak ada yang menunggu" : statusAktif === "disetujui" ? "Belum ada yang diterima" : "Belum ada yang ditolak"}
            deskripsi="Semua pengajuan bukti bayar warga akan muncul di sini."
          />
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {subs.map((sub) => {
            const periods = sub.periods as string[];
            const sudahLunas = periods.filter((p) =>
              lunasSet.has(`${sub.householdId}|${sub.duesTypeId}|${p}`)
            );
            const total = periods.length * sub.unitAmount + sub.uniqueCode;
            const isGambar = sub.proofType.startsWith("image/");
            const buktiUrl = `/api/gambar/bukti/${sub.id}`;
            return (
              <section key={sub.id} className="sheet p-4 sm:p-5">
                <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                  <a href={buktiUrl} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 block w-28 h-28 rounded-xl overflow-hidden border border-rule bg-slate-50 no-underline"
                    title="Buka bukti di tab baru">
                    {isGambar ? (
                      <img src={buktiUrl} alt="Bukti bayar warga" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="w-full h-full flex flex-col items-center justify-center text-ink-muted text-xs font-bold gap-1 p-2 text-center">
                        <span className="text-2xl">📄</span> Lihat bukti
                      </span>
                    )}
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center justify-center min-w-14 px-2 py-1 rounded-lg bg-ink text-white text-sm font-extrabold">
                            {sub.household.number}
                          </span>
                          <span className="font-extrabold">{sub.household.headName}</span>
                          {statusAktif === "menunggu" && <Badge variant="warning">Menunggu</Badge>}
                          {statusAktif === "disetujui" && <Badge variant="success">✓ Diterima</Badge>}
                          {statusAktif === "ditolak" && <Badge variant="danger">Ditolak</Badge>}
                        </div>
                        <p className="text-sm text-ink-muted mt-1.5">
                          {sub.duesType.name} · {periods.map(labelPeriode).join(", ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-black text-ink">{rupiah(total)}</p>
                        <p className="text-xs text-ink-muted">
                          {periods.length} × {rupiah(sub.unitAmount)}
                          {sub.uniqueCode > 0 && (
                            <span className="text-amber-700 font-bold"> + kode unik {sub.uniqueCode}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-3 text-sm">
                      <div>
                        <dt className="text-xs text-ink-subtle font-semibold">Ke rekening</dt>
                        <dd className="font-bold">{sub.bankAccount?.bankName ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-subtle font-semibold">Dikirim</dt>
                        <dd className="font-bold">{tanggalWaktu(sub.createdAt)} <span className="font-normal text-ink-muted">({relatif(new Date(sub.createdAt))})</span></dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-subtle font-semibold">Pengirim</dt>
                        <dd className="font-bold">{sub.payerName ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-subtle font-semibold">WA</dt>
                        <dd className="font-bold">{sub.phone ?? sub.household.phone ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-subtle font-semibold">Kode</dt>
                        <dd className="font-mono font-bold">{sub.code}</dd>
                      </div>
                    </dl>

                    {sub.note && (
                      <p className="text-sm text-ink-muted italic mt-2">“{sub.note}”</p>
                    )}

                    {sudahLunas.length > 0 && (
                      <p className="mt-3 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                        ⚠️ Periode {sudahLunas.map(labelPeriode).join(", ")} sudah tercatat lunas sebelumnya — tidak akan dibuatkan catatan ganda.
                      </p>
                    )}
                  </div>
                </div>

                {statusAktif === "menunggu" && (
                  <>
                    <FormTerima
                      submissionId={sub.id}
                      periods={periods}
                      sudahLunas={sudahLunas}
                      unitAmount={sub.unitAmount}
                      uniqueCode={sub.uniqueCode}
                    />
                    <FormTolak submissionId={sub.id} />
                  </>
                )}

                {statusAktif !== "menunggu" && (
                  <div className="mt-4 rounded-2xl border border-rule bg-slate-50/60 px-4 py-3 flex items-center gap-3 flex-wrap">
                    <p className="text-sm text-ink-muted flex-1 min-w-40">
                      {statusAktif === "disetujui" ? "✓ Diterima" : "Ditolak"} oleh{" "}
                      <strong className="text-ink">{sub.reviewedBy?.name ?? "pengurus"}</strong>
                      {sub.reviewedAt && <> · {tanggalWaktu(sub.reviewedAt)}</>}
                      {statusAktif === "disetujui" && sub.approvedPeriods && (
                        <> · {(sub.approvedPeriods as string[]).map(labelPeriode).join(", ")}</>
                      )}
                      {statusAktif === "ditolak" && sub.rejectReason && (
                        <> · Alasan: <em>{sub.rejectReason}</em></>
                      )}
                    </p>
                    {statusAktif === "ditolak" ? (
                      <TombolAksi
                        id={sub.id}
                        aksi="kembalikan"
                        label="Kembalikan ke menunggu"
                        tanya="Kembalikan pengajuan ini ke status menunggu?"
                      />
                    ) : (
                      <TombolAksi
                        id={sub.id}
                        aksi="batalkan"
                        label="Batalkan konfirmasi"
                        tanya="Batalkan konfirmasi ini? Catatan pembayaran yang dibuat akan dihapus dan pengajuan kembali menunggu."
                        className="btn btn-sm btn-danger"
                      />
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
