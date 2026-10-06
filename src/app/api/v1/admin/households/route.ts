// Admin: GET/POST /api/v1/admin/households — daftar & tambah rumah.
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin, paginasi, metaHalaman, ringkasRumah } from "@/lib/api";


const skema = z.object({
  number: z.string().trim().min(1, "Nomor rumah wajib diisi.").max(20),
  head_name: z.string().trim().min(1, "Nama kepala keluarga wajib diisi.").max(100),
  phone: z.string().trim().max(20).optional().nullable(),
  kk_number: z.string().trim().max(30).optional().nullable(),
  occupancy_status: z.string().trim().max(20).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

// GET ?cari=&halaman=&per_halaman=
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const url = new URL(req.url);
  const cari = url.searchParams.get("cari")?.trim() ?? "";
  const { halaman, per, lewati } = paginasi(url, 20);
  const where = cari
    ? { OR: [{ number: { contains: cari, mode: "insensitive" as const } }, { headName: { contains: cari, mode: "insensitive" as const } }] }
    : {};

  const [total, rows] = await Promise.all([
    prisma.household.count({ where }),
    prisma.household.findMany({
      where,
      orderBy: { number: "asc" },
      skip: lewati,
      take: per,
    }),
  ]);

  return j({ data: rows.map(ringkasRumah), meta: metaHalaman(total, halaman, per) });
}

export async function POST(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const parsed = skema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const dipakai = await prisma.household.findUnique({ where: { number: b.number } });
  if (dipakai) return galat("Nomor rumah sudah terdaftar.");

  const dibuat = await prisma.household.create({
    data: {
      number: b.number,
      headName: b.head_name,
      phone: b.phone ?? null,
      kkNumber: b.kk_number ?? null,
      occupancyStatus: b.occupancy_status ?? null,
      note: b.note ?? null,
      isActive: b.is_active ?? true,
    },
  });

  return j(ringkasRumah(dibuat), 201);
}
