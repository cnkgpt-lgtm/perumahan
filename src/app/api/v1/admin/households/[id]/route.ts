// Admin: GET/PUT/DELETE /api/v1/admin/households/[id] — kelola satu rumah.
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin, ringkasRumah } from "@/lib/api";


const skema = z.object({
  number: z.string().trim().min(1).max(20).optional(),
  head_name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  kk_number: z.string().trim().max(30).optional().nullable(),
  occupancy_status: z.string().trim().max(20).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const h = await prisma.household.findUnique({
    where: { id },
    include: { _count: { select: { members: true, payments: true, submissions: true } } },
  });
  if (!h) return j({ message: "Rumah tidak ditemukan." }, 404);

  return j({
    ...ringkasRumah(h),
    kk_number: h.kkNumber,
    has_kk_image: !!h.kkImage,
    member_count: h._count.members,
    payment_count: h._count.payments,
    submission_count: h._count.submissions,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.household.findUnique({ where: { id } });
  if (!ada) return j({ message: "Rumah tidak ditemukan." }, 404);

  const parsed = skema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  if (b.number && b.number !== ada.number) {
    const dipakai = await prisma.household.findUnique({ where: { number: b.number } });
    if (dipakai) return galat("Nomor rumah sudah terdaftar.");
  }

  const diubah = await prisma.household.update({
    where: { id },
    data: {
      ...(b.number ? { number: b.number } : {}),
      ...(b.head_name ? { headName: b.head_name } : {}),
      ...(b.phone !== undefined ? { phone: b.phone } : {}),
      ...(b.kk_number !== undefined ? { kkNumber: b.kk_number } : {}),
      ...(b.occupancy_status !== undefined ? { occupancyStatus: b.occupancy_status } : {}),
      ...(b.note !== undefined ? { note: b.note } : {}),
      ...(b.is_active !== undefined ? { isActive: b.is_active } : {}),
    },
  });

  return j(ringkasRumah(diubah));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.household.findUnique({
    where: { id },
    include: { _count: { select: { payments: true, submissions: true } } },
  });
  if (!ada) return j({ message: "Rumah tidak ditemukan." }, 404);
  if (ada._count.payments > 0 || ada._count.submissions > 0) {
    return galat("Rumah ini punya riwayat pembayaran/pengajuan. Nonaktifkan saja, jangan dihapus.");
  }

  await prisma.household.delete({ where: { id } });
  return j({ message: "Rumah dihapus." });
}
