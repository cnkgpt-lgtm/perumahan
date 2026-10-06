"use client";

import { useState, useTransition } from "react";
import { kembalikanMenunggu, batalkanKonfirmasi } from "./actions";

export default function TombolAksi({
  id,
  aksi,
  label,
  tanya,
  className = "btn btn-sm btn-quiet",
}: {
  id: string;
  aksi: "kembalikan" | "batalkan";
  label: string;
  tanya: string;
  className?: string;
}) {
  const [, startTransition] = useTransition();
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const klik = () => {
    if (!window.confirm(tanya)) return;
    setGalat(null);
    setMemproses(true);
    startTransition(async () => {
      const hasil = aksi === "kembalikan" ? await kembalikanMenunggu(id) : await batalkanKonfirmasi(id);
      setMemproses(false);
      if (!hasil.ok) setGalat(hasil.galat);
    });
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button onClick={klik} disabled={memproses} className={`${className} no-underline`}>
        {memproses ? "Memproses…" : label}
      </button>
      {galat && <span className="text-xs text-terakota font-semibold">{galat}</span>}
    </span>
  );
}
