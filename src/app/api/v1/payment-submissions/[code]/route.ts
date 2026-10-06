// GET /api/v1/payment-submissions/[code] — cek status pengajuan bukti bayar.
import { prisma } from "@/lib/db";
import { labelPeriode } from "@/lib/format";
import { j } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const s = await prisma.paymentSubmission.findUnique({
    where: { code: code.toUpperCase() },
    include: { household: true, duesType: true, bankAccount: true },
  });
  if (!s) return j({ message: "Kode kiriman tidak ditemukan." }, 404);

  const periods = s.periods as string[];
  const approved = (s.approvedPeriods as string[] | null) ?? [];

  return j({
    code: s.code,
    status: s.status,
    household: { id: s.household.id, number: s.household.number, head_name: s.household.headName },
    dues_type: { id: s.duesType.id, name: s.duesType.name, amount: s.unitAmount },
    periods: periods.map((p) => ({ period: p, label: labelPeriode(p) })),
    total: s.unitAmount * periods.length + s.uniqueCode,
    bank_name: s.bankAccount?.bankName ?? null,
    payer_name: s.payerName,
    created_at: s.createdAt.toISOString(),
    reject_reason: s.rejectReason,
    approved_periods: approved,
  });
}
