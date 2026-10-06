"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type HasilProses = { ok: true } | { ok: false; galat: string };

function segarkan() {
  revalidatePath("/admin/konfirmasi");
  revalidatePath("/admin");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/buku-iuran");
  revalidatePath("/iuran");
  revalidatePath("/kas");
}

/** Terima pengajuan: buat Payment per periode yang diterima (dalam satu transaksi). */
export async function terimaPengajuan(form: FormData): Promise<HasilProses> {
  const s = await auth();
  if (!s?.user) return { ok: false, galat: "Sesi berakhir. Silakan masuk lagi." };
  const userId = (s.user as { id?: string }).id;

  const id = String(form.get("id") ?? "");
  const dipilih = [...new Set(form.getAll("periods").map(String))].sort();
  const paidOnStr = String(form.get("paid_on") ?? "");
  const rejectReason = String(form.get("reject_reason") ?? "").trim() || null;

  try {
    await prisma.$transaction(async (tx) => {
      const sub = await tx.paymentSubmission.findUnique({ where: { id } });
      // Cegah proses ganda: hanya yang masih menunggu yang bisa diproses.
      if (!sub || sub.status !== "menunggu") {
        throw new Error("Pengajuan ini sudah diproses sebelumnya.");
      }
      const semuaPeriode = sub.periods as string[];
      const periodeOk = dipilih.filter((p) => semuaPeriode.includes(p));
      if (periodeOk.length === 0) throw new Error("Centang minimal satu bulan yang diterima.");

      const paidOn = new Date(paidOnStr + "T00:00:00");
      if (Number.isNaN(paidOn.getTime())) throw new Error("Tanggal uang masuk tidak valid.");

      // Lewati periode yang keburu tercatat lunas.
      const ada = await tx.payment.findMany({
        where: { householdId: sub.householdId, duesTypeId: sub.duesTypeId, period: { in: periodeOk } },
        select: { period: true },
      });
      const sudah = new Set(ada.map((p) => p.period));
      const baru = periodeOk.filter((p) => !sudah.has(p));
      if (baru.length === 0) throw new Error("Semua periode yang dipilih sudah tercatat lunas.");

      let pertama = true;
      for (const period of baru) {
        await tx.payment.create({
          data: {
            householdId: sub.householdId,
            duesTypeId: sub.duesTypeId,
            period,
            amount: sub.unitAmount,
            paidOn,
            method: "transfer",
            note: `Bukti online #${sub.code}`,
            recordedById: userId,
            submissionId: pertama ? sub.id : undefined,
          },
        });
        pertama = false;
      }

      const parsial = baru.length < semuaPeriode.length;
      await tx.paymentSubmission.update({
        where: { id },
        data: {
          status: "disetujui",
          approvedPeriods: baru,
          rejectReason: parsial ? rejectReason : null,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
      });
    });
  } catch (e) {
    return { ok: false, galat: e instanceof Error ? e.message : "Gagal memproses pengajuan." };
  }
  segarkan();
  return { ok: true };
}

/** Tolak seluruh pengajuan. */
export async function tolakPengajuan(form: FormData): Promise<HasilProses> {
  const s = await auth();
  if (!s?.user) return { ok: false, galat: "Sesi berakhir. Silakan masuk lagi." };
  const userId = (s.user as { id?: string }).id;

  const id = String(form.get("id") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!reason) return { ok: false, galat: "Tulis alasan penolakan dulu." };

  try {
    await prisma.$transaction(async (tx) => {
      const sub = await tx.paymentSubmission.findUnique({ where: { id } });
      if (!sub || sub.status !== "menunggu") {
        throw new Error("Pengajuan ini sudah diproses sebelumnya.");
      }
      await tx.paymentSubmission.update({
        where: { id },
        data: {
          status: "ditolak",
          rejectReason: reason,
          approvedPeriods: Prisma.DbNull,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
      });
    });
  } catch (e) {
    return { ok: false, galat: e instanceof Error ? e.message : "Gagal menolak pengajuan." };
  }
  segarkan();
  return { ok: true };
}

/** Kembalikan pengajuan yang ditolak ke status menunggu. */
export async function kembalikanMenunggu(id: string): Promise<HasilProses> {
  const s = await auth();
  if (!s?.user) return { ok: false, galat: "Sesi berakhir. Silakan masuk lagi." };
  try {
    await prisma.$transaction(async (tx) => {
      const sub = await tx.paymentSubmission.findUnique({ where: { id } });
      if (!sub || sub.status !== "ditolak") {
        throw new Error("Hanya pengajuan yang ditolak yang bisa dikembalikan.");
      }
      await tx.paymentSubmission.update({
        where: { id },
        data: { status: "menunggu", rejectReason: null, approvedPeriods: Prisma.DbNull, reviewedById: null, reviewedAt: null },
      });
    });
  } catch (e) {
    return { ok: false, galat: e instanceof Error ? e.message : "Gagal mengembalikan pengajuan." };
  }
  segarkan();
  return { ok: true };
}

/** Batalkan konfirmasi: hapus Payment yang dibuat dari pengajuan ini, kembali menunggu. */
export async function batalkanKonfirmasi(id: string): Promise<HasilProses> {
  const s = await auth();
  if (!s?.user) return { ok: false, galat: "Sesi berakhir. Silakan masuk lagi." };
  try {
    await prisma.$transaction(async (tx) => {
      const sub = await tx.paymentSubmission.findUnique({ where: { id } });
      if (!sub || sub.status !== "disetujui") {
        throw new Error("Hanya pengajuan yang disetujui yang bisa dibatalkan.");
      }
      const approved = ((sub.approvedPeriods as string[] | null) ?? (sub.periods as string[]));
      const catatan = `Bukti online #${sub.code}`;
      await tx.payment.deleteMany({
        where: {
          householdId: sub.householdId,
          duesTypeId: sub.duesTypeId,
          period: { in: approved },
          OR: [{ submissionId: sub.id }, { note: catatan }],
        },
      });
      await tx.paymentSubmission.update({
        where: { id },
        data: { status: "menunggu", approvedPeriods: Prisma.DbNull, rejectReason: null, reviewedById: null, reviewedAt: null },
      });
    });
  } catch (e) {
    return { ok: false, galat: e instanceof Error ? e.message : "Gagal membatalkan konfirmasi." };
  }
  segarkan();
  return { ok: true };
}
