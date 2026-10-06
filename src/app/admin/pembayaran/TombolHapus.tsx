"use client";

import { useState, useTransition } from "react";
import { hapusBayar } from "./actions";

export default function TombolHapus({ id, label }: { id: string; label: string }) {
  const [, startTransition] = useTransition();
  const [menghapus, setMenghapus] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const klik = () => {
    if (!window.confirm(`Hapus catatan pembayaran ${label}? Tindakan ini tidak bisa dibatalkan.`)) return;
    setGalat(null);
    setMenghapus(true);
    startTransition(async () => {
      const hasil = await hapusBayar(id);
      setMenghapus(false);
      if (!hasil.ok) setGalat(hasil.galat ?? "Gagal menghapus.");
    });
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button onClick={klik} disabled={menghapus} className="btn btn-sm btn-danger no-underline">
        {menghapus ? "Menghapus…" : "Hapus"}
      </button>
      {galat && <span className="text-xs text-terakota font-semibold">{galat}</span>}
    </span>
  );
}
