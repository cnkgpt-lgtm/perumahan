"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export type HasilAksi = { ok: false; galat: string } | { ok: true };

async function wajibLogin() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  return (s.user as { id?: string }).id ?? "";
}

export async function tambahPengurus(form: FormData): Promise<HasilAksi> {
  await wajibLogin();
  const name = String(form.get("nama") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("sandi") ?? "");

  if (!name) return { ok: false, galat: "Nama lengkap wajib diisi." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, galat: "Email tidak valid." };
  if (password.length < 8)
    return { ok: false, galat: "Kata sandi awal minimal 8 karakter." };

  const ada = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (ada) return { ok: false, galat: "Email ini sudah dipakai akun lain." };

  await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10), isActive: true },
  });
  revalidatePath("/admin/pengurus");
  return { ok: true };
}

export async function cabutAkses(id: string): Promise<{ ok: boolean; galat?: string }> {
  const sayaId = await wajibLogin();
  if (id === sayaId) return { ok: false, galat: "Tidak bisa mencabut akses akun sendiri." };

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, isActive: true } });
  if (!target || !target.isActive) return { ok: false, galat: "Akun tidak ditemukan." };

  const sisaAktif = await prisma.user.count({ where: { isActive: true, id: { not: id } } });
  if (sisaAktif < 1)
    return { ok: false, galat: "Minimal 1 pengurus aktif harus tersisa." };

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin/pengurus");
  return { ok: true };
}
