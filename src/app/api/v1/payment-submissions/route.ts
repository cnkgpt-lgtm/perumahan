// POST /api/v1/payment-submissions — kirim bukti bayar (multipart).
// Aturan validasi meniru src/app/(publik)/bayar/actions.ts.
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { newSubmissionCode, uniqueCodeFor } from "@/lib/ledger";
import { isValidQris } from "@/lib/qris";
import { j, galat, validasiBerkas } from "@/lib/api";

const KODE_ALFABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

async function kodeUnik(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    let code = "";
    for (let k = 0; k < 8; k++) code += KODE_ALFABET[Math.floor(Math.random() * KODE_ALFABET.length)];
    const ada = await prisma.paymentSubmission.findUnique({ where: { code } });
    if (!ada) return code;
  }
  return newSubmissionCode();
}

/** Normalisasi field periods: getAll, koma, atau JSON. */
function bacaPeriods(form: FormData): string[] {
  let periods = form.getAll("periods").map(String);
  if (periods.length === 1 && periods[0].trim().startsWith("[")) {
    try {
      const j = JSON.parse(periods[0]);
      if (Array.isArray(j)) periods = j.map(String);
    } catch {
      /* abaikan, pakai apa adanya */
    }
  }
  if (periods.length === 1 && periods[0].includes(",")) {
    periods = periods[0].split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [...new Set(periods.map((p) => p.trim()).filter(Boolean))].sort();
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const householdId = String(form.get("household_id") ?? "").trim();
  const duesTypeId = String(form.get("dues_type_id") ?? "").trim();
  const bankAccountId = String(form.get("bank_account_id") ?? "").trim();
  const periods = bacaPeriods(form);
  const payerName = String(form.get("payer_name") ?? "").trim() || null;
  const phone = String(form.get("phone") ?? "").trim() || null;
  const note = String(form.get("note") ?? "").trim() || null;
  const file = form.get("proof") as File | null;

  if (!householdId || !duesTypeId || !bankAccountId) {
    return galat("Pilih rumah, jenis iuran, dan rekening tujuan dulu.");
  }
  const galatBerkas = validasiBerkas(file);
  if (galatBerkas) return galat(galatBerkas === "Berkas wajib diunggah." ? "Foto bukti transfer wajib diunggah." : galatBerkas);

  const [household, type, account] = await Promise.all([
    prisma.household.findFirst({ where: { id: householdId, isActive: true } }),
    prisma.duesType.findFirst({ where: { id: duesTypeId, isActive: true } }),
    prisma.bankAccount.findFirst({ where: { id: bankAccountId, isActive: true } }),
  ]);
  if (!household || !type || !account) {
    return galat("Data rumah, iuran, atau rekening tidak valid.");
  }

  const bulanan = type.frequency === "bulanan";
  const periodeFinal = bulanan ? periods : [""];
  const tahunIni = new Date().getFullYear();

  if (bulanan && periodeFinal.length === 0) {
    return galat("Centang minimal satu bulan yang dibayar.");
  }
  for (const p of periodeFinal) {
    if (p === "") continue;
    const th = Number(p.slice(0, 4));
    if (th < tahunIni - 5 || th > tahunIni + 1) {
      return galat("Tahun yang dipilih di luar rentang yang bisa dibayar.");
    }
    if (type.startsOn && p < new Date(type.startsOn).toISOString().slice(0, 7)) {
      return galat("Ada bulan yang dipilih sebelum iuran ini mulai berlaku.");
    }
  }

  const sudahLunas = await prisma.payment.findMany({
    where: { householdId, duesTypeId, period: { in: periodeFinal } },
    select: { period: true },
  });
  if (sudahLunas.length > 0) {
    return galat("Ada periode yang sudah tercatat lunas. Hapus dari daftar lalu kirim lagi.");
  }

  const menunggu = await prisma.paymentSubmission.findMany({
    where: { householdId, duesTypeId, status: "menunggu" },
    select: { periods: true },
  });
  const periodeMenunggu = new Set<string>();
  for (const s of menunggu) for (const p of s.periods as string[]) periodeMenunggu.add(p);
  if (periodeFinal.some((p) => periodeMenunggu.has(p))) {
    return galat("Ada periode yang sedang menunggu konfirmasi pengurus. Tidak perlu dikirim ulang.");
  }

  const dinamis = !!account.qrisPayload && isValidQris(account.qrisPayload);
  const uniqueCode = dinamis ? uniqueCodeFor(household.id) : 0;
  const total = type.amount * periodeFinal.length + uniqueCode;

  const buf = (new Uint8Array(await file!.arrayBuffer()) as Uint8Array<ArrayBuffer>);
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
      proofType: file!.type,
      status: "menunggu",
    },
  });

  return j(
    {
      code,
      total,
      message:
        "Bukti pembayaran terkirim dan menunggu dicek pengurus. Simpan kode kiriman ini untuk mengecek statusnya.",
    },
    201,
  );
}
