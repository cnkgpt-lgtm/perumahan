"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { newSubmissionCode, uniqueCodeFor } from "@/lib/ledger";
import { isValidQris } from "@/lib/qris";

const KODE_ALFABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

async function kodeUnik(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) code += KODE_ALFABET[Math.floor(Math.random() * KODE_ALFABET.length)];
    const ada = await prisma.paymentSubmission.findUnique({ where: { code } });
    if (!ada) return code;
  }
  return newSubmissionCode();
}

export type HasilKirim = { ok: false; galat: string } | { ok: true; code: string };

export async function kirimBukti(form: FormData): Promise<HasilKirim> {
  const householdId = String(form.get("household_id") ?? "");
  const duesTypeId = String(form.get("dues_type_id") ?? "");
  const bankAccountId = String(form.get("bank_account_id") ?? "");
  const periods = form.getAll("periods").map(String);
  const payerName = String(form.get("payer_name") ?? "").trim() || null;
  const phone = String(form.get("phone") ?? "").trim() || null;
  const note = String(form.get("note") ?? "").trim() || null;
  const file = form.get("proof") as File | null;

  if (!householdId || !duesTypeId || !bankAccountId) {
    return { ok: false, galat: "Pilih rumah, jenis iuran, dan rekening tujuan dulu." };
  }
  if (!file || file.size === 0) {
    return { ok: false, galat: "Foto bukti transfer wajib diunggah." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, galat: "Ukuran bukti maksimal 5 MB." };
  }
  const tipeOk = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!tipeOk.includes(file.type)) {
    return { ok: false, galat: "Bukti harus berupa foto (JPG/PNG) atau PDF." };
  }

  const [household, type, account] = await Promise.all([
    prisma.household.findFirst({ where: { id: householdId, isActive: true } }),
    prisma.duesType.findFirst({ where: { id: duesTypeId, isActive: true } }),
    prisma.bankAccount.findFirst({ where: { id: bankAccountId, isActive: true } }),
  ]);
  if (!household || !type || !account) {
    return { ok: false, galat: "Data rumah, iuran, atau rekening tidak valid." };
  }

  const bulanan = type.frequency === "bulanan";
  const periodeFinal = bulanan ? [...new Set(periods)].sort() : [""];
  const tahunIni = new Date().getFullYear();

  if (bulanan && periodeFinal.length === 0) {
    return { ok: false, galat: "Centang minimal satu bulan yang dibayar." };
  }
  for (const p of periodeFinal) {
    if (p === "") continue;
    const th = Number(p.slice(0, 4));
    if (th < tahunIni - 5 || th > tahunIni + 1) {
      return { ok: false, galat: "Tahun yang dipilih di luar rentang yang bisa dibayar." };
    }
    if (type.startsOn && p < new Date(type.startsOn).toISOString().slice(0, 7)) {
      return { ok: false, galat: "Ada bulan yang dipilih sebelum iuran ini mulai berlaku." };
    }
  }

  const sudahLunas = await prisma.payment.findMany({
    where: { householdId, duesTypeId, period: { in: periodeFinal } },
    select: { period: true },
  });
  if (sudahLunas.length > 0) {
    return { ok: false, galat: "Ada periode yang sudah tercatat lunas. Hapus centangnya lalu kirim lagi." };
  }

  const menunggu = await prisma.paymentSubmission.findMany({
    where: { householdId, duesTypeId, status: "menunggu" },
    select: { periods: true },
  });
  const periodeMenunggu = new Set<string>();
  for (const s of menunggu) for (const p of s.periods as string[]) periodeMenunggu.add(p);
  if (periodeFinal.some((p) => periodeMenunggu.has(p))) {
    return { ok: false, galat: "Ada periode yang sedang menunggu konfirmasi pengurus. Tidak perlu dikirim ulang." };
  }

  const dinamis = !!account.qrisPayload && isValidQris(account.qrisPayload);
  const uniqueCode = dinamis ? uniqueCodeFor(household.id) : 0;

  const buf = (new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>);
  const code = await kodeUnik();

  await prisma.paymentSubmission.create({
    data: {
      code,
      householdId,
      duesTypeId,
      periods: periodeFinal,
      unitAmount: type.amount,
      uniqueCode,
      bankAccountId,
      payerName,
      phone,
      note,
      proofImage: buf,
      proofType: file.type,
      status: "menunggu",
    },
  });

  redirect(`/bayar/cek/${code}`);
}
