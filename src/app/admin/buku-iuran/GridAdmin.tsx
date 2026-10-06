import Link from "next/link";
import { tanggalPanjang } from "@/lib/format";
import { Badge } from "@/components/ui";

type Household = { id: string; number: string; headName: string };

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function statusBulan(
  period: string,
  hid: string,
  paidBool: Record<string, Record<string, boolean>>,
  pendingBool: Record<string, Record<string, boolean>>,
  ymNow: string,
  startsYm: string | null,
) {
  if (paidBool[hid]?.[period]) return "lunas" as const;
  if (pendingBool[hid]?.[period]) return "dicek" as const;
  if (period > ymNow) return "depan" as const;
  if (startsYm && period < startsYm) return "belum-berlaku" as const;
  return "belum" as const;
}

/**
 * Versi admin dari GridIuran publik:
 * - sel "belum" jadi tombol "+" hijau → catat langsung di /admin
 * - sel "dicek" jadi link ke /admin/konfirmasi
 * - tiap kartu ada tombol "+ Catat Bayar"
 */
export default function GridAdmin({
  mode,
  type,
  year,
  tampilan,
  households,
  paidBool,
  pendingBool,
  paidOnceTgl,
  pendingOnce,
}: {
  mode: "bulanan" | "sekali";
  type: { id: string; name: string; startsOn: string | null };
  year: number;
  tampilan: "kartu" | "tabel";
  households: Household[];
  paidBool: Record<string, Record<string, boolean>>;
  pendingBool: Record<string, Record<string, boolean>>;
  paidOnceTgl: Record<string, string>;
  pendingOnce: Record<string, boolean>;
}) {
  const now = new Date();
  const ymNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startsYm = type.startsOn ? type.startsOn.slice(0, 7) : null;
  const bulanBerjalan = ymNow.slice(0, 4) === String(year) ? Number(ymNow.slice(5, 7)) : 0;

  const catatUrl = (h: Household) =>
    `/admin?rumah=${h.id}&jenis=${type.id}&tahun=${year}`;

  if (households.length === 0) {
    return <p className="text-sm text-ink-muted text-center py-10">Tidak ada rumah yang cocok dengan pencarian.</p>;
  }

  if (mode === "sekali") {
    return (
      <div className="sheet mt-4 divide-y divide-rule-soft">
        {households.map((h) => {
          const tgl = paidOnceTgl[h.id];
          const dicek = pendingOnce[h.id];
          return (
            <div key={h.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
              <span className="inline-flex items-center justify-center min-w-14 px-2 py-1 rounded-lg bg-ink text-white text-sm font-extrabold">
                {h.number}
              </span>
              <span className="font-bold flex-1 min-w-0 truncate">{h.headName}</span>
              {tgl ? (
                <span className="badge badge-success shrink-0">✓ Lunas ({tanggalPanjang(tgl)})</span>
              ) : dicek ? (
                <Link href="/admin/konfirmasi" className="badge badge-warning shrink-0 no-underline hover:border-amber-400">
                  Sedang dicek
                </Link>
              ) : (
                <span className="flex items-center gap-2 shrink-0">
                  <span className="badge badge-warning">Belum lunas</span>
                  <Link href={catatUrl(h)} className="btn btn-sm btn-primary no-underline">
                    + Catat
                  </Link>
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (tampilan === "tabel") {
    return (
      <div className="mt-4">
        <div className="sheet overflow-x-auto" role="region" aria-label={`Tabel iuran ${type.name} ${year}`} tabIndex={0}>
          <table className="w-full text-sm border-collapse min-w-[880px]">
            <caption className="sr-only">Status iuran {type.name} tahun {year} per rumah</caption>
            <thead>
              <tr className="border-b border-rule">
                <th className="sticky left-0 bg-card text-left px-4 py-3 font-bold whitespace-nowrap z-10">Rumah &amp; Warga</th>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <th key={m} className={`px-2 py-3 text-center font-bold text-xs ${m === bulanBerjalan ? "text-daun-dark" : "text-ink-muted"}`}>
                    {BULAN_PENDEK[m - 1]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {households.map((h) => (
                <tr key={h.id} className="border-b border-rule-soft last:border-0 hover:bg-slate-50/60">
                  <td className="sticky left-0 bg-card px-4 py-2.5 whitespace-nowrap z-10">
                    <span className="inline-flex items-center justify-center min-w-12 px-2 py-0.5 rounded-md bg-ink text-white text-xs font-extrabold mr-2">
                      {h.number}
                    </span>
                    <span className="font-semibold text-sm">{h.headName}</span>
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const period = `${year}-${String(m).padStart(2, "0")}`;
                    const st = statusBulan(period, h.id, paidBool, pendingBool, ymNow, startsYm);
                    return (
                      <td key={m} className={`px-2 py-2.5 text-center ${m === bulanBerjalan ? "bg-daun-soft/40" : ""}`}>
                        {st === "lunas" && (
                          <span className="inline-flex items-center justify-center size-7 rounded-lg bg-daun-soft text-daun-dark font-extrabold">✓</span>
                        )}
                        {st === "dicek" && (
                          <Link href="/admin/konfirmasi" title={`${BULAN_PENDEK[m - 1]} ${year}: sedang dicek`}
                            className="inline-flex items-center justify-center px-1.5 h-7 rounded-lg border border-dashed border-amber-400 text-amber-700 text-[10px] font-bold no-underline hover:bg-amber-50">
                            dicek
                          </Link>
                        )}
                        {st === "belum" && (
                          <Link href={catatUrl(h)} title={`${BULAN_PENDEK[m - 1]} ${year}: catat pembayaran`}
                            className="inline-flex items-center justify-center size-7 rounded-lg bg-daun text-white font-extrabold no-underline hover:bg-daun-dark shadow-xs">
                            +
                          </Link>
                        )}
                        {(st === "depan" || st === "belum-berlaku") && <span className="text-slate-300">·</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Legenda />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {households.map((h) => {
          const bulanIni = bulanBerjalan ? `${year}-${String(bulanBerjalan).padStart(2, "0")}` : null;
          const stBulanIni = bulanIni ? statusBulan(bulanIni, h.id, paidBool, pendingBool, ymNow, startsYm) : null;
          return (
            <div key={h.id} className="sheet p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center justify-center min-w-14 px-2 py-1 rounded-lg bg-ink text-white text-sm font-extrabold shrink-0">
                    {h.number}
                  </span>
                  <span className="font-bold truncate">{h.headName}</span>
                </div>
                {stBulanIni === "lunas" && <Badge variant="success">Lunas {BULAN_PENDEK[bulanBerjalan - 1]}</Badge>}
                {stBulanIni === "dicek" && <Badge variant="warning">Dicek {BULAN_PENDEK[bulanBerjalan - 1]}</Badge>}
                {stBulanIni === "belum" && <Badge variant="warning">Belum {BULAN_PENDEK[bulanBerjalan - 1]}</Badge>}
              </div>

              <div className="grid grid-cols-6 gap-1.5 mt-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const period = `${year}-${String(m).padStart(2, "0")}`;
                  const st = statusBulan(period, h.id, paidBool, pendingBool, ymNow, startsYm);
                  const isNow = m === bulanBerjalan;
                  const sel = (
                    <div
                      className={`rounded-lg border px-1 py-1.5 text-center h-full ${
                        st === "lunas"
                          ? "border-daun/30 bg-daun-soft/60"
                          : st === "dicek"
                            ? "border-dashed border-amber-400 bg-amber-50/60"
                            : st === "belum"
                              ? "border-daun/50 bg-emerald-50/50"
                              : "border-rule-soft bg-slate-50/60"
                      } ${isNow ? "ring-2 ring-daun/60" : ""}`}
                    >
                      <span className="block text-[10px] font-bold text-ink-muted leading-tight">{BULAN_PENDEK[m - 1]}</span>
                      <span className={`block text-sm leading-tight font-extrabold ${st === "lunas" ? "text-daun" : st === "dicek" ? "text-amber-700" : st === "belum" ? "text-daun-dark" : "text-slate-300"}`}>
                        {st === "lunas" ? "✓" : st === "dicek" ? "…" : st === "belum" ? "+" : "–"}
                      </span>
                    </div>
                  );
                  return (
                    <div key={m} title={`${BULAN_PENDEK[m - 1]} ${year}: ${st === "lunas" ? "Lunas" : st === "dicek" ? "Sedang dicek — klik untuk konfirmasi" : st === "belum" ? "Belum — klik untuk catat" : "—"}`}>
                      {st === "belum" ? (
                        <Link href={catatUrl(h)} className="no-underline block hover:opacity-80">{sel}</Link>
                      ) : st === "dicek" ? (
                        <Link href="/admin/konfirmasi" className="no-underline block hover:opacity-80">{sel}</Link>
                      ) : sel}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3.5 pt-2 border-t border-slate-100">
                <Link href={catatUrl(h)} className="btn btn-sm btn-primary w-full text-xs font-bold no-underline">
                  + Catat Bayar
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      <Legenda />
    </div>
  );
}

function Legenda() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-xs text-ink-muted">
      <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3 rounded bg-daun"></span> ✓ Lunas sudah tercatat</span>
      <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3 rounded bg-daun text-white text-[9px] font-bold flex items-center justify-center">+</span> Belum — ketuk untuk catat</span>
      <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3 rounded border border-dashed border-amber-500"></span> Dicek — ketuk untuk konfirmasi</span>
      <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3 rounded ring-2 ring-daun/60"></span> Bulan berjalan</span>
    </div>
  );
}
