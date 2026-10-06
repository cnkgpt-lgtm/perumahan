// Port dari App\Support\DuesLedger (PHP) — logika buku iuran & kas.
import { prisma } from "./db";

export type BulanInfo = { tahun: number; bulan: number };

export async function monthlyGrid(duesTypeId: string, year: number) {
  const payments = await prisma.payment.findMany({
    where: { duesTypeId, period: { startsWith: `${year}-` } },
    include: { household: true },
  });
  const paid: Record<string, Record<string, (typeof payments)[number]>> = {};
  for (const p of payments) {
    (paid[p.householdId] ??= {})[p.period] = p;
  }
  const pendingSubs = await prisma.paymentSubmission.findMany({
    where: { duesTypeId, status: "menunggu" },
    select: { householdId: true, periods: true },
  });
  const pending: Record<string, Record<string, boolean>> = {};
  for (const s of pendingSubs) {
    for (const period of s.periods as string[]) {
      (pending[s.householdId] ??= {})[period] = true;
    }
  }
  const withPayments = [...new Set(payments.map((p) => p.householdId))];
  const households = await prisma.household.findMany({
    where: { OR: [{ isActive: true }, { id: { in: withPayments } }] },
    orderBy: { number: "asc" },
  });
  return { months: Array.from({ length: 12 }, (_, i) => i + 1), households, paid, pending };
}

export async function onceList(duesTypeId: string) {
  const payments = await prisma.payment.findMany({
    where: { duesTypeId },
    include: { household: true },
  });
  const paid: Record<string, (typeof payments)[number]> = {};
  for (const p of payments) paid[p.householdId] = p;
  const pendingSubs = await prisma.paymentSubmission.findMany({
    where: { duesTypeId, status: "menunggu" },
    select: { householdId: true },
  });
  const pending: Record<string, boolean> = {};
  for (const s of pendingSubs) pending[s.householdId] = true;
  const withPayments = [...new Set(payments.map((p) => p.householdId))];
  const households = await prisma.household.findMany({
    where: { OR: [{ isActive: true }, { id: { in: withPayments } }] },
    orderBy: { number: "asc" },
  });
  return { households, paid, pending };
}

export async function currentProgress() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalHouseholds = await prisma.household.count({ where: { isActive: true } });
  const types = await prisma.duesType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  const out = [];
  for (const type of types) {
    const period = type.frequency === "bulanan" ? ym : "";
    if (type.frequency === "bulanan" && type.startsOn) {
      const start = new Date(type.startsOn);
      if (start > new Date(now.getFullYear(), now.getMonth(), 1)) continue;
    }
    const paid = await prisma.payment.count({
      where: {
        duesTypeId: type.id,
        period,
        household: { isActive: true },
      },
    });
    out.push({ type, label: type.frequency === "bulanan" ? ym : "Sekali bayar", paid, total: totalHouseholds });
  }
  return out;
}

export async function cashbook(year: number) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const payments = await prisma.payment.findMany({
    where: { paidOn: { gte: start, lt: end } },
    select: { paidOn: true, amount: true },
  });
  const expenses = await prisma.expense.findMany({
    where: { spentOn: { gte: start, lt: end } },
    select: { spentOn: true, amount: true },
  });
  const inByMonth: Record<number, number> = {};
  const outByMonth: Record<number, number> = {};
  for (const p of payments) {
    const m = new Date(p.paidOn).getMonth() + 1;
    inByMonth[m] = (inByMonth[m] ?? 0) + p.amount;
  }
  for (const e of expenses) {
    const m = new Date(e.spentOn).getMonth() + 1;
    outByMonth[m] = (outByMonth[m] ?? 0) + e.amount;
  }
  const openingIn = await prisma.payment.aggregate({
    where: { paidOn: { lt: start } },
    _sum: { amount: true },
  });
  const openingOut = await prisma.expense.aggregate({
    where: { spentOn: { lt: start } },
    _sum: { amount: true },
  });
  const opening = (openingIn._sum.amount ?? 0) - (openingOut._sum.amount ?? 0);
  let balance = opening;
  const rows = [];
  for (let m = 1; m <= 12; m++) {
    const masuk = inByMonth[m] ?? 0;
    const keluar = outByMonth[m] ?? 0;
    balance += masuk - keluar;
    if (masuk || keluar) rows.push({ bulan: m, masuk, keluar, saldo: balance });
  }
  const totalIn = Object.values(inByMonth).reduce((a, b) => a + b, 0);
  const totalOut = Object.values(outByMonth).reduce((a, b) => a + b, 0);
  return { opening, rows, totalIn, totalOut, closing: balance };
}

export async function availableYears(): Promise<number[]> {
  const nowY = new Date().getFullYear();
  const [minPaid, minSpent, minPeriod] = await Promise.all([
    prisma.payment.findFirst({ orderBy: { paidOn: "asc" }, select: { paidOn: true } }),
    prisma.expense.findFirst({ orderBy: { spentOn: "asc" }, select: { spentOn: true } }),
    prisma.payment.findFirst({
      where: { period: { not: "" } },
      orderBy: { period: "asc" },
      select: { period: true },
    }),
  ]);
  const candidates: number[] = [];
  if (minPaid) candidates.push(new Date(minPaid.paidOn).getFullYear());
  if (minSpent) candidates.push(new Date(minSpent.spentOn).getFullYear());
  if (minPeriod) candidates.push(Number(minPeriod.period.slice(0, 4)));
  const first = candidates.length ? Math.min(...candidates) : nowY;
  const years: number[] = [];
  for (let y = nowY; y >= Math.min(first, nowY); y--) years.push(y);
  return years;
}

/** Kode kiriman 8 karakter (tanpa huruf yang mirip angka). */
export function newSubmissionCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** Kode unik rumah untuk QRIS dinamis: hash deterministik id rumah → 1..999.
    Di KabarWarga memakai id numerik auto-increment; di sini id cuid sehingga
    dipakai hash agar tetap stabil per rumah. */
export function uniqueCodeFor(idRumah: string): number {
  let h = 0;
  for (const ch of idRumah) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return (h % 999) + 1;
}
