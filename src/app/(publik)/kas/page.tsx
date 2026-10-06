import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { rupiah, tanggalPanjang, namaBulan } from "@/lib/format";
import { cashbook, availableYears } from "@/lib/ledger";
import { Kicker, Badge, WaIcon } from "@/components/ui";
import SalinKas from "./SalinKas";
import PilihTahun from "./PilihTahun";

export default async function KasPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const sp = await searchParams;
  const settings = await getSettings();
  const siteName = settings.site_name || "SISTER";

  const years = await availableYears();
  const year = years.includes(Number(sp.tahun)) ? Number(sp.tahun) : (years[0] ?? new Date().getFullYear());
  const book = await cashbook(year);
  const expenses = await prisma.expense.findMany({
    where: {
      spentOn: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
    orderBy: { spentOn: "desc" },
  });
  const totalTransaksiKeluar = expenses.length;

  const topExpenses = expenses.slice(0, 3);
  let barisPengeluaran = "";
  if (topExpenses.length > 0) {
    barisPengeluaran = "🧾 *Pengeluaran Terakhir:*\n";
    for (const e of topExpenses) barisPengeluaran += `• ${e.description} (${rupiah(e.amount)})\n`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const teksWA =
    `📢 *LAPORAN KAS RT TAHUN ${year}*\n` +
    `*${siteName}*\n` +
    `───────────────────────────\n` +
    `💰 *Saldo Awal:* ${rupiah(book.opening)}\n` +
    `📥 *Total Pemasukan:* ${rupiah(book.totalIn)}\n` +
    `📤 *Total Pengeluaran:* ${rupiah(book.totalOut)}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💵 *Sisa Saldo Kas:* ${rupiah(book.closing)}\n` +
    barisPengeluaran +
    `\n🔗 *Buku kas transparan lengkap:* \n${appUrl}/kas?tahun=${year}`;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <Kicker>Transparansi Keuangan</Kicker>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Kas Warga Tahun {year}</h1>
          <p className="mt-1 text-sm text-ink-muted max-w-2xl">
            Laporan uang kas RT/RW terbuka. Uang masuk bersumber dari iuran yang dicatat bendahara, uang keluar
            dari pengeluaran resmi kas.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SalinKas teks={teksWA} />
          <a href={`/kas/export?tahun=${year}`} className="btn btn-quiet btn-sm no-underline">
            Unduh CSV
          </a>
          <PilihTahun years={years} tahun={year} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-daun-dark to-emerald-900 text-white shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">Saldo Kas</p>
          <p className="text-2xl font-extrabold mt-1">{rupiah(book.closing)}</p>
          <p className="text-xs text-emerald-200/80 mt-1">Saldo riil kas per hari ini</p>
        </div>
        <div className="sheet p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Total Pemasukan</p>
          <p className="text-2xl font-extrabold mt-1 text-daun-dark">{rupiah(book.totalIn)}</p>
          <p className="text-xs text-ink-subtle mt-1">Dari iuran warga tercatat</p>
        </div>
        <div className="sheet p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Total Pengeluaran</p>
          <p className="text-2xl font-extrabold mt-1 text-terakota">{rupiah(book.totalOut)}</p>
          <p className="text-xs text-ink-subtle mt-1">{totalTransaksiKeluar} transaksi pengeluaran</p>
        </div>
      </div>

      <div className="sheet overflow-hidden mb-6">
        <h2 className="font-extrabold tracking-tight px-5 pt-5 pb-3">Rekap Kas Bulanan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-y border-rule bg-slate-50/60 text-left">
                <th className="px-5 py-3 font-bold">Bulan</th>
                <th className="px-4 py-3 font-bold text-right">Uang Masuk</th>
                <th className="px-4 py-3 font-bold text-right">Uang Keluar</th>
                <th className="px-5 py-3 font-bold text-right">Saldo Akhir</th>
              </tr>
            </thead>
            <tbody>
              {book.opening !== 0 && (
                <tr className="border-b border-rule-soft text-ink-muted">
                  <td className="px-5 py-3 italic" colSpan={3}>Saldo pindahan dari tahun lalu</td>
                  <td className="px-5 py-3 text-right font-bold">{rupiah(book.opening)}</td>
                </tr>
              )}
              {book.rows.map((r) => (
                <tr key={r.bulan} className="border-b border-rule-soft last:border-0">
                  <td className="px-5 py-3 font-semibold">{namaBulan(r.bulan)}</td>
                  <td className="px-4 py-3 text-right text-daun-dark font-semibold">+{rupiah(r.masuk)}</td>
                  <td className="px-4 py-3 text-right text-amber-700 font-semibold">{r.keluar ? "−" + rupiah(r.keluar) : rupiah(0)}</td>
                  <td className="px-5 py-3 text-right font-extrabold">{rupiah(r.saldo)}</td>
                </tr>
              ))}
              {book.rows.length === 0 && book.opening === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-ink-muted text-sm">Belum ada mutasi kas tahun {year}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sheet p-5">
        <h2 className="font-extrabold tracking-tight mb-4">Rincian Pengeluaran {year}</h2>
        <div className="space-y-3">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-terakota-soft text-terakota flex items-center justify-center shrink-0">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" x2="8" y1="13" y2="13" />
                  <line x1="16" x2="8" y1="17" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{e.description}</p>
                <p className="text-xs text-ink-subtle">{tanggalPanjang(e.spentOn)}</p>
              </div>
              <Badge variant="danger">−{rupiah(e.amount)}</Badge>
            </div>
          ))}
          {expenses.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-6">Belum ada pengeluaran tercatat tahun {year}.</p>
          )}
        </div>
      </div>
    </div>
  );
}
