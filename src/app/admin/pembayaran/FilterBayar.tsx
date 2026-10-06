"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function FilterBayar({
  households,
  types,
  rumahAktif,
  jenisAktif,
}: {
  households: { id: string; number: string; headName: string }[];
  types: { id: string; name: string }[];
  rumahAktif: string;
  jenisAktif: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("hal");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="sheet p-4 sm:p-5 mt-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="field-label" htmlFor="saring-rumah">Saring Rumah</label>
          <select id="saring-rumah" className="input" value={rumahAktif}
            onChange={(e) => update({ rumah: e.target.value || null })}>
            <option value="">Semua rumah</option>
            {households.map((h) => (
              <option key={h.id} value={h.id}>{h.number} · {h.headName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="saring-jenis">Saring Jenis Iuran</label>
          <select id="saring-jenis" className="input" value={jenisAktif}
            onChange={(e) => update({ jenis: e.target.value || null })}>
            <option value="">Semua iuran</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={() => update({ rumah: null, jenis: null })} className="btn btn-quiet w-full sm:w-auto">
            Reset Saringan
          </button>
        </div>
      </div>
    </div>
  );
}
