import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings, waLink, cleanPhone } from "@/lib/settings";
import { rupiah, terbilang, tanggalPanjang, labelPeriode, nomorKuitansi } from "@/lib/format";
import { WaIcon } from "@/components/ui";
import TombolCetak from "./TombolCetak";

export default async function KuitansiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { household: true, duesType: true, recordedBy: true },
  });
  if (!payment) notFound();

  const settings = await getSettings();
  const siteName = settings.site_name || "SISTER";
  const noKuitansi = nomorKuitansi(payment.paidOn, payment.nomor);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const urlKuitansi = `${appUrl}/kuitansi/${payment.id}`;

  const waUrl = waLink(
    cleanPhone(payment.household.phone) || undefined,
    `Halo Bpk/Ibu ${payment.household.headName}, berikut bukti tanda terima pembayaran iuran ${payment.duesType.name} (${labelPeriode(payment.period)}): ${urlKuitansi}`,
  );

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`@media print {
        @page { margin: 0.8cm; size: auto; }
        html, body { background: #fff !important; color: #000 !important; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        header, footer, nav { display: none !important; }
        main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
        .receipt-card { background: #fff !important; border: 2px solid #0f172a !important; box-shadow: none !important; }
      }`}</style>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/iuran" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-daun no-underline">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" x2="5" y1="12" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Kembali
        </Link>
        <div className="flex items-center gap-2">
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs no-underline flex items-center gap-1.5 shadow-xs">
            <WaIcon className="size-3.5" /> Bagikan ke WA
          </a>
          <TombolCetak />
        </div>
      </div>

      <div className="receipt-card rounded-2xl border p-6 sm:p-8 shadow-xs" style={{ background: "#fffbf2", borderColor: "#d9cfbb" }}>
        <div className="flex items-start justify-between gap-4 pb-5 border-b-2 border-dashed" style={{ borderColor: "#d9cfbb" }}>
          <div>
            <p className="font-serif font-black text-xl sm:text-2xl tracking-tight">{siteName}</p>
            <p className="text-xs text-ink-muted mt-1">Papan Informasi &amp; Pengelolaan Kas Warga RT/RW</p>
            {settings.address && <p className="text-xs text-ink-muted">{settings.address}</p>}
          </div>
          <div className="text-right shrink-0">
            <span className="badge badge-success mb-1">Kuitansi Resmi</span>
            <p className="text-xs font-mono font-bold mt-1">No: {noKuitansi}</p>
          </div>
        </div>

        <div className="text-center mt-6 relative">
          <h1 className="font-serif font-extrabold text-lg sm:text-xl underline underline-offset-4 decoration-2">
            TANDA TERIMA PEMBAYARAN IURAN
          </h1>
          <div className="absolute right-0 sm:right-6 top-0 -rotate-6">
            <span className="inline-block px-3 py-1.5 border-2 border-dashed border-daun text-daun-dark font-black text-sm rounded-md bg-daun-soft/50">
              ✓ LUNAS
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-2">{tanggalPanjang(payment.paidOn)}</p>
        </div>

        <dl className="grid sm:grid-cols-3 gap-x-6 gap-y-4 mt-6 text-sm">
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-subtle font-semibold uppercase tracking-wide">Telah Diterima Dari</dt>
            <dd className="font-bold mt-0.5">
              {payment.household.headName}{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-ink text-white text-xs font-extrabold ml-1">
                Rumah {payment.household.number}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-subtle font-semibold uppercase tracking-wide">Untuk Pembayaran</dt>
            <dd className="font-bold mt-0.5">{payment.duesType.name} · {labelPeriode(payment.period)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-subtle font-semibold uppercase tracking-wide">Metode Pembayaran</dt>
            <dd className="font-bold mt-0.5 capitalize">{payment.method}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-subtle font-semibold uppercase tracking-wide">Tanggal Diterima</dt>
            <dd className="font-bold mt-0.5">{tanggalPanjang(payment.paidOn)}</dd>
          </div>
          {payment.note && (
            <div>
              <dt className="text-xs text-ink-subtle font-semibold uppercase tracking-wide">Catatan</dt>
              <dd className="font-bold mt-0.5">{payment.note}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 rounded-xl bg-daun-soft border border-daun/25 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-daun-dark">Jumlah Pembayaran</p>
          <p className="text-2xl sm:text-3xl font-black text-daun-dark mt-1">{rupiah(payment.amount)}</p>
          <p className="text-sm font-semibold text-daun-dark/80 mt-1 italic">
            # {terbilang(payment.amount).replace(/\b\w/g, (c) => c.toUpperCase())} Rupiah #
          </p>
        </div>

        <div className="mt-6 pt-4 border-t flex items-end justify-between gap-4 text-xs text-ink-muted" style={{ borderColor: "#d9cfbb" }}>
          <div>
            <p className="font-bold text-ink">Verifikasi Sistem</p>
            <p className="break-all">{urlKuitansi}</p>
          </div>
          <div className="text-center shrink-0">
            <p>Dicatat oleh:</p>
            <p className="font-serif italic text-ink-muted my-4">[ Tanda Terima Digital ]</p>
            <p className="font-bold text-ink underline underline-offset-2">{payment.recordedBy?.name ?? "Pengurus"}</p>
            <p>Pengurus / Bendahara</p>
          </div>
        </div>
      </div>
    </div>
  );
}
