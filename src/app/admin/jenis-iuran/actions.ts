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

export async function simpanJenis(
  _sebelum: HasilForm,
  form: FormData,
): Promise<HasilForm> {
  await wajibLogin();
  const id = String(form.get("id") ?? "").trim();
  const name = String(form.get("nama") ?? "").trim();
  const frequency = String(form.get("frekuensi") ?? "bulanan");
  const amount = Math.floor(Number(String(form.get("nominal") ?? "0").replace(/[^0-9]/g, "")) || 0);
  const mulai = String(form.get("mulai") ?? "").trim(); // "YYYY-MM"
  const batas = String(form.get("batas") ?? "").trim(); // "YYYY-MM-DD"
  const description = String(form.get("keterangan") ?? "").trim() || null;
  const isActive = form.get("aktif") === "1";

  if (!name) return { ok: false, galat: "Nama iuran wajib diisi." };
  if (!["bulanan", "sekali"].includes(frequency))
    return { ok: false, galat: "Frekuensi tidak dikenal." };
  if (amount <= 0) return { ok: false, galat: "Nominal harus lebih dari Rp0." };
  if (frequency === "bulanan" && mulai && !/^\d{4}-\d{2}$/.test(mulai))
    return { ok: false, galat: "Format mulai berlaku tidak valid." };
  if (frequency === "sekali" && batas && !/^\d{4}-\d{2}-\d{2}$/.test(batas))
    return { ok: false, galat: "Format batas waktu tidak valid." };

  try {
    const data = {
      name,
      frequency,
      amount,
      startsOn: frequency === "bulanan" && mulai ? new Date(mulai + "-01T00:00:00") : null,
      dueOn: frequency === "sekali" && batas ? new Date(batas + "T00:00:00") : null,
      description,
      isActive,
    };
    if (id) {
      const lama = await prisma.duesType.findUnique({ where: { id }, select: { id: true } });
      if (!lama) return { ok: false, galat: "Jenis iuran tidak ditemukan." };
      await prisma.duesType.update({ where: { id }, data });
    } else {
      await prisma.duesType.create({ data });
    }
  } catch {
    return { ok: false, galat: "Gagal menyimpan jenis iuran." };
  }

  revalidatePath("/admin/jenis-iuran");
  revalidatePath("/iuran");
  revalidatePath("/bayar");
  redirect("/admin/jenis-iuran");
}

export async function hapusJenis(id: string): Promise<{ ok: boolean; galat?: string }> {
  await wajibLogin();
  const dipakai = await prisma.payment.count({ where: { duesTypeId: id } });
  if (dipakai > 0)
    return { ok: false, galat: "Jenis iuran ini sudah punya riwayat pembayaran — tidak bisa dihapus." };
  const pengajuan = await prisma.paymentSubmission.count({ where: { duesTypeId: id } });
  if (pengajuan > 0)
    return { ok: false, galat: "Jenis iuran ini punya pengajuan pembayaran — tidak bisa dihapus." };
  try {
    await prisma.duesType.delete({ where: { id } });
  } catch {
    return { ok: false, galat: "Gagal menghapus jenis iuran." };
  }
  revalidatePath("/admin/jenis-iuran");
  return { ok: true };
}
