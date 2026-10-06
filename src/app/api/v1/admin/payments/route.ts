// Admin: GET/POST /api/v1/admin/payments — daftar & catat pembayaran.
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { nomorKuitansi } from "@/lib/format";
import { j, galat, butuhAdmin, paginasi, metaHalaman } from "@/lib/api";

function formatBayar(p: {
  id: string;
  nomor: number;
  period: string;
  amount: number;
  paidOn: Date;
  method: string;
  note: string | null;
  household: { id: string; number: string; headName: string };
  duesType: { id: string; name: string };
}) {
  return {
    id: p.id,
    nomor_kuitansi: nomorKuitansi(p.paidOn, p.nomor),
    household: { id: p.household.id, number: p.household.number, head_name: p.household.headName },
    dues_type: { id: p.duesType.id, name: p.duesType.name },
    period: p.period,
    amount: p.amount,
    paid_on: p.paidOn.toISOString().slice(0, 10),
    method: p.method,
    note: p.note,
  };
}

// GET ?dues_type_id=&household_id=&tahun=&bulan=YYYY-MM&halaman=&per_halaman=
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const url = new URL(req.url);
  const duesTypeId = url.searchParams.get("dues_type_id") ?? undefined;
  const householdId = url.searchParams.get("household_id") ?? undefined;
  const tahun = url.searchParams.get("tahun");
  const bulan = url.searchParams.get("bulan");
  const { halaman, per, lewati } = paginasi(url, 20);

  const where: Record<string, unknown> = {};
  if (duesTypeId) where.duesTypeId = duesTypeId;
  if (householdId) where.householdId = householdId;
  if (bulan && /^\d{4}-\d{2}$/.test(bulan)) where.period = bulan;
  else if (tahun && /^\d{4}$/.test(tahun))
    where.OR = [{ period: { startsWith: `${tahun}-` } }, { period: "" }];

  const [total, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: { household: true, duesType: true },
      orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }],
      skip: lewati,
      take: per,
    }),
  ]);

  return j({ data: rows.map(formatBayar), meta: metaHalaman(total, halaman, per) });
}

const catatSchema = z.object({
  household_id: z.string().min(1, "Rumah wajib diisi."),
  dues_type_id: z.string().min(1, "Jenis iuran wajib diisi."),
  period: z.string().regex(/^$|^\d{4}-\d{2}$/, "Periode harus format YYYY-MM atau kosong.").optional().default(""),
  amount: z.number().int().positive("Nominal harus lebih dari 0.").optional(),
  paid_on: z.string().min(1, "Tanggal bayar wajib diisi."),
  method: z.enum(["tunai", "transfer"]).optional().default("tunai"),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const parsed = catatSchema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const [household, type] = await Promise.all([
    prisma.household.findFirst({ where: { id: b.household_id, isActive: true } }),
    prisma.duesType.findFirst({ where: { id: b.dues_type_id, isActive: true } }),
  ]);
  if (!household) return galat("Rumah tidak ditemukan atau tidak aktif.");
  if (!type) return galat("Jenis iuran tidak ditemukan atau tidak aktif.");
  if (type.frequency === "bulanan" && !b.period) return galat("Periode bulan wajib diisi untuk iuran bulanan.");
  if (type.frequency !== "bulanan" && b.period) return galat("Iuran sekali bayar tidak memakai periode bulan.");

  const paidOn = new Date(b.paid_on);
  if (isNaN(paidOn.getTime())) return galat("Tanggal bayar tidak valid.");

  const ada = await prisma.payment.findUnique({
    where: { householdId_duesTypeId_period: { householdId: b.household_id, duesTypeId: b.dues_type_id, period: b.period } },
  });
  if (ada) return galat("Pembayaran periode ini sudah tercatat.");

  const bayar = await prisma.payment.create({
    data: {
      householdId: b.household_id,
      duesTypeId: b.dues_type_id,
      period: b.period,
      amount: b.amount ?? type.amount,
      paidOn,
      method: b.method,
      note: b.note ?? null,
      recordedById: uid,
    },
    include: { household: true, duesType: true },
  });

  return j(formatBayar(bayar), 201);
}
