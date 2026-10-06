"use client";

import { useRef, useState } from "react";

// Input file gambar dengan pratinjau langsung di browser.
export default function FotoInput({
  name,
  label,
  previewAwal,
  hint,
  accept = "image/jpeg,image/png,image/webp",
}: {
  name: string;
  label: string;
  previewAwal?: string | null;
  hint?: string;
  accept?: string;
}) {
  const [pratinjau, setPratinjau] = useState<string | null>(previewAwal ?? null);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div>
      <span className="field-label">{label}</span>
      {pratinjau && (
        <img
          src={pratinjau}
          alt={`Pratinjau ${label}`}
          className="w-full max-w-xs rounded-xl border border-rule object-cover mb-2 bg-slate-50"
        />
      )}
      <input
        ref={ref}
        type="file"
        name={name}
        accept={accept}
        className="input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setPratinjau(f ? URL.createObjectURL(f) : (previewAwal ?? null));
        }}
      />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
