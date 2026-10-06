// Admin: GET/POST /api/v1/admin/expenses — daftar & catat pengeluaran kas.
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin, paginasi, metaHalaman, ringkasPengeluaran } from "@/lib/api";


const skema = z.object({
  spent_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format YYYY-MM-DD."),
  description: z.string().trim().min(1, "Keterangan wajib diisi.").max(200),
  amount: z.number().int().positive("Nominal harus lebih dari 0."),
});

// GET ?tahun={yyyy}&halaman=&per_halaman=
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const url = new URL(req.url);
  const tahun = url.searchParams.get("tahun");
  const { halaman, per, lewati } = paginasi(url, 20);

  const where: Record<string, unknown> = {};
  if (tahun && /^\d{4}$/.test(tahun)) {
    const y = Number(tahun);
    where.spentOn = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
  }

  const [total, rows] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: { recordedBy: { select: { name: true } } },
      orderBy: { spentOn: "desc" },
      skip: lewati,
      take: per,
    }),
  ]);

  return j({ data: rows.map(ringkasPengeluaran), meta: metaHalaman(total, halaman, per) });
}

export async function POST(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const parsed = skema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const dibuat = await prisma.expense.create({
    data: {
      spentOn: new Date(b.spent_on),
      description: b.description,
      amount: b.amount,
      recordedById: uid,
    },
    include: { recordedBy: { select: { name: true } } },
  });

  return j(ringkasPengeluaran(dibuat), 201);
}
