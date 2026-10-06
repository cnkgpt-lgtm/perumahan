"use client";

import { useState } from "react";

// Pengalih tampilan Kartu / Tabel untuk daftar jenis iuran.
export default function TampilanJenis({
  kartu,
  tabel,
}: {
  kartu: React.ReactNode;
  tabel: React.ReactNode;
}) {
  const [mode, setMode] = useState<"kartu" | "tabel">("kartu");
  return (
    <div>
      <div className="flex justify-end mb-3">
        <div className="inline-flex rounded-xl border border-rule bg-white p-1 gap-1">
          {(
            [
              ["kartu", "🗂️ Kartu"],
              ["tabel", "📋 Tabel"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                mode === m ? "bg-daun text-white shadow-xs" : "text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {mode === "kartu" ? kartu : tabel}
    </div>
  );
}
