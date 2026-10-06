"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { catatBayar } from "./actions";
import { rupiah, namaBulan } from "@/lib/format";

type Rumah = { id: string; number: string; headName: string };
type Jenis = { id: string; name: string; amount: number; frequency: string; startsOn: string | null };

const hariIniLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function FormCatat({
  households,
  types,
  years,
  rumahAktif,
  jenisAktif,
  tahun,
  tahunIni,
  paid,
  paidOnce,
}: {
  households: Rumah[];
  types: Jenis[];
  years: number[];
  rumahAktif: string;
  jenisAktif: string;
  tahun: number;
  tahunIni: number;
  paid: Record<string, boolean>;
  paidOnce: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [bulan, setBulan] = useState<string[]>([]);
  const [totalManual, setTotalManual] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const type = types.find((t) => t.id === jenisAktif) ?? null;
  const bulanan = type?.frequency === "bulanan";
  const autoTotal = (bulanan ? bulan.length : 1) * (type?.amount ?? 0);
  const totalTampil = totalManual ?? String(autoTotal);

  const now = new Date();
  const ymNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startsYm = type?.startsOn ? type.startsOn.slice(0, 7) : null;

  useEffect(() => {
    setBulan([]);
    setTotalManual(null);
    setGalat(null);
    setSukses(null);
  }, [rumahAktif, jenisAktif, tahun]);

  const gantiQuery = (patch: Record<string, string>) => {
    const q = new URLSearchParams();
    if (patch.rumah || rumahAktif) q.set("rumah", patch.rumah ?? rumahAktif);
    if (patch.jenis || jenisAktif) q.set("jenis", patch.jenis ?? jenisAktif);
    q.set("tahun", String(patch.tahun ?? tahun));
    router.push(`/admin?${q.toString()}`);
  };

  const toggleBulan = (p: string) => {
    setBulan((b) => (b.includes(p) ? b.filter((x) => x !== p) : [...b, p].sort()));
  };

  const pilihCepat = (mode: "ini" | "tunggakan" | "kosong") => {
    if (mode === "kosong") return setBulan([]);
    const list: string[] = [];
    for (let m = 1; m <= 12; m++) {
      const p = `${tahun}-${String(m).padStart(2, "0")}`;
      if (paid[p]) continue;
      if (startsYm && p < startsYm) continue;
      if (mode === "ini" && p !== `${tahunIni}-${String(now.getMonth() + 1).padStart(2, "0")}`) continue;
      if (mode === "tunggakan" && p > ymNow) continue;
      list.push(p);
    }
    setBulan(list);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGalat(null);
    setSukses(null);
    const fd = new FormData(e.currentTarget);
    if (bulanan) for (const b of bulan) fd.append("periods", b);
    setMenyimpan(true);
    startTransition(async () => {
      const hasil = await catatBayar(fd);
      setMenyimpan(false);
      if (!hasil.ok) {
        setGalat(hasil.galat);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const pesan =
          `Tercatat ${hasil.tercatat} pembayaran.` +
          (hasil.dilewati > 0 ? ` (${hasil.dilewati} periode sudah ada, dilewati.)` : "");
        setSukses(pesan);
        setBulan([]);
        setTotalManual(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const langkah = "flex items-center gap-3 mb-4";
  const nomorLangkah = "shrink-0 size-8 rounded-full bg-ink text-white text-sm font-extrabold flex items-center justify-center";
  const siapSimpan = !!type && (!bulanan || bulan.length > 0) && !(bulanan === false && paidOnce);

  return (
    <form onSubmit={submit} className="lg:col-span-2 space-y-6">
      {galat && (
        <div className="rounded-2xl border border-terakota/30 bg-terakota-soft text-terakota px-4 py-3 text-sm font-semibold">
          {galat}
        </div>
      )}
      {sukses && (
        <div className="rounded-2xl border border-daun/30 bg-daun-soft text-daun-dark px-4 py-3 text-sm font-semibold">
          ✓ {sukses}
        </div>
      )}

      {/* Langkah 1 */}
      <section className="sheet p-5 sm:p-6">
        <div className={langkah}>
          <span className={nomorLangkah}>1</span>
          <h2 className="font-extrabold tracking-tight text-lg">Rumah &amp; Jenis Iuran</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="field-label" htmlFor="c-rumah">Rumah</label>
            <select id="c-rumah" name="household_id" className="input" value={rumahAktif}
              onChange={(e) => gantiQuery({ rumah: e.target.value })} required>
              <option value="">— Pilih rumah —</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>{h.number} · {h.headName}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="field-label" htmlFor="c-jenis">Jenis Iuran</label>
            <select id="c-jenis" name="dues_type_id" className="input" value={jenisAktif}
              onChange={(e) => gantiQuery({ jenis: e.target.value })} required>
              <option value="">— Pilih iuran —</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name} · {rupiah(t.amount)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="c-tahun">Tahun Periode</label>
            <select id="c-tahun" className="input" value={String(tahun)}
              onChange={(e) => gantiQuery({ tahun: e.target.value })}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Langkah 2 — grid bulan */}
      {type && bulanan && (
        <section className="sheet p-5 sm:p-6">
          <div className={langkah}>
            <span className={nomorLangkah}>2</span>
            <h2 className="font-extrabold tracking-tight text-lg">Bulan yang Diserahkan</h2>
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            <button type="button" onClick={() => pilihCepat("ini")} className="btn btn-sm btn-quiet">Bulan Ini</button>
            <button type="button" onClick={() => pilihCepat("tunggakan")} className="btn btn-sm btn-quiet">Semua Tunggakan</button>
            <button type="button" onClick={() => pilihCepat("kosong")} className="btn btn-sm btn-quiet">Reset Pilihan</button>
            <span className="ml-auto text-xs font-bold text-daun-dark self-center">
              Terpilih: {bulan.length} bulan · Total Iuran: {rupiah(bulan.length * type.amount)}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const p = `${tahun}-${String(m).padStart(2, "0")}`;
              const isPaid = !!paid[p];
              const belumBerlaku = !!startsYm && p < startsYm;
              const isNow = p === `${tahunIni}-${String(now.getMonth() + 1).padStart(2, "0")}` && tahun === tahunIni;
              const bisa = !isPaid && !belumBerlaku;
              const checked = bulan.includes(p);
              return (
                <label key={m}
                  className={`relative rounded-xl border-2 px-2 py-2.5 text-center transition-all select-none ${
                    isPaid ? "border-daun/40 bg-daun-soft/70 cursor-not-allowed"
                    : belumBerlaku ? "border-dashed border-rule bg-slate-50 cursor-not-allowed opacity-60"
                    : checked ? "border-daun bg-emerald-50 cursor-pointer"
                    : "border-rule bg-white cursor-pointer hover:border-daun/50"
                  } ${isNow ? "ring-2 ring-daun/50" : ""}`}>
                  {bisa && (
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleBulan(p)} />
                  )}
                  <span className="block text-xs font-bold">{namaBulan(m)}</span>
                  <span className={`block text-[11px] font-bold mt-0.5 ${isPaid ? "text-daun-dark" : "text-ink-subtle"}`}>
                    {isPaid ? "✓ Lunas" : belumBerlaku ? "–" : checked ? rupiah(type.amount) : "Pilih"}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* Sekali bayar */}
      {type && !bulanan && (
        <section className="sheet p-5 sm:p-6">
          <div className={langkah}>
            <span className={nomorLangkah}>2</span>
            <h2 className="font-extrabold tracking-tight text-lg">Pembayaran Sekali Bayar</h2>
          </div>
          {paidOnce ? (
            <p className="text-sm font-semibold text-daun-dark bg-daun-soft rounded-xl px-4 py-3">
              ✓ Iuran {type.name} untuk rumah ini sudah tercatat lunas.
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              Iuran <strong className="text-ink">{type.name}</strong> sebesar{" "}
              <strong className="text-ink">{rupiah(type.amount)}</strong> akan dicatat sekali bayar.
            </p>
          )}
        </section>
      )}

      {/* Langkah 3 — detail transaksi */}
      {type && siapSimpan && (
        <section className="sheet p-5 sm:p-6">
          <div className={langkah}>
            <span className={nomorLangkah}>{bulanan ? 3 : 3}</span>
            <h2 className="font-extrabold tracking-tight text-lg">Detail Transaksi</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="c-total">Total Nominal Diterima (Rp)</label>
              <input id="c-total" name="total" type="number" min="1" step="1" className="input font-bold"
                value={totalTampil} onChange={(e) => setTotalManual(e.target.value)} required />
              <span className="field-hint">Otomatis {rupiah(autoTotal)}, bisa diubah bila warga membayar lebih/kurang.</span>
            </div>
            <div>
              <label className="field-label" htmlFor="c-tgl">Tanggal Terima Uang</label>
              <input id="c-tgl" name="paid_on" type="date" className="input" defaultValue={hariIniLocal()}
                max={hariIniLocal()} required />
            </div>
          </div>
          <div className="mt-4">
            <span className="field-label">Metode Pembayaran</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "tunai", label: "💵 Tunai", hint: "Uang cash diterima langsung" },
                { v: "transfer", label: "🏦 Transfer", hint: "Transfer bank / e-wallet" },
              ].map((m) => (
                <label key={m.v}
                  className="rounded-xl border-2 border-rule px-4 py-3.5 text-center cursor-pointer transition-all has-[:checked]:border-daun has-[:checked]:bg-emerald-50">
                  <input type="radio" name="method" value={m.v} defaultChecked={m.v === "tunai"} className="sr-only" />
                  <span className="block font-extrabold">{m.label}</span>
                  <span className="block text-xs text-ink-muted mt-0.5">{m.hint}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <label className="field-label" htmlFor="c-catatan">Catatan Tambahan <span className="text-ink-subtle font-normal">(opsional)</span></label>
            <textarea id="c-catatan" name="note" className="input min-h-20" placeholder="Mis. titip tetangga, bayar dobel, dsb." />
          </div>
          <button type="submit" disabled={menyimpan} className="btn btn-primary w-full mt-5 text-base">
            {menyimpan ? "Menyimpan…" : "Simpan Catatan Pembayaran"}
          </button>
        </section>
      )}
    </form>
  );
}
