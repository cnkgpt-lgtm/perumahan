// GET /api/v1/dues/ledger?jenis={id}&tahun={yyyy} — buku iuran per jenis & tahun.
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { monthlyGrid, onceList } from "@/lib/ledger";
import { j, galat } from "@/lib/api";

type StatusBulan = "lunas" | "dicek" | "belum" | "depan";

function statusBulan(
  period: string,
  hid: string,
  paid: Record<string, Record<string, boolean>>,
  pending: Record<string, Record<string, boolean>>,
  ymNow: string,
): StatusBulan {
  if (paid[hid]?.[period]) return "lunas";
  if (pending[hid]?.[period]) return "dicek";
  if (period > ymNow) return "depan";
  return "belum";
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const jenis = url.searchParams.get("jenis") ?? "";
  const tahun = parseInt(url.searchParams.get("tahun") ?? String(new Date().getFullYear()), 10);
  if (!jenis) return galat("Parameter 'jenis' (id jenis iuran) wajib diisi.");
  if (!tahun || tahun < 2000 || tahun > 2100) return galat("Parameter 'tahun' tidak valid.");

  const type = await prisma.duesType.findUnique({ where: { id: jenis } });
  if (!type) return j({ message: "Jenis iuran tidak ditemukan." }, 404);

  const now = new Date();
  const ymNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (type.frequency === "bulanan") {
    const { households, paid, pending } = await monthlyGrid(type.id, tahun);
    const paidBool: Record<string, Record<string, boolean>> = {};
    for (const [hid, map] of Object.entries(paid)) {
      paidBool[hid] = {};
      for (const period of Object.keys(map)) paidBool[hid][period] = true;
    }
    const months = Array.from({ length: 12 }, (_, i) => `${tahun}-${String(i + 1).padStart(2, "0")}`);
    return j({
      type: "bulanan",
      year: tahun,
      months,
      households: households.map((h) => ({
        id: h.id,
        number: h.number,
        head_name: h.headName,
        months: Object.fromEntries(
          months.map((m) => [m, statusBulan(m, h.id, paidBool, pending, ymNow)]),
        ),
      })),
    });
  }

  const { households, paid, pending } = await onceList(type.id);
  return j({
    type: "sekali",
    households: households.map((h) => ({
      id: h.id,
      number: h.number,
      head_name: h.headName,
      status: paid[h.id] ? "lunas" : pending[h.id] ? "dicek" : "belum",
      paid_on: paid[h.id] ? paid[h.id].paidOn.toISOString().slice(0, 10) : null,
    })),
  });
}
