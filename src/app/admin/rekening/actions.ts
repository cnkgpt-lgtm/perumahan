"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export type HasilForm = { ok: false; galat: string } | { ok: true };

async function wajibLogin() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
}

const TIPE_GAMBAR = ["image/jpeg", "image/png", "image/webp"];
const MAKS_GAMBAR = 5 * 1024 * 1024;

export async function simpanRekening(
  _sebelum: HasilForm,
  form: FormData,
): Promise<HasilForm> {
  await wajibLogin();
  const id = String(form.get("id") ?? "").trim();
  const bankName = String(form.get("bank") ?? "").trim();
  const accountNumber = String(form.get("nomor") ?? "").trim() || null;
  const accountName = String(form.get("atas_nama") ?? "").trim() || null;
  const qrisPayload = String(form.get("qris_payload") ?? "").trim() || null;
  const isActive = form.get("aktif") === "1";
  const hapusQris = form.get("hapus_qris") === "1";

  if (!bankName) return { ok: false, galat: "Nama bank/e-wallet wajib diisi." };

  let qris: { buf: Uint8Array<ArrayBuffer>; tipe: string } | null = null;
  const file = form.get("qris") as File | null;
  if (file && file.size > 0) {
    if (file.size > MAKS_GAMBAR) return { ok: false, galat: "Gambar QRIS maksimal 5 MB." };
    if (!TIPE_GAMBAR.includes(file.type))
      return { ok: false, galat: "Gambar QRIS harus JPG, PNG, atau WebP." };
    qris = { buf: (new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>), tipe: file.type };
  }

  try {
    const data = {
      bankName,
      accountNumber,
      accountName,
      qrisPayload,
      isActive,
      ...(qris ? { qrisImage: qris.buf, qrisImageType: qris.tipe } : {}),
      ...(hapusQris ? { qrisImage: null, qrisImageType: null } : {}),
    };
    if (id) {
      const lama = await prisma.bankAccount.findUnique({ where: { id }, select: { id: true } });
      if (!lama) return { ok: false, galat: "Rekening tidak ditemukan." };
      await prisma.bankAccount.update({ where: { id }, data });
    } else {
      await prisma.bankAccount.create({ data });
    }
  } catch {
    return { ok: false, galat: "Gagal menyimpan rekening." };
  }

  revalidatePath("/admin/rekening");
  revalidatePath("/bayar");
  redirect("/admin/rekening");
}
