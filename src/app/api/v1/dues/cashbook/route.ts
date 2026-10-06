// GET /api/v1/dues/cashbook?tahun={yyyy} — rekap buku kas per bulan.
import { NextRequest } from "next/server";
import { cashbook } from "@/lib/ledger";
import { j, galat } from "@/lib/api";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tahun = parseInt(url.searchParams.get("tahun") ?? String(new Date().getFullYear()), 10);
  if (!tahun || tahun < 2000 || tahun > 2100) return galat("Parameter 'tahun' tidak valid.");

  const cb = await cashbook(tahun);
  return j({
    year: tahun,
    opening: cb.opening,
    rows: cb.rows.map((r) => ({ bulan: r.bulan, masuk: r.masuk, keluar: r.keluar, saldo: r.saldo })),
    total_in: cb.totalIn,
    total_out: cb.totalOut,
    closing: cb.closing,
  });
}
