"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { simpanJenis, hapusJenis, type HasilForm } from "./actions";
import { Flash } from "@/components/ui";
import HapusButton from "../_ui/HapusButton";

export type JenisAwal = {
  id: string;
  name: string;
  frequency: string;
  amount: number;
  startsOn: string; // "YYYY-MM" atau ""
  dueOn: string; // "YYYY-MM-DD" atau ""
  description: string | null;
  isActive: boolean;
  adaPembayaran: boolean;
};

export default function FormJenis({ awal }: { awal?: JenisAwal }) {
  const [hasil, aksi, sibuk] = useActionState<HasilForm, FormData>(simpanJenis, {
    ok: false,
    galat: "",
  });
  const [frekuensi, setFrekuensi] = useState(awal?.frequency ?? "bulanan");
  const id = awal?.id ?? "";

  return (
    <form action={aksi} className="space-y-5 max-w-2xl">
      <input type="hidden" name="id" value={id} />
      {!hasil.ok && hasil.galat && <Flash pesan={hasil.galat} jenis="galat" />}

      <div className="sheet p-5 sm:p-6 space-y-5">
        <div>
          <label className="field-label" htmlFor="nama">
            Nama Iuran
          </label>
          <input
            id="nama"
            name="nama"
            defaultValue={awal?.name ?? ""}
            className="input"
            placeholder="Mis. Iuran Keamanan"
            required
          />
        </div>

        <div>
          <span className="field-label">Frekuensi</span>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              { key: "bulanan", label: "Setiap Bulan", desc: "Ditagih rutin per bulan" },
              { key: "sekali", label: "Sekali Bayar", desc: "Satu kali untuk semua" },
            ].map((f) => (
              <label
                key={f.key}
                className={`cursor-pointer rounded-xl border-2 px-3 py-3 transition-all ${
                  frekuensi === f.key
                    ? "border-daun bg-daun-soft/60"
                    : "border-rule bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="frekuensi"
                  value={f.key}
                  checked={frekuensi === f.key}
                  onChange={() => setFrekuensi(f.key)}
                  className="sr-only"
                />
                <span className="block font-bold text-ink">{f.label}</span>
                <span className="block text-xs text-ink-muted mt-0.5">{f.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="field-label" htmlFor="nominal">
              Nominal per Rumah (Rp)
            </label>
            <input
              id="nominal"
              name="nominal"
              type="number"
              min={1}
              step={1}
              defaultValue={awal?.amount ?? ""}
              className="input"
              placeholder="50000"
              required
            />
          </div>
          {frekuensi === "bulanan" ? (
            <div>
              <label className="field-label" htmlFor="mulai">
                Mulai Berlaku
              </label>
              <input
                id="mulai"
                name="mulai"
                type="month"
                defaultValue={awal?.startsOn ?? ""}
                className="input"
              />
              <span className="field-hint">Bulan pertama iuran ini ditagihkan.</span>
            </div>
          ) : (
            <div>
              <label className="field-label" htmlFor="batas">
                Batas Waktu
              </label>
              <input
                id="batas"
                name="batas"
                type="date"
                defaultValue={awal?.dueOn ?? ""}
                className="input"
              />
              <span className="field-hint">Opsional. Batas akhir pembayaran.</span>
            </div>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="keterangan">
            Keterangan untuk Warga
          </label>
          <textarea
            id="keterangan"
            name="keterangan"
            rows={3}
            defaultValue={awal?.description ?? ""}
            className="input"
            placeholder="Mis. Untuk gaji petugas keamanan & lampu jalan…"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-rule p-4">
          <input
            type="checkbox"
            name="aktif"
            value="1"
            defaultChecked={awal?.isActive ?? true}
            className="mt-1 size-5 accent-[#16a34a]"
          />
          <span>
            <span className="block font-semibold text-ink">Status Aktif Berjalan</span>
            <span className="block text-xs text-ink-muted">
              Iuran nonaktif tidak muncul di halaman bayar warga.
            </span>
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={sibuk} className="btn btn-primary flex-1 sm:flex-none">
          {sibuk ? "Menyimpan…" : id ? "Simpan Perubahan" : "Tambah Jenis Iuran"}
        </button>
        <Link href="/admin/jenis-iuran" className="btn btn-quiet">
          Batal
        </Link>
      </div>

      {id && !awal?.adaPembayaran && (
        <div className="sheet p-5 border-terakota/30">
          <p className="font-bold text-terakota mb-1">Zona Berbahaya</p>
          <p className="text-sm text-ink-muted mb-3">
            Jenis iuran ini belum punya pembayaran tercatat, sehingga bisa dihapus permanen.
          </p>
          <HapusButton
            aksi={async () => {
              const h = await hapusJenis(id);
              if (h.ok) window.location.href = "/admin/jenis-iuran";
              return h;
            }}
            label="🗑️ Hapus Jenis Iuran Ini"
            pesan={`Hapus permanen "${awal?.name}"?`}
          />
        </div>
      )}
    </form>
  );
}
