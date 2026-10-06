// Admin: DELETE /api/v1/admin/payments/[id] — hapus catatan pembayaran.
import { prisma } from "@/lib/db";
import { j, butuhAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.payment.findUnique({ where: { id } });
  if (!ada) return j({ message: "Pembayaran tidak ditemukan." }, 404);

  await prisma.payment.delete({ where: { id } });
  return j({ message: "Catatan pembayaran dihapus." });
}
