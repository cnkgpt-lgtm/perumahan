// Admin: GET/POST /api/v1/admin/dues-types — daftar & tambah jenis iuran.
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
  name: z.string().trim().min(1, "Nama iuran wajib diisi.").max(100),
  amount: z.number().int().positive("Nominal harus lebih dari 0."),
  frequency: z.enum(["bulanan", "sekali"]),
  starts_on: tanggal,
  due_on: tanggal,
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const rows = await prisma.duesType.findMany({ orderBy: { name: "asc" } });
  return j(rows.map(ringkasJenisIuran));
}

export async function POST(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const parsed = skema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const dibuat = await prisma.duesType.create({
    data: {
      name: b.name,
      amount: b.amount,
      frequency: b.frequency,
      startsOn: b.starts_on ? new Date(b.starts_on) : null,
      dueOn: b.due_on ? new Date(b.due_on) : null,
      description: b.description ?? null,
      isActive: b.is_active ?? true,
    },
  });

  return j(ringkasJenisIuran(dibuat), 201);
}
