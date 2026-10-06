"use client";

import { useActionState } from "react";
import Link from "next/link";
import { simpanPengeluaran, type HasilForm } from "./actions";
import { Flash } from "@/components/ui";

export type PengeluaranAwal = {
  id: string;
  description: string;
  amount: number;
  spentOn: string; // "YYYY-MM-DD"
};

function hariIni(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function FormPengeluaran({ awal }: { awal?: PengeluaranAwal }) {
  const [hasil, aksi, sibuk] = useActionState<HasilForm, FormData>(simpanPengeluaran, {
    ok: false,
    galat: "",
  });
  const id = awal?.id ?? "";

  return (
    <form action={aksi} className="space-y-5 max-w-2xl">
      <input type="hidden" name="id" value={id} />
      {!hasil.ok && hasil.galat && <Flash pesan={hasil.galat} jenis="galat" />}

      <div className="sheet p-5 sm:p-6 space-y-5">
        <div>
          <label className="field-label" htmlFor="keperluan">
            Keperluan Pengeluaran
          </label>
          <input
            id="keperluan"
            name="keperluan"
            defaultValue={awal?.description ?? ""}
            className="input"
            placeholder="Mis. Beli lampu jalan Blok B"
            required
          />
          <span className="field-hint">
            Tuliskan keterangan yang mudah dipahami warga umum.
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="field-label" htmlFor="nominal">
              Nominal (Rp)
            </label>
            <input
              id="nominal"
              name="nominal"
              type="number"
              min={1}
              step={1}
              defaultValue={awal?.amount ?? ""}
              className="input"
              placeholder="150000"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="tanggal">
              Tanggal Pengeluaran
            </label>
            <input
              id="tanggal"
              name="tanggal"
              type="date"
              defaultValue={awal?.spentOn ?? hariIni()}
              className="input"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={sibuk} className="btn btn-primary flex-1 sm:flex-none">
          {sibuk ? "Menyimpan…" : id ? "Simpan Perubahan" : "Catat Pengeluaran"}
        </button>
        <Link href="/admin/pengeluaran" className="btn btn-quiet">
          Batal
        </Link>
      </div>
    </form>
  );
}
