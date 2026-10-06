import { prisma } from "@/lib/db";
import { availableYears } from "@/lib/ledger";
import { labelPeriode } from "@/lib/format";

// GET /kas/export?tahun=YYYY — unduh CSV mutasi kas (Excel-ready, BOM UTF-8).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const years = await availableYears();
  const tahun = Number(url.searchParams.get("tahun"));
  const year = years.includes(tahun) ? tahun : (years[0] ?? new Date().getFullYear());

  const awal = new Date(year, 0, 1);
  const akhir = new Date(year + 1, 0, 1);

  const [payments, expenses, aggInAwal, aggOutAwal] = await Promise.all([
    prisma.payment.findMany({
      where: { paidOn: { gte: awal, lt: akhir } },
      include: { household: true, duesType: true },
      orderBy: { paidOn: "asc" },
    }),
    prisma.expense.findMany({
      where: { spentOn: { gte: awal, lt: akhir } },
      orderBy: { spentOn: "asc" },
    }),
    prisma.payment.aggregate({ where: { paidOn: { lt: awal } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { spentOn: { lt: awal } }, _sum: { amount: true } }),
  ]);

  const opening = (aggInAwal._sum.amount ?? 0) - (aggOutAwal._sum.amount ?? 0);

  type Baris = { tgl: string; jenis: string; ket: string; masuk: number; keluar: number };
  const items: Baris[] = [
    ...payments.map((p) => ({
      tgl: new Date(p.paidOn).toISOString().slice(0, 10),
      jenis: "Pemasukan",
      ket: `Iuran ${p.duesType.name} (${labelPeriode(p.period)}) - Rumah ${p.household.number} (${p.household.headName})`,
      masuk: p.amount,
      keluar: 0,
    })),
    ...expenses.map((e) => ({
      tgl: new Date(e.spentOn).toISOString().slice(0, 10),
      jenis: "Pengeluaran",
      ket: e.description,
      masuk: 0,
      keluar: e.amount,
    })),
  ].sort((a, b) => a.tgl.localeCompare(b.tgl));

  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines: string[] = [];
  lines.push(["Tanggal", "Jenis", "Keterangan Transaksi", "Pemasukan (Rp)", "Pengeluaran (Rp)", "Saldo (Rp)"].map(esc).join(","));
  let saldo = opening;
  let totalIn = 0;
  let totalOut = 0;
  lines.push([`${year}-01-01`, "Saldo Awal", "Saldo Pindahan dari Tahun Sebelumnya", 0, 0, saldo].map(esc).join(","));
  for (const it of items) {
    saldo += it.masuk - it.keluar;
    totalIn += it.masuk;
    totalOut += it.keluar;
    lines.push([it.tgl, it.jenis, it.ket, it.masuk, it.keluar, saldo].map(esc).join(","));
  }
  lines.push(["TOTAL", "", `Total Mutasi Tahun ${year}`, totalIn, totalOut, saldo].map(esc).join(","));

  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="buku-kas-${year}-${stamp}.csv"`,
    },
  });
}
