// GET /api/v1/dues-types — daftar jenis iuran aktif.
import { prisma } from "@/lib/db";
import { j } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.duesType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return j(
    rows.map((t) => ({
      id: t.id,
      name: t.name,
      amount: t.amount,
      frequency: t.frequency,
      starts_on: t.startsOn ? t.startsOn.toISOString().slice(0, 10) : null,
      due_on: t.dueOn ? t.dueOn.toISOString().slice(0, 10) : null,
      description: t.description,
    })),
  );
}
