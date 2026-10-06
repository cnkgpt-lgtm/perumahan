// Admin: POST /api/v1/admin/payment-submissions/[id]/approve
// Setujui pengajuan (boleh sebagian): buat Payment per periode dalam satu transaksi.
// Body: { periods: string[], paid_on: "YYYY-MM-DD", reject_reason?: string }
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin } from "@/lib/api";

const schema = z.object({
  periods: z.array(z.string()).min(1, "Pilih minimal satu periode yang disetujui."),
  paid_on: z.string().min(1, "Tanggal bayar wajib diisi."),
  reject_reason: z.string().max(500).optional().nullable(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const { periods, paid_on, reject_reason } = parsed.data;

  const paidOn = new Date(paid_on);
  if (isNaN(paidOn.getTime())) return galat("Tanggal bayar tidak valid.");

  const s = await prisma.paymentSubmission.findUnique({
    where: { id },
    include: { duesType: true },
  });
  if (!s) return j({ message: "Pengajuan tidak ditemukan." }, 404);
  if (s.status !== "menunggu") return galat("Pengajuan ini sudah diproses sebelumnya.");

  const diajukan = new Set(s.periods as string[]);
  const disetujui = [...new Set(periods)];
  for (const p of disetujui) {
    if (!diajukan.has(p)) return galat(`Periode ${p || "sekali bayar"} tidak ada dalam pengajuan ini.`);
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Kunci anti proses ganda: update hanya berhasil bila status masih "menunggu".
      const kunci = await tx.paymentSubmission.updateMany({
        where: { id, status: "menunggu" },
        data: {
          status: "disetujui",
          approvedPeriods: disetujui,
          rejectReason: disetujui.length < diajukan.size ? (reject_reason ?? null) : null,
          reviewedById: uid,
          reviewedAt: new Date(),
        },
      });
      if (kunci.count === 0) throw new Error("SUDAH_DIPROSES");

      for (const period of disetujui) {
        await tx.payment.upsert({
          where: {
            householdId_duesTypeId_period: {
              householdId: s.householdId,
              duesTypeId: s.duesTypeId,
              period,
            },
          },
          update: {},
          create: {
            householdId: s.householdId,
            duesTypeId: s.duesTypeId,
            period,
            amount: s.unitAmount,
            paidOn,
            method: "transfer",
            submissionId: s.id,
            recordedById: uid,
          },
        });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SUDAH_DIPROSES") {
      return galat("Pengajuan ini sudah diproses sebelumnya.");
    }
    throw e;
  }

  const sebagian = disetujui.length < diajukan.size;
  return j({
    message: sebagian
      ? `Pengajuan disetujui sebagian (${disetujui.length} dari ${diajukan.size} periode).`
      : "Pengajuan disetujui, pembayaran tercatat.",
    approved_periods: disetujui,
  });
}
