// Admin: GET/PUT/DELETE /api/v1/admin/dues-types/[id] — kelola satu jenis iuran.
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin, ringkasJenisIuran } from "@/lib/api";


const tanggal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format YYYY-MM-DD.")
  .optional()
  .nullable();

const skema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  amount: z.number().int().positive("Nominal harus lebih dari 0.").optional(),
  frequency: z.enum(["bulanan", "sekali"]).optional(),
  starts_on: tanggal,
  due_on: tanggal,
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const t = await prisma.duesType.findUnique({
    where: { id },
    include: { _count: { select: { payments: true, submissions: true } } },
  });
  if (!t) return j({ message: "Jenis iuran tidak ditemukan." }, 404);

  return j({ ...ringkasJenisIuran(t), payment_count: t._count.payments, submission_count: t._count.submissions });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.duesType.findUnique({ where: { id } });
  if (!ada) return j({ message: "Jenis iuran tidak ditemukan." }, 404);

  const parsed = skema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const diubah = await prisma.duesType.update({
    where: { id },
    data: {
      ...(b.name ? { name: b.name } : {}),
      ...(b.amount !== undefined ? { amount: b.amount } : {}),
      ...(b.frequency ? { frequency: b.frequency } : {}),
      ...(b.starts_on !== undefined ? { startsOn: b.starts_on ? new Date(b.starts_on) : null } : {}),
      ...(b.due_on !== undefined ? { dueOn: b.due_on ? new Date(b.due_on) : null } : {}),
      ...(b.description !== undefined ? { description: b.description } : {}),
      ...(b.is_active !== undefined ? { isActive: b.is_active } : {}),
    },
  });

  return j(ringkasJenisIuran(diubah));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.duesType.findUnique({
    where: { id },
    include: { _count: { select: { payments: true, submissions: true } } },
  });
  if (!ada) return j({ message: "Jenis iuran tidak ditemukan." }, 404);
  if (ada._count.payments > 0 || ada._count.submissions > 0) {
    return galat("Jenis iuran ini punya riwayat data. Nonaktifkan saja, jangan dihapus.");
  }

  await prisma.duesType.delete({ where: { id } });
  return j({ message: "Jenis iuran dihapus." });
}
