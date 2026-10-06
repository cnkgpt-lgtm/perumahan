import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { rupiah, labelPeriode, tanggalWaktu } from "@/lib/format";
import { Badge, Kicker } from "@/components/ui";

export default async function CekBayarPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const s = await prisma.paymentSubmission.findUnique({
    where: { code: code.toUpperCase() },
    include: { household: true, duesType: true, bankAccount: true },
  });
  if (!s) notFound();

  const periods = s.periods as string[];
  const approved = (s.approvedPeriods as string[] | null) ?? [];
  const sebagian = s.status === "disetujui" && approved.length < periods.length;
  const total = s.unitAmount * periods.length + s.uniqueCode;

  return (
    <div className="max-w-xl mx-auto">
      <Kicker>Status Pengajuan</Kicker>
      <div className="sheet p-6 sm:p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-subtle">Kode kiriman</p>
        <p className="font-mono text-3xl font-black tracking-widest mt-1">{s.code}</p>
        <div className="mt-3 flex justify-center">
          {s.status === "menunggu" && <Badge variant="warning">Dicek</Badge>}
          {s.status === "disetujui" && !sebagian && <Badge variant="success">✓ Diterima</Badge>}
          {s.status === "disetujui" && sebagian && <Badge variant="warning">Sebagian diterima</Badge>}
          {s.status === "ditolak" && <Badge variant="danger">Ditolak</Badge>}
        </div>
      </div>

      <div className="mt-4">
        {s.status === "menunggu" && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <p className="font-extrabold text-amber-900">Menunggu dicek pengurus</p>
            <p className="text-sm text-amber-800 mt-1">
              Bukti pembayaran Anda sudah terkirim. Simpan halaman ini atau catat kode kiriman di atas untuk
              mengecek statusnya lagi nanti.
            </p>
          </div>
        )}
        {sebagian && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <p className="font-extrabold text-amber-900">Pembayaran diterima sebagian</p>
            <p className="text-sm text-amber-800 mt-1">
              Diterima: {approved.map(labelPeriode).join(", ")}.
              Belum: {periods.filter((p) => !approved.includes(p)).map(labelPeriode).join(", ")}.
            </p>
            {s.rejectReason && <p className="text-sm text-amber-800 mt-2">Alasan: {s.rejectReason}</p>}
            <Link href={`/bayar?rumah=${s.householdId}&jenis=${s.duesTypeId}`} className="btn btn-sm btn-primary mt-3 no-underline">
              Bayar bulan yang belum
            </Link>
          </div>
        )}
        {s.status === "disetujui" && !sebagian && (
          <div className="rounded-2xl border border-daun/30 bg-daun-soft p-5">
            <p className="font-extrabold text-daun-dark">✓ Pembayaran diterima dan sudah tercatat lunas</p>
            <p className="text-sm text-daun-dark/80 mt-1">Terima kasih! Iuran Anda sudah masuk buku catatan.</p>
          </div>
        )}
        {s.status === "ditolak" && (
          <div className="rounded-2xl border border-terakota/30 bg-terakota-soft p-5">
            <p className="font-extrabold text-terakota">Pembayaran belum bisa diterima</p>
            {s.rejectReason && <p className="text-sm text-terakota/90 mt-1">Alasan: {s.rejectReason}</p>}
            <Link href={`/bayar?rumah=${s.householdId}&jenis=${s.duesTypeId}`} className="btn btn-sm btn-primary mt-3 no-underline">
              Kirim ulang bukti
            </Link>
          </div>
        )}
      </div>

      <dl className="sheet p-5 sm:p-6 mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-ink-subtle font-semibold">Rumah</dt>
          <dd className="font-bold">{s.household.number} · {s.household.headName}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-subtle font-semibold">Iuran</dt>
          <dd className="font-bold">{s.duesType.name}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-ink-subtle font-semibold">Periode</dt>
          <dd className="font-bold">{periods.map(labelPeriode).join(", ")}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-subtle font-semibold">Jumlah</dt>
          <dd className="font-bold">
            {rupiah(total)}
            {s.uniqueCode > 0 && <span className="block text-xs font-semibold text-ink-subtle">termasuk kode unik {s.uniqueCode}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-subtle font-semibold">Ke rekening</dt>
          <dd className="font-bold">{s.bankAccount?.bankName ?? "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-ink-subtle font-semibold">Dikirim</dt>
          <dd className="font-bold">{tanggalWaktu(s.createdAt)}</dd>
        </div>
      </dl>

      <div className="flex gap-2 mt-5 flex-wrap">
        <Link href="/iuran" className="btn btn-quiet btn-sm no-underline">Lihat Cek Iuran</Link>
        <Link href="/bayar" className="btn btn-quiet btn-sm no-underline">Bayar iuran lain</Link>
      </div>
    </div>
  );
}
