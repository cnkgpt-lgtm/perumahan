// Admin: GET/PUT/DELETE /api/v1/admin/bank-accounts/[id] — kelola satu rekening.
// PUT memakai multipart; gambar QRIS hanya diganti bila ada berkas baru.
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin, str, bool, validasiBerkas } from "@/lib/api";
import { ringkasRekening } from "@/lib/api";

const skema = z.object({
  bank_name: z.string().trim().min(1).max(100).optional(),
  account_number: z.string().trim().max(50).optional().nullable(),
  account_name: z.string().trim().max(100).optional().nullable(),
  qris_payload: z.string().trim().max(2000).optional().nullable(),
  is_active: z.boolean().optional(),
  position: z.number().int().optional(),
  hapus_qris: z.boolean().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const a = await prisma.bankAccount.findUnique({
    where: { id },
    include: { _count: { select: { submissions: true } } },
  });
  if (!a) return j({ message: "Rekening tidak ditemukan." }, 404);

  return j({ ...ringkasRekening(a), submission_count: a._count.submissions });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.bankAccount.findUnique({ where: { id } });
  if (!ada) return j({ message: "Rekening tidak ditemukan." }, 404);

  const form = await req.formData();
  const parsed = skema.safeParse({
    bank_name: str(form, "bank_name") ?? undefined,
    account_number: form.has("account_number") ? str(form, "account_number") : undefined,
    account_name: form.has("account_name") ? str(form, "account_name") : undefined,
    qris_payload: form.has("qris_payload") ? str(form, "qris_payload") : undefined,
    is_active: form.has("is_active") ? bool(str(form, "is_active")) : undefined,
    position: form.has("position") ? Number(str(form, "position")) : undefined,
    hapus_qris: form.has("hapus_qris") ? bool(str(form, "hapus_qris")) : undefined,
  });
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const qris = form.get("qris_image") as File | null;
  if (qris && qris.size > 0) {
    const e = validasiBerkas(qris, ["image/jpeg", "image/png", "image/webp"]);
    if (e) return galat(`Gambar QRIS: ${e}`);
  }

  const hapusQris = b.hapus_qris || (qris && qris.size > 0);

  const diubah = await prisma.bankAccount.update({
    where: { id },
    data: {
      ...(b.bank_name ? { bankName: b.bank_name } : {}),
      ...(b.account_number !== undefined ? { accountNumber: b.account_number } : {}),
      ...(b.account_name !== undefined ? { accountName: b.account_name } : {}),
      ...(b.qris_payload !== undefined ? { qrisPayload: b.qris_payload } : {}),
      ...(b.is_active !== undefined ? { isActive: b.is_active } : {}),
      ...(b.position !== undefined && !Number.isNaN(b.position) ? { position: b.position } : {}),
      ...(qris && qris.size > 0
        ? { qrisImage: (new Uint8Array(await qris.arrayBuffer()) as Uint8Array<ArrayBuffer>), qrisImageType: qris.type }
        : hapusQris
          ? { qrisImage: null, qrisImageType: null }
          : {}),
    },
  });

  return j(ringkasRekening(diubah));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.bankAccount.findUnique({ where: { id } });
  if (!ada) return j({ message: "Rekening tidak ditemukan." }, 404);

  // Pengajuan lama tetap aman: relasi bankAccount onDelete SetNull.
  await prisma.bankAccount.delete({ where: { id } });
  return j({ message: "Rekening dihapus." });
}
