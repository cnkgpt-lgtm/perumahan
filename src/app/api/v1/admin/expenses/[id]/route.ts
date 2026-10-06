// Admin: GET/PUT/DELETE /api/v1/admin/expenses/[id] — kelola satu pengeluaran.
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin, ringkasPengeluaran } from "@/lib/api";


const skema = z.object({
  spent_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format YYYY-MM-DD.").optional(),
  description: z.string().trim().min(1).max(200).optional(),
  amount: z.number().int().positive("Nominal harus lebih dari 0.").optional(),
});

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const e = await prisma.expense.findUnique({
    where: { id },
    include: { recordedBy: { select: { name: true } } },
  });
  if (!e) return j({ message: "Pengeluaran tidak ditemukan." }, 404);

  return j(ringkasPengeluaran(e));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.expense.findUnique({ where: { id } });
  if (!ada) return j({ message: "Pengeluaran tidak ditemukan." }, 404);

  const parsed = skema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const diubah = await prisma.expense.update({
    where: { id },
    data: {
      ...(b.spent_on ? { spentOn: new Date(b.spent_on) } : {}),
      ...(b.description ? { description: b.description } : {}),
      ...(b.amount !== undefined ? { amount: b.amount } : {}),
    },
    include: { recordedBy: { select: { name: true } } },
  });

  return j(ringkasPengeluaran(diubah));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.expense.findUnique({ where: { id } });
  if (!ada) return j({ message: "Pengeluaran tidak ditemukan." }, 404);

  await prisma.expense.delete({ where: { id } });
  return j({ message: "Pengeluaran dihapus." });
}
