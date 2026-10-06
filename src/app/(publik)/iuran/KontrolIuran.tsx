"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export default function KontrolIuran({
  types,
  years,
  jenisAktif,
  tahunAktif,
  tampilan,
  cariAwal,
  isBulanan,
}: {
  types: { id: string; name: string; frequency: string; isActive: boolean }[];
  years: number[];
  jenisAktif: string;
  tahunAktif: number;
  tampilan: "kartu" | "tabel";
  cariAwal: string;
  isBulanan: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [cari, setCari] = useState(cariAwal);
  const [, startTransition] = useTransition();

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="sheet p-4 sm:p-5 mt-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="filter-jenis">Jenis Iuran</label>
          <select
            id="filter-jenis"
            className="input"
            value={jenisAktif}
            onChange={(e) => update({ jenis: e.target.value })}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.frequency === "bulanan" ? "Bulanan" : "Sekali bayar"}){t.isActive ? "" : " — nonaktif"}
              </option>
            ))}
          </select>
        </div>
        {isBulanan && (
          <div>
            <label className="field-label" htmlFor="filter-tahun">Tahun Periode</label>
            <select
              id="filter-tahun"
              className="input"
              value={String(tahunAktif)}
              onChange={(e) => update({ tahun: e.target.value })}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="field-label" htmlFor="cari-rumah">Cari Rumah</label>
        <input
          id="cari-rumah"
          type="search"
          className="input"
          placeholder="Ketik nomor rumah (mis. A-1) atau nama kepala keluarga…"
          value={cari}
          onChange={(e) => {
            setCari(e.target.value);
            update({ cari: e.target.value.trim() ? e.target.value.trim() : null });
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Tampilan:</span>
        {(["kartu", "tabel"] as const).map((v) => (
          <button
            key={v}
            onClick={() => update({ tampilan: v === "kartu" ? null : v })}
            className={`btn btn-sm no-underline ${tampilan === v ? "btn-primary" : "btn-quiet"}`}
          >
            {v === "kartu" ? "Kartu Rumah" : "Tabel Lengkap"}
          </button>
        ))}
      </div>
    </div>
  );
}
