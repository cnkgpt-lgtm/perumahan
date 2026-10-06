"use client";

import { useState, useTransition } from "react";
import { tolakPengajuan } from "./actions";

const SARAN_TOLAK = [
  "Dana belum masuk ke rekening",
  "Jumlah transfer tidak sesuai",
  "Foto bukti tidak jelas, mohon kirim ulang",
  "Bukti transfer bukan untuk iuran ini",
];

export default function FormTolak({ submissionId }: { submissionId: string }) {
  const [, startTransition] = useTransition();
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGalat(null);
    const fd = new FormData(e.currentTarget);
    setMemproses(true);
    startTransition(async () => {
      const hasil = await tolakPengajuan(fd);
      setMemproses(false);
      if (!hasil.ok) setGalat(hasil.galat);
    });
  };

  return (
    <details className="mt-3 rounded-2xl border border-terakota/25 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-terakota select-none">
        Tolak semua pengajuan
      </summary>
      <form onSubmit={submit} className="px-4 pb-4">
        <input type="hidden" name="id" value={submissionId} />
        {galat && (
          <p className="mb-3 rounded-xl border border-terakota/30 bg-terakota-soft text-terakota px-3 py-2 text-sm font-semibold">
            {galat}
          </p>
        )}
        <label className="field-label" htmlFor={`tolak-${submissionId}`}>Alasan penolakan (dilihat warga)</label>
        <input id={`tolak-${submissionId}`} name="reason" list={`tolak-saran-${submissionId}`}
          className="input" placeholder="Pilih atau tulis alasan…" required />
        <datalist id={`tolak-saran-${submissionId}`}>
          {SARAN_TOLAK.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button type="submit" disabled={memproses} className="btn btn-danger w-full mt-3">
          {memproses ? "Memproses…" : "Tolak pengajuan"}
        </button>
      </form>
    </details>
  );
}
