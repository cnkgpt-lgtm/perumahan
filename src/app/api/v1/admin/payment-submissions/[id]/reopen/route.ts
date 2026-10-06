// Admin: POST /api/v1/admin/payment-submissions/[id]/reopen
// Buka kembali pengajuan yang ditolak menjadi "menunggu".
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const s = await prisma.paymentSubmission.findUnique({ where: { id } });
  if (!s) return j({ message: "Pengajuan tidak ditemukan." }, 404);
  if (s.status !== "ditolak") return galat("Hanya pengajuan yang ditolak yang bisa dibuka kembali.");

  await prisma.paymentSubmission.update({
    where: { id, status: "ditolak" },
    data: { status: "menunggu", rejectReason: null, reviewedById: null, reviewedAt: null },
  });

  return j({ message: "Pengajuan dibuka kembali dan menunggu dicek." });
}
