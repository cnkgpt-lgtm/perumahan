// GET /api/v1/bank-accounts — daftar rekening tujuan pembayaran.
import { prisma } from "@/lib/db";
import { j } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: [{ position: "asc" }, { bankName: "asc" }],
  });
  return j(
    rows.map((a) => ({
      id: a.id,
      bank_name: a.bankName,
      account_number: a.accountNumber,
      account_name: a.accountName,
      has_qris: !!(a.qrisImage || a.qrisPayload),
      qris_image_url: a.qrisImage ? `/api/gambar/qris/${a.id}` : null,
    })),
  );
}
