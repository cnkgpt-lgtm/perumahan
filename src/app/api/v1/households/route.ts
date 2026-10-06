// GET /api/v1/households — daftar rumah aktif (tanpa nomor HP).
import { prisma } from "@/lib/db";
import { j } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.household.findMany({
    where: { isActive: true },
    orderBy: { number: "asc" },
    select: { id: true, number: true, headName: true },
  });
  return j(
    rows.map((h) => ({ id: h.id, number: h.number, head_name: h.headName })),
  );
}
