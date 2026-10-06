// Admin: POST /api/v1/admin/payment-submissions/[id]/cancel
// Batalkan persetujuan: kembalikan ke "menunggu" dan hapus pembayaran otomatisnya.
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { j, galat, butuhAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const s = await prisma.paymentSubmission.findUnique({ where: { id } });
  if (!s) return j({ message: "Pengajuan tidak ditemukan." }, 404);
  if (s.status !== "disetujui") return galat("Hanya pengajuan yang disetujui yang bisa dibatalkan.");

  await prisma.$transaction(async (tx) => {
    const kunci = await tx.paymentSubmission.updateMany({
      where: { id, status: "disetujui" },
      data: {
        status: "menunggu",
        approvedPeriods: Prisma.DbNull,
        rejectReason: null,
        reviewedById: null,
        reviewedAt: null,
      },
    });
    if (kunci.count === 0) throw new Error("SUDAH_DIPROSES");
    await tx.payment.deleteMany({ where: { submissionId: id } });
  });

  return j({ message: "Persetujuan dibatalkan, pengajuan kembali menunggu dicek." });
}
