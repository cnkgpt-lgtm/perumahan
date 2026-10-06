import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// Menyajikan gambar yang disimpan sebagai Bytes di database.
// kind: kabar | popup | qris | bukti | kk
// bukti & kk hanya untuk pengurus yang login.
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  let data: Buffer | null = null;
  let type = "image/jpeg";

  if (kind === "kabar") {
    const p = await prisma.post.findUnique({ where: { id }, select: { image: true, imageType: true } });
    if (p?.image) {
      data = Buffer.from(p.image);
      type = p.imageType || type;
    }
  } else if (kind === "popup") {
    const p = await prisma.post.findUnique({ where: { id }, select: { popupImage: true, popupImageType: true } });
    if (p?.popupImage) {
      data = Buffer.from(p.popupImage);
      type = p.popupImageType || type;
    }
  } else if (kind === "qris") {
    const a = await prisma.bankAccount.findUnique({ where: { id }, select: { qrisImage: true, qrisImageType: true } });
    if (a?.qrisImage) {
      data = Buffer.from(a.qrisImage);
      type = a.qrisImageType || type;
    }
  } else if (kind === "bukti" || kind === "kk") {
    const session = await auth();
    if (!session?.user) return new NextResponse("Perlu login", { status: 401 });
    if (kind === "bukti") {
      const s = await prisma.paymentSubmission.findUnique({ where: { id }, select: { proofImage: true, proofType: true } });
      if (s) {
        data = Buffer.from(s.proofImage);
        type = s.proofType || type;
      }
    } else {
      const h = await prisma.household.findUnique({ where: { id }, select: { kkImage: true, kkImageType: true } });
      if (h?.kkImage) {
        data = Buffer.from(h.kkImage);
        type = h.kkImageType || type;
      }
    }
  } else {
    return new NextResponse("Jenis gambar tidak dikenal", { status: 400 });
  }

  if (!data) return new NextResponse("Gambar tidak ditemukan", { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
