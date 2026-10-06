"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getSettings, invalidateSettingsCache } from "@/lib/settings";

export type HasilAksi = { ok: false; galat: string } | { ok: true };

async function wajibLogin() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  return (s.user as { id?: string }).id ?? "";
}

const KUNCI = ["site_name", "site_tagline", "address", "treasurer_contact", "payment_info"] as const;

export async function simpanPengaturan(form: FormData): Promise<HasilAksi> {
  await wajibLogin();
  try {
    for (const k of KUNCI) {
      const v = String(form.get(k) ?? "").trim() || null;
      await prisma.setting.upsert({
        where: { key: k },
        create: { key: k, value: v },
        update: { value: v },
      });
    }
  } catch {
    return { ok: false, galat: "Gagal menyimpan pengaturan." };
  }
  invalidateSettingsCache();
  revalidatePath("/");
  return { ok: true };
}

export async function gantiSandi(form: FormData): Promise<HasilAksi> {
  const userId = await wajibLogin();
  const lama = String(form.get("sandi_lama") ?? "");
  const baru = String(form.get("sandi_baru") ?? "");
  const ulangi = String(form.get("sandi_ulangi") ?? "");

  if (!lama || !baru || !ulangi)
    return { ok: false, galat: "Semua kolom kata sandi wajib diisi." };
  if (baru.length < 8)
    return { ok: false, galat: "Kata sandi baru minimal 8 karakter." };
  if (baru !== ulangi)
    return { ok: false, galat: "Konfirmasi kata sandi tidak sama." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, galat: "Akun tidak ditemukan." };
  const cocok = await bcrypt.compare(lama, user.passwordHash);
  if (!cocok) return { ok: false, galat: "Kata sandi saat ini salah." };

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(baru, 10) },
  });
  return { ok: true };
}

export async function ambilPengaturan(): Promise<Record<string, string>> {
  await wajibLogin();
  return getSettings();
}
