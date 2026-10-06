// Admin: GET /api/v1/admin/payment-submissions — daftar pengajuan bukti bayar.
// Admin: GET/POST share format ringkas/detail pengajuan.
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { j, butuhAdmin, paginasi, metaHalaman, ringkasPengajuan } from "@/lib/api";


// GET ?status=menunggu|disetujui|ditolak&halaman=&per_halaman=
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  if (status && !["menunggu", "disetujui", "ditolak"].includes(status)) {
    return j({ message: "Status tidak dikenal." }, 422);
  }
  const { halaman, per, lewati } = paginasi(url, 20);
  const where = status ? { status } : {};

  const [total, rows] = await Promise.all([
    prisma.paymentSubmission.count({ where }),
    prisma.paymentSubmission.findMany({
      where,
      include: { household: true, duesType: true, bankAccount: true },
      orderBy: { createdAt: "desc" },
      skip: lewati,
      take: per,
    }),
  ]);

  return j({ data: rows.map(ringkasPengajuan), meta: metaHalaman(total, halaman, per) });
}
