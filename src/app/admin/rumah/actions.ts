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

export async function simpanRumah(
  _sebelum: HasilForm,
  form: FormData,
): Promise<HasilForm> {
  await wajibLogin();
  const id = String(form.get("id") ?? "").trim();
  const number = String(form.get("nomor") ?? "").trim();
  const headName = String(form.get("nama_kk") ?? "").trim();
  const occupancyStatus = String(form.get("status_hunian") ?? "pemilik");
  const phone = String(form.get("no_hp") ?? "").trim() || null;
  const kkNumber = String(form.get("no_kk") ?? "").trim() || null;
  const note = String(form.get("catatan") ?? "").trim() || null;
  const isActive = form.get("aktif") === "1";

  if (!number) return { ok: false, galat: "Nomor/blok rumah wajib diisi." };
  if (!headName) return { ok: false, galat: "Nama kepala keluarga wajib diisi." };
  if (!["pemilik", "kontrak"].includes(occupancyStatus))
    return { ok: false, galat: "Status hunian tidak dikenal." };
  if (kkNumber && !/^\d{16}$/.test(kkNumber))
    return { ok: false, galat: "Nomor KK harus 16 digit angka." };

  const duplikat = await prisma.household.findFirst({
    where: { number, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (duplikat) return { ok: false, galat: `Nomor rumah "${number}" sudah dipakai rumah lain.` };

  try {
    const data = { number, headName, occupancyStatus, phone, kkNumber, note, isActive };
    if (id) {
      const lama = await prisma.household.findUnique({ where: { id }, select: { id: true } });
      if (!lama) return { ok: false, galat: "Data rumah tidak ditemukan." };
      await prisma.household.update({ where: { id }, data });
    } else {
      await prisma.household.create({ data });
    }
  } catch {
    return { ok: false, galat: "Gagal menyimpan data rumah." };
  }

  revalidatePath("/admin/rumah");
  revalidatePath("/iuran");
  redirect("/admin/rumah");
}

export async function hapusRumah(id: string): Promise<{ ok: boolean; galat?: string }> {
  await wajibLogin();
  const riwayat = await prisma.payment.count({ where: { householdId: id } });
  if (riwayat > 0)
    return { ok: false, galat: "Rumah ini sudah punya riwayat pembayaran — tidak bisa dihapus." };
  try {
    await prisma.household.delete({ where: { id } });
  } catch {
    return { ok: false, galat: "Gagal menghapus data rumah." };
  }
  revalidatePath("/admin/rumah");
  return { ok: true };
}
