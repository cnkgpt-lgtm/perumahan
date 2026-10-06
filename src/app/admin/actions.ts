"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type HasilCatat = { ok: true; tercatat: number; dilewati: number } | { ok: false; galat: string };

/** Catat pembayaran tunai/transfer oleh pengurus — satu Payment per periode. */
export async function catatBayar(form: FormData): Promise<HasilCatat> {
  const s = await auth();
  if (!s?.user) return { ok: false, galat: "Sesi berakhir. Silakan masuk lagi." };
  const userId = (s.user as { id?: string }).id;

  const householdId = String(form.get("household_id") ?? "");
  const duesTypeId = String(form.get("dues_type_id") ?? "");
  const periods = form.getAll("periods").map(String);
  const total = Math.round(Number(form.get("total") ?? 0));
  const paidOnStr = String(form.get("paid_on") ?? "");
  const method = String(form.get("method") ?? "tunai");
  const note = String(form.get("note") ?? "").trim() || null;

  if (!householdId || !duesTypeId) {
    return { ok: false, galat: "Pilih rumah dan jenis iuran dulu." };
  }
  const [household, type] = await Promise.all([
    prisma.household.findFirst({ where: { id: householdId, isActive: true } }),
    prisma.duesType.findFirst({ where: { id: duesTypeId, isActive: true } }),
  ]);
  if (!household || !type) return { ok: false, galat: "Data rumah atau iuran tidak valid." };

  const bulanan = type.frequency === "bulanan";
  const periodeFinal = bulanan ? [...new Set(periods)].sort() : [""];
  if (bulanan && periodeFinal.length === 0) {
    return { ok: false, galat: "Centang minimal satu bulan yang dibayar." };
  }
  if (!Number.isFinite(total) || total <= 0) {
    return { ok: false, galat: "Total nominal diterima tidak valid." };
  }
  const paidOn = new Date(paidOnStr + "T00:00:00");
  if (Number.isNaN(paidOn.getTime())) return { ok: false, galat: "Tanggal terima uang tidak valid." };
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  if (paidOn > hariIni) return { ok: false, galat: "Tanggal terima uang tidak boleh melebihi hari ini." };
  if (method !== "tunai" && method !== "transfer") {
    return { ok: false, galat: "Metode pembayaran tidak valid." };
  }

  // Hindari duplikat: lewati kombinasi rumah/iuran/periode yang sudah ada.
  const ada = await prisma.payment.findMany({
    where: { householdId, duesTypeId, period: { in: periodeFinal } },
    select: { period: true },
  });
  const sudahAda = new Set(ada.map((p) => p.period));
  const baru = periodeFinal.filter((p) => !sudahAda.has(p));
  if (baru.length === 0) {
    return { ok: false, galat: "Semua periode yang dipilih sudah tercatat lunas." };
  }

  const perPeriode = Math.max(1, Math.round(total / baru.length));
  await prisma.payment.createMany({
    data: baru.map((period) => ({
      householdId,
      duesTypeId,
      period,
      amount: perPeriode,
      paidOn,
      method,
      note,
      recordedById: userId,
    })),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/buku-iuran");
  revalidatePath("/iuran");
  revalidatePath("/kas");

  return { ok: true, tercatat: baru.length, dilewati: periodeFinal.length - baru.length };
}
