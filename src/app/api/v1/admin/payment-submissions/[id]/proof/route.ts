// Admin: GET /api/v1/admin/payment-submissions/[id]/proof — alihkan ke gambar bukti.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { j, butuhAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const s = await prisma.paymentSubmission.findUnique({ where: { id }, select: { id: true } });
  if (!s) return j({ message: "Pengajuan tidak ditemukan." }, 404);

  return NextResponse.redirect(new URL(`/api/gambar/bukti/${id}`, req.url));
}
