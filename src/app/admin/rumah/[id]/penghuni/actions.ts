"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export type AnggotaInput = {
  nik: string;
  name: string;
  familyRelation: string;
  gender: string;
  birthPlace: string;
  birthDate: string; // "YYYY-MM-DD" atau ""
  religion: string;
  education: string;
  job: string;
  maritalStatus: string;
  phone: string;
};

export type HasilAksi = { ok: false; galat: string } | { ok: true };

async function wajibLogin() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
}

function normalisasi(a: AnggotaInput) {
  const name = a.name.trim();
  const nik = a.nik.replace(/\D/g, "");
  if (!name) throw new Error("Nama lengkap wajib diisi.");
  if (nik && !/^\d{16}$/.test(nik)) throw new Error(`NIK "${a.nik}" harus 16 digit angka.`);
  return {
    nik: nik || null,
    name,
    familyRelation: a.familyRelation.trim() || null,
    gender: a.gender === "P" ? "P" : a.gender === "L" ? "L" : null,
    birthPlace: a.birthPlace.trim() || null,
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(a.birthDate) ? new Date(a.birthDate + "T00:00:00") : null,
    religion: a.religion.trim() || null,
    education: a.education.trim() || null,
    job: a.job.trim() || null,
    maritalStatus: a.maritalStatus.trim() || null,
    phone: a.phone.trim() || null,
  };
}

const TIPE_GAMBAR = ["image/jpeg", "image/png", "image/webp"];

export async function tambahAnggota(
  householdId: string,
  data: AnggotaInput,
): Promise<HasilAksi> {
  await wajibLogin();
  try {
    await prisma.householdMember.create({
      data: { householdId, ...normalisasi(data) },
    });
  } catch (e) {
    return { ok: false, galat: e instanceof Error ? e.message : "Gagal menambah anggota." };
  }
  revalidatePath(`/admin/rumah/${householdId}/penghuni`);
  revalidatePath("/admin/rumah");
  return { ok: true };
}

export async function ubahAnggota(
  memberId: string,
  data: AnggotaInput,
): Promise<HasilAksi> {
  await wajibLogin();
  try {
    const m = await prisma.householdMember.update({
      where: { id: memberId },
      data: normalisasi(data),
    });
    revalidatePath(`/admin/rumah/${m.householdId}/penghuni`);
  } catch (e) {
    return { ok: false, galat: e instanceof Error ? e.message : "Gagal menyimpan perubahan." };
  }
  return { ok: true };
}

export async function hapusAnggota(memberId: string): Promise<{ ok: boolean; galat?: string }> {
  await wajibLogin();
  try {
    const m = await prisma.householdMember.delete({
      where: { id: memberId },
      select: { householdId: true },
    });
    revalidatePath(`/admin/rumah/${m.householdId}/penghuni`);
    revalidatePath("/admin/rumah");
  } catch {
    return { ok: false, galat: "Gagal menghapus anggota." };
  }
  return { ok: true };
}

// Simpan hasil OCR: ganti seluruh anggota + update nomor KK + simpan foto KK.
export async function simpanHasilOcr(form: FormData): Promise<HasilAksi> {
  await wajibLogin();
  const householdId = String(form.get("household_id") ?? "");
  const teks = String(form.get("teks") ?? "");
  let anggota: AnggotaInput[] = [];
  try {
    anggota = JSON.parse(String(form.get("anggota") ?? "[]"));
  } catch {
    return { ok: false, galat: "Data anggota tidak valid." };
  }
  if (!householdId) return { ok: false, galat: "Rumah tidak dikenal." };
  if (anggota.length === 0) return { ok: false, galat: "Tidak ada baris anggota untuk disimpan." };

  const rumah = await prisma.household.findUnique({ where: { id: householdId }, select: { id: true } });
  if (!rumah) return { ok: false, galat: "Data rumah tidak ditemukan." };

  const file = form.get("foto_kk") as File | null;
  let foto: { buf: Uint8Array<ArrayBuffer>; tipe: string } | null = null;
  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { ok: false, galat: "Foto KK maksimal 5 MB." };
    if (!TIPE_GAMBAR.includes(file.type)) return { ok: false, galat: "Foto KK harus JPG/PNG/WebP." };
    foto = { buf: (new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>), tipe: file.type };
  }

  try {
    const baris = anggota.map(normalisasi);
    const nikKK = (teks.match(/\d{16}/) ?? [null])[0];

    await prisma.$transaction([
      prisma.householdMember.deleteMany({ where: { householdId } }),
      prisma.householdMember.createMany({
        data: baris.map((b) => ({ householdId, ...b })),
      }),
      prisma.household.update({
        where: { id: householdId },
        data: {
          ...(nikKK ? { kkNumber: nikKK } : {}),
          ...(foto ? { kkImage: foto.buf, kkImageType: foto.tipe } : {}),
        },
      }),
    ]);
  } catch (e) {
    return { ok: false, galat: e instanceof Error ? e.message : "Gagal menyimpan data KK." };
  }

  revalidatePath(`/admin/rumah/${householdId}/penghuni`);
  revalidatePath("/admin/rumah");
  return { ok: true };
}
