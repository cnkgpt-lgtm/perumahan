"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Tombol hapus dengan dialog konfirmasi bawaan browser.
export default function HapusButton({
  aksi,
  label = "Hapus",
  pesan = "Yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.",
}: {
  aksi: () => Promise<{ ok: boolean; galat?: string }>;
  label?: string;
  pesan?: string;
}) {
  const [sibuk, mulai] = useTransition();
  const [galat, setGalat] = useState<string | null>(null);
  const router = useRouter();

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={sibuk}
        className="btn btn-sm btn-danger"
        onClick={() => {
          if (!confirm(pesan)) return;
          setGalat(null);
          mulai(async () => {
            try {
              const hasil = await aksi();
              if (hasil.ok) router.refresh();
              else setGalat(hasil.galat ?? "Gagal menghapus data.");
            } catch {
              setGalat("Terjadi kesalahan saat menghapus.");
            }
          });
        }}
      >
        {sibuk ? "Menghapus…" : label}
      </button>
      {galat && <span className="field-error">{galat}</span>}
    </span>
  );
}
