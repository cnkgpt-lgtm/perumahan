"use client";

import { useRouter } from "next/navigation";

export default function PilihTahun({ years, tahun }: { years: number[]; tahun: number }) {
  const router = useRouter();
  return (
    <select
      className="input !min-h-9 !py-1.5 text-sm w-auto"
      defaultValue={tahun}
      onChange={(e) => router.push(`/kas?tahun=${e.target.value}`)}
      aria-label="Pilih tahun"
    >
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}
