import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { availableYears } from "@/lib/ledger";
import { rupiah, tanggalPanjang, labelPeriode } from "@/lib/format";
import { Kicker } from "@/components/ui";
import FormCatat from "./FormCatat";

export const metadata = { title: "Catat Bayar" };

export default async function AdminCatatPage({
  searchParams,
}: {
  searchParams: Promise<{ rumah?: string; jenis?: string; tahun?: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const sp = await searchParams;

  const [households, types, years] = await Promise.all([
    prisma.household.findMany({ where: { isActive: true }, orderBy: { number: "asc" } }),
    prisma.duesType.findMany({ where: { isActive: true }, orderBy: [{ frequency: "asc" }, { name: "asc" }] }),
    availableYears(),
  ]);

  const rumahAktif = households.some((h) => h.id === sp.rumah) ? (sp.rumah as string) : "";
  const jenisAktif = types.some((t) => t.id === sp.jenis) ? (sp.jenis as string) : "";
  const tahunIni = new Date().getFullYear();
  const tahun = years.includes(Number(sp.tahun)) ? Number(sp.tahun) : (years[0] ?? tahunIni);

  const type = types.find((t) => t.id === jenisAktif) ?? null;
  let paid: Record<string, boolean> = {};
  let paidOnce = false;
  if (type && rumahAktif) {
    if (type.frequency === "bulanan") {
      const rows = await prisma.payment.findMany({
        where: { householdId: rumahAktif, duesTypeId: jenisAktif, period: { startsWith: `${tahun}-` } },
        select: { period: true },
      });
      paid = Object.fromEntries(rows.map((r) => [r.period, true]));
    } else {
      paidOnce = (await prisma.payment.count({ where: { householdId: rumahAktif, duesTypeId: jenisAktif } })) > 0;
    }
  }

  const recent = await prisma.payment.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { household: true, duesType: true },
  });

  return (
    <div>
      <Kicker>Pencatatan Cepat</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Catat Pembayaran Iuran</h1>
      <p className="text-ink-muted mt-2 text-sm sm:text-base">
        Pilih rumah dan tandai bulan yang diserahkan warga.
      </p>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <FormCatat
          households={households.map((h) => ({ id: h.id, number: h.number, headName: h.headName }))}
          types={types.map((t) => ({
            id: t.id, name: t.name, amount: t.amount, frequency: t.frequency,
            startsOn: t.startsOn ? t.startsOn.toISOString() : null,
          }))}
          years={years}
          rumahAktif={rumahAktif}
          jenisAktif={jenisAktif}
          tahun={tahun}
          tahunIni={tahunIni}
          paid={paid}
          paidOnce={paidOnce}
        />

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="sheet p-5">
            <h2 className="font-extrabold tracking-tight mb-3">Baru Dicatat</h2>
            {recent.length === 0 ? (
              <p className="text-sm text-ink-muted">Belum ada pembayaran tercatat.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((p) => (
                  <li key={p.id} className="rounded-xl border border-rule-soft p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center justify-center min-w-12 px-2 py-0.5 rounded-md bg-ink text-white text-xs font-extrabold">
                        {p.household.number}
                      </span>
                      <span className="font-extrabold text-daun-dark">{rupiah(p.amount)}</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1.5">
                      {p.duesType.name} · {labelPeriode(p.period)}
                    </p>
                    <p className="text-xs text-ink-subtle">
                      {tanggalPanjang(p.paidOn)} · {p.method === "tunai" ? "Tunai" : "Transfer"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/pembayaran" className="inline-block mt-4 text-sm font-bold text-daun hover:underline no-underline">
              Lihat Semua Riwayat Bayar →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
