"use client";

import { useState, useTransition } from "react";
import { terimaPengajuan } from "./actions";
import { rupiah, labelPeriode } from "@/lib/format";

const SARAN_ALASAN = [
  "Bulan tersebut belum dibayar warga",
  "Nominal transfer kurang untuk bulan ini",
  "Periode duplikat dengan pengajuan lain",
];

const hariIniLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function FormTerima({
  submissionId,
  periods,
  sudahLunas,
  unitAmount,
  uniqueCode,
}: {
  submissionId: string;
  periods: string[];
  sudahLunas: string[];
  unitAmount: number;
  uniqueCode: number;
}) {
  const [, startTransition] = useTransition();
  const [dipilih, setDipilih] = useState<string[]>(periods.filter((p) => !sudahLunas.includes(p)));
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);

  const total = dipilih.length * unitAmount + uniqueCode;

  const toggle = (p: string) => {
    setDipilih((d) => (d.includes(p) ? d.filter((x) => x !== p) : [...d, p].sort()));
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGalat(null);
    const fd = new FormData(e.currentTarget);
    for (const p of dipilih) fd.append("periods", p);
    setMemproses(true);
    startTransition(async () => {
      const hasil = await terimaPengajuan(fd);
      setMemproses(false);
      if (!hasil.ok) {
        setGalat(hasil.galat);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl border border-daun/25 bg-emerald-50/50 p-4">
      <input type="hidden" name="id" value={submissionId} />
      {galat && (
        <p className="mb-3 rounded-xl border border-terakota/30 bg-terakota-soft text-terakota px-3 py-2 text-sm font-semibold">
          {galat}
        </p>
      )}
      <p className="field-label">Bulan yang diterima</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {periods.map((p) => {
          const lunas = sudahLunas.includes(p);
          const cek = dipilih.includes(p);
          return (
            <label key={p}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold select-none ${
                lunas
                  ? "border-daun/30 bg-daun-soft/60 text-daun-dark cursor-not-allowed"
                  : cek
                    ? "border-daun bg-white text-ink cursor-pointer"
                    : "border-rule bg-white text-ink-muted cursor-pointer hover:border-daun/50"
              }`}>
              {!lunas && (
                <input type="checkbox" className="size-4 accent-green-600" checked={cek} onChange={() => toggle(p)} />
              )}
              {labelPeriode(p)}
              {lunas && <span className="text-xs">· sudah lunas</span>}
            </label>
          );
        })}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor={`alasan-${submissionId}`}>
            Alasan bulan yang tidak diterima <span className="text-ink-subtle font-normal">(dilihat warga)</span>
          </label>
          <input id={`alasan-${submissionId}`} name="reject_reason" list={`saran-${submissionId}`}
            className="input" placeholder="Kosongkan bila semua diterima" />
          <datalist id={`saran-${submissionId}`}>
            {SARAN_ALASAN.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="field-label" htmlFor={`tgl-${submissionId}`}>Tanggal uang masuk</label>
          <input id={`tgl-${submissionId}`} name="paid_on" type="date" className="input"
            defaultValue={hariIniLocal()} max={hariIniLocal()} required />
        </div>
      </div>
      <button type="submit" disabled={memproses || dipilih.length === 0} className="btn btn-primary w-full mt-4">
        {memproses ? "Memproses…" : `✓ Terima ${rupiah(total)}`}
      </button>
      <p className="field-hint text-center mt-2">
        {dipilih.length} bulan × {rupiah(unitAmount)}{uniqueCode > 0 ? ` + kode unik ${uniqueCode}` : ""}
      </p>
    </form>
  );
}
