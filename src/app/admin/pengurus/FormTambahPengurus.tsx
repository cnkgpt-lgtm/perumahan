"use client";

import { useActionState, useEffect, useState } from "react";
import { tambahPengurus, type HasilAksi } from "./actions";
import { Flash } from "@/components/ui";

export default function FormTambahPengurus({ onSukses }: { onSukses: () => void }) {
  const [hasil, aksi, sibuk] = useActionState<HasilAksi, FormData>(
    async (_prev, form) => tambahPengurus(form),
    {
      ok: false,
      galat: "",
    },
  );
  // Ganti key untuk mengosongkan form setelah sukses.
  const [kunciForm, setKunciForm] = useState(0);

  useEffect(() => {
    if (hasil.ok) {
      setKunciForm((k) => k + 1);
      onSukses();
    }
  }, [hasil, onSukses]);

  return (
    <form key={kunciForm} action={aksi} className="sheet p-5 sm:p-6 space-y-5">
      <h2 className="text-lg font-extrabold tracking-tight">➕ Tambah Pengurus Baru</h2>
      {hasil.ok && <Flash pesan="Pengurus baru berhasil ditambahkan." />}
      {!hasil.ok && hasil.galat && <Flash pesan={hasil.galat} jenis="galat" />}

      <div>
        <label className="field-label" htmlFor="nama">
          Nama Lengkap
        </label>
        <input id="nama" name="nama" className="input" placeholder="Nama pengurus" required />
      </div>
      <div>
        <label className="field-label" htmlFor="email">
          Email Login
        </label>
        <input id="email" name="email" type="email" className="input" placeholder="nama@email.com" required />
      </div>
      <div>
        <label className="field-label" htmlFor="sandi">
          Kata Sandi Awal
        </label>
        <input id="sandi" name="sandi" type="password" className="input" autoComplete="new-password" required />
        <span className="field-hint">
          Berikan sandi awal ini kepada pengurus baru. Minimal 8 karakter.
        </span>
      </div>

      <button type="submit" disabled={sibuk} className="btn btn-primary w-full">
        {sibuk ? "Menambahkan…" : "Tambah Pengurus"}
      </button>
    </form>
  );
}
