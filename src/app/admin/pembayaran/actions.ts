"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** Hapus satu catatan pembayaran (salah catat → hapus lalu input kembali). */
export async function hapusBayar(id: string): Promise<{ ok: boolean; galat?: string }> {
  const s = await auth();
  if (!s?.user) return { ok: false, galat: "Sesi berakhir. Silakan masuk lagi." };
  const ada = await prisma.payment.findUnique({ where: { id } });
  if (!ada) return { ok: false, galat: "Data pembayaran tidak ditemukan." };
  await prisma.payment.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/buku-iuran");
  revalidatePath("/iuran");
  revalidatePath("/kas");
  return { ok: true };
}
