// Admin: POST /api/v1/admin/payment-submissions/[id]/reject — tolak pengajuan.
// Body: { reject_reason: string }
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin } from "@/lib/api";

const schema = z.object({
  reject_reason: z.string().trim().min(1, "Alasan penolakan wajib diisi.").max(500),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");

  const s = await prisma.paymentSubmission.findUnique({ where: { id } });
  if (!s) return j({ message: "Pengajuan tidak ditemukan." }, 404);
  if (s.status !== "menunggu") return galat("Pengajuan ini sudah diproses sebelumnya.");

  await prisma.paymentSubmission.update({
    where: { id, status: "menunggu" },
    data: {
      status: "ditolak",
      rejectReason: parsed.data.reject_reason,
      reviewedById: uid,
      reviewedAt: new Date(),
    },
  });

  return j({ message: "Pengajuan ditolak." });
}
