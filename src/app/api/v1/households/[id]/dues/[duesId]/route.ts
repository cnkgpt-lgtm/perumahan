// GET /api/v1/households/[id]/dues/[duesId]?tahun={yyyy}
// Status iuran satu rumah untuk satu jenis iuran.
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { labelPeriode } from "@/lib/format";
import { j, galat } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; duesId: string }> },
) {
  const { id, duesId } = await params;
  const url = new URL(req.url);
  const tahun = parseInt(url.searchParams.get("tahun") ?? String(new Date().getFullYear()), 10);
  if (!tahun || tahun < 2000 || tahun > 2100) return galat("Parameter 'tahun' tidak valid.");

  const [household, type] = await Promise.all([
    prisma.household.findUnique({ where: { id } }),
    prisma.duesType.findUnique({ where: { id: duesId } }),
  ]);
  if (!household) return j({ message: "Rumah tidak ditemukan." }, 404);
  if (!type) return j({ message: "Jenis iuran tidak ditemukan." }, 404);

  const payments = await prisma.payment.findMany({
    where: { householdId: id, duesTypeId: duesId },
    select: { period: true },
  });
  const lunas = new Set(payments.map((p) => p.period));

  const pendingSubs = await prisma.paymentSubmission.findMany({
    where: { householdId: id, duesTypeId: duesId, status: "menunggu" },
    select: { periods: true },
  });
  const dicek = new Set<string>();
  for (const s of pendingSubs) for (const p of s.periods as string[]) dicek.add(p);

  const now = new Date();
  const ymNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const periods =
    type.frequency === "bulanan"
      ? Array.from({ length: 12 }, (_, i) => `${tahun}-${String(i + 1).padStart(2, "0")}`)
      : [""];

  return j({
    household: { id: household.id, number: household.number, head_name: household.headName },
    dues_type: { id: type.id, name: type.name, amount: type.amount, frequency: type.frequency },
    periods: periods.map((p) => ({
      period: p,
      label: labelPeriode(p),
      status: lunas.has(p) ? "lunas" : dicek.has(p) ? "dicek" : p !== "" && p > ymNow ? "depan" : "belum",
    })),
  });
}
