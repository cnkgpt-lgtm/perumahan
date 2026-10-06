// Admin: GET/POST /api/v1/admin/bank-accounts — daftar & tambah rekening.
// POST memakai multipart (gambar QRIS opsional).
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin, str, bool, validasiBerkas, ringkasRekening } from "@/lib/api";

const skema = z.object({
  bank_name: z.string().trim().min(1, "Nama bank wajib diisi.").max(100),
  account_number: z.string().trim().max(50).optional().nullable(),
  account_name: z.string().trim().max(100).optional().nullable(),
  qris_payload: z.string().trim().max(2000).optional().nullable(),
  is_active: z.boolean().optional(),
  position: z.number().int().optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const rows = await prisma.bankAccount.findMany({
    orderBy: [{ position: "asc" }, { bankName: "asc" }],
  });
  return j(rows.map(ringkasRekening));
}

export async function POST(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const form = await req.formData();
  const parsed = skema.safeParse({
    bank_name: str(form, "bank_name"),
    account_number: str(form, "account_number"),
    account_name: str(form, "account_name"),
    qris_payload: str(form, "qris_payload"),
    is_active: form.has("is_active") ? bool(str(form, "is_active")) : undefined,
    position: form.has("position") ? Number(str(form, "position")) : undefined,
  });
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const qris = form.get("qris_image") as File | null;
  if (qris && qris.size > 0) {
    const e = validasiBerkas(qris, ["image/jpeg", "image/png", "image/webp"]);
    if (e) return galat(`Gambar QRIS: ${e}`);
  }

  const dibuat = await prisma.bankAccount.create({
    data: {
      bankName: b.bank_name,
      accountNumber: b.account_number ?? null,
      accountName: b.account_name ?? null,
      qrisPayload: b.qris_payload ?? null,
      qrisImage: qris && qris.size > 0 ? (new Uint8Array(await qris.arrayBuffer()) as Uint8Array<ArrayBuffer>) : null,
      qrisImageType: qris && qris.size > 0 ? qris.type : null,
      isActive: b.is_active ?? true,
      position: Number.isNaN(b.position) ? 0 : (b.position ?? 0),
    },
  });

  return j(ringkasRekening(dibuat), 201);
}
