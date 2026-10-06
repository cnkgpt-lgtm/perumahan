// Admin: GET /api/v1/admin/payment-submissions/[id] — detail satu pengajuan.
import { prisma } from "@/lib/db";
import { labelPeriode } from "@/lib/format";
import { j, butuhAdmin, ringkasPengajuan } from "@/lib/api";


export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const s = await prisma.paymentSubmission.findUnique({
    where: { id },
    include: { household: true, duesType: true, bankAccount: true, reviewedBy: true },
  });
  if (!s) return j({ message: "Pengajuan tidak ditemukan." }, 404);

  const periods = s.periods as string[];
  const approved = (s.approvedPeriods as string[] | null) ?? [];

  return j({
    ...ringkasPengajuan(s),
    periods: periods.map((p) => ({ period: p, label: labelPeriode(p) })),
    unit_amount: s.unitAmount,
    unique_code: s.uniqueCode,
    phone: s.phone,
    note: s.note,
    approved_periods: approved,
    reviewed_by: s.reviewedBy?.name ?? null,
    reviewed_at: s.reviewedAt ? s.reviewedAt.toISOString() : null,
    proof_url: `/api/v1/admin/payment-submissions/${s.id}/proof`,
  });
}
