import { prisma } from "@/lib/db";
import { Kicker } from "@/components/ui";
import FormBayar from "./FormBayar";

export default async function BayarPage({
  searchParams,
}: {
  searchParams: Promise<{ rumah?: string; jenis?: string; tahun?: string }>;
}) {
  const sp = await searchParams;
  const [households, types, accounts] = await Promise.all([
    prisma.household.findMany({ where: { isActive: true }, orderBy: { number: "asc" } }),
    prisma.duesType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.bankAccount.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
  ]);

  const household = households.find((h) => h.id === sp.rumah) ?? null;
  const type = types.find((t) => t.id === sp.jenis) ?? null;

  const tahunIni = new Date().getFullYear();
  let tahun = Number(sp.tahun) || tahunIni;
  if (tahun < tahunIni - 1 || tahun > tahunIni + 1) tahun = tahunIni;

  let paid: Record<string, boolean> = {};
  let pending: string[] = [];
  let history: { code: string; status: string; createdAt: string; duesName: string; periods: string[]; total: number }[] = [];

  if (household && type) {
    const [pays, subs] = await Promise.all([
      prisma.payment.findMany({
        where: { householdId: household.id, duesTypeId: type.id },
        select: { period: true },
      }),
      prisma.paymentSubmission.findMany({
        where: { householdId: household.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { duesType: true },
      }),
    ]);
    paid = Object.fromEntries(pays.map((p) => [p.period, true]));
    const menunggu = new Set<string>();
    for (const s of subs) {
      if (s.status === "menunggu" && s.duesTypeId === type.id) {
        for (const p of s.periods as string[]) menunggu.add(p);
      }
    }
    pending = [...menunggu];
    history = subs.map((s) => ({
      code: s.code,
      status: s.status,
      createdAt: new Date(s.createdAt).toISOString(),
      duesName: s.duesType.name,
      periods: s.periods as string[],
      total: s.unitAmount * (s.periods as string[]).length + s.uniqueCode,
    }));
  }

  return (
    <div>
      <Kicker>Tanpa perlu login</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Bayar Iuran</h1>
      <p className="text-ink-muted mt-2 max-w-2xl text-sm sm:text-base">
        Pilih rumah dan bulan yang dibayar, transfer ke rekening pengurus, lalu kirim bukti transfer di sini.
      </p>

      {accounts.length === 0 ? (
        <div className="sheet p-8 mt-6 text-center">
          <p className="font-bold text-lg">Pembayaran online belum dibuka</p>
          <p className="text-sm text-ink-muted mt-1">Pengurus belum mengaktifkan rekening pembayaran. Silakan hubungi pengurus langsung.</p>
        </div>
      ) : (
        <FormBayar
          households={households.map((h) => ({ id: h.id, number: h.number, headName: h.headName, uniqueCode: ((h.nomor - 1) % 999) + 1 }))}
          types={types.map((t) => ({
            id: t.id,
            name: t.name,
            amount: t.amount,
            frequency: t.frequency,
            startsOn: t.startsOn ? new Date(t.startsOn).toISOString() : null,
          }))}
          accounts={accounts.map((a) => ({
            id: a.id,
            bankName: a.bankName,
            accountNumber: a.accountNumber,
            accountName: a.accountName,
            hasQrisImage: !!a.qrisImage,
            qrisPayload: a.qrisPayload,
          }))}
          rumahAktif={household?.id ?? ""}
          jenisAktif={type?.id ?? ""}
          tahun={tahun}
          tahunIni={tahunIni}
          paid={paid}
          pending={pending}
          history={history}
          householdName={household ? `${household.number} · ${household.headName}` : ""}
          typeName={type?.name ?? ""}
        />
      )}
    </div>
  );
}
