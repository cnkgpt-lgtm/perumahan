"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export type HasilForm = { ok: false; galat: string } | { ok: true };

async function wajibLogin() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  return (s.user as { id?: string }).id ?? "";
}

export async function simpanPengeluaran(
  _sebelum: HasilForm,
  form: FormData,
): Promise<HasilForm> {
  const pencatatId = await wajibLogin();
  const id = String(form.get("id") ?? "").trim();
  const description = String(form.get("keperluan") ?? "").trim();
  const amount = Math.floor(Number(String(form.get("nominal") ?? "0").replace(/[^0-9]/g, "")) || 0);
  const tanggal = String(form.get("tanggal") ?? "").trim();

  if (!description) return { ok: false, galat: "Keperluan pengeluaran wajib diisi." };
  if (amount <= 0) return { ok: false, galat: "Nominal harus lebih dari Rp0." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal))
    return { ok: false, galat: "Tanggal pengeluaran tidak valid." };

  try {
    const data = {
      description,
      amount,
      spentOn: new Date(tanggal + "T00:00:00"),
    };
    if (id) {
      const lama = await prisma.expense.findUnique({ where: { id }, select: { id: true } });
      if (!lama) return { ok: false, galat: "Data pengeluaran tidak ditemukan." };
      await prisma.expense.update({ where: { id }, data });
    } else {
      await prisma.expense.create({ data: { ...data, recordedById: pencatatId } });
    }
  } catch {
    return { ok: false, galat: "Gagal menyimpan pengeluaran." };
  }

  revalidatePath("/admin/pengeluaran");
  revalidatePath("/kas");
  redirect("/admin/pengeluaran");
}

export async function hapusPengeluaran(id: string): Promise<{ ok: boolean; galat?: string }> {
  await wajibLogin();
  try {
    await prisma.expense.delete({ where: { id } });
  } catch {
    return { ok: false, galat: "Gagal menghapus pengeluaran." };
  }
  revalidatePath("/admin/pengeluaran");
  revalidatePath("/kas");
  return { ok: true };
}
