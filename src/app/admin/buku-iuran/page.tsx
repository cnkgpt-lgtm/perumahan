import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rupiah } from "@/lib/format";
import { monthlyGrid, onceList, availableYears } from "@/lib/ledger";
import { Kicker } from "@/components/ui";
import KontrolIuran from "@/app/(publik)/iuran/KontrolIuran";
import GridAdmin from "./GridAdmin";

export const metadata = { title: "Buku Iuran" };

export default async function BukuIuranPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string; tahun?: string; cari?: string; tampilan?: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const sp = await searchParams;

  const types = await prisma.duesType.findMany({
    orderBy: [{ isActive: "desc" }, { frequency: "asc" }, { name: "asc" }],
  });
  const type = types.find((t) => t.id === sp.jenis) ?? types[0] ?? null;

  const years = await availableYears();
  const year = years.includes(Number(sp.tahun)) ? Number(sp.tahun) : (years[0] ?? new Date().getFullYear());
  const tampilan = sp.tampilan === "tabel" ? "tabel" : "kartu";
  const cari = (sp.cari ?? "").trim().toLowerCase();

  let grid: Awaited<ReturnType<typeof monthlyGrid>> | null = null;
  let once: Awaited<ReturnType<typeof onceList>> | null = null;
  if (type) {
    if (type.frequency === "bulanan") grid = await monthlyGrid(type.id, year);
    else once = await onceList(type.id);
  }

  const paidBool: Record<string, Record<string, boolean>> = {};
  const paidOnceTgl: Record<string, string> = {};
  if (grid) {
    for (const [hid, m] of Object.entries(grid.paid)) {
      paidBool[hid] = {};
      for (const p of Object.keys(m)) paidBool[hid][p] = true;
    }
  }
  if (once) {
    for (const [hid, p] of Object.entries(once.paid)) {
      paidOnceTgl[hid] = new Date(p.paidOn).toISOString();
    }
  }
  const pendingBool: Record<string, Record<string, boolean>> = grid ? grid.pending : {};
  const pendingOnce: Record<string, boolean> = once ? once.pending : {};

  const saring = <T extends { number: string; headName: string }>(list: T[]) =>
    cari ? list.filter((h) => h.number.toLowerCase().includes(cari) || h.headName.toLowerCase().includes(cari)) : list;

  const households = grid ? saring(grid.households) : once ? saring(once.households) : [];

  return (
    <div>
      <Kicker>Buku Besar Iuran</Kicker>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Buku Iuran</h1>
          <p className="text-ink-muted mt-2 max-w-2xl text-sm sm:text-base">
            Ketuk sel <strong className="text-daun-dark">+</strong> untuk langsung mencatat pembayaran, atau sel{" "}
            <strong className="text-amber-700">dicek</strong> untuk mengonfirmasi bukti bayar warga.
          </p>
        </div>
        <Link href="/admin" className="btn btn-primary btn-sm no-underline shrink-0">
          + Catat Bayar
        </Link>
      </div>

      <KontrolIuran
        types={types.map((t) => ({ id: t.id, name: t.name, frequency: t.frequency, isActive: t.isActive }))}
        years={years}
        jenisAktif={type?.id ?? ""}
        tahunAktif={year}
        tampilan={tampilan}
        cariAwal={sp.cari ?? ""}
        isBulanan={type?.frequency === "bulanan"}
      />

      {!type ? (
        <p className="text-sm text-ink-muted text-center py-10">Belum ada jenis iuran yang didata.</p>
      ) : (
        <>
          <div className="sheet p-4 sm:p-5 mt-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-extrabold tracking-tight">{type.name}</h2>
              <span className={`badge ${type.frequency === "bulanan" ? "badge-success" : "badge-warning"}`}>
                {type.frequency === "bulanan" ? "Bulanan" : "Sekali Bayar"}
              </span>
              {!type.isActive && <span className="badge badge-neutral">Nonaktif</span>}
            </div>
            <p className="text-ink-muted text-sm mt-1">
              {rupiah(type.amount)} {type.frequency === "bulanan" ? "per rumah / bulan" : "sekali bayar"}
            </p>
          </div>

          <GridAdmin
            mode={type.frequency === "bulanan" ? "bulanan" : "sekali"}
            type={{ id: type.id, name: type.name, startsOn: type.startsOn ? new Date(type.startsOn).toISOString() : null }}
            year={year}
            tampilan={tampilan}
            households={households.map((h) => ({ id: h.id, number: h.number, headName: h.headName }))}
            paidBool={paidBool}
            pendingBool={pendingBool}
            paidOnceTgl={paidOnceTgl}
            pendingOnce={pendingOnce}
          />
        </>
      )}
    </div>
  );
}
