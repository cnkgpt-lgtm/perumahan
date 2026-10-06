"use client";

import { useActionState } from "react";
import Link from "next/link";
import { simpanRumah, hapusRumah, type HasilForm } from "./actions";
import { Flash, Badge } from "@/components/ui";
import HapusButton from "../_ui/HapusButton";

export type RumahAwal = {
  id: string;
  number: string;
  headName: string;
  occupancyStatus: string | null;
  phone: string | null;
  kkNumber: string | null;
  note: string | null;
  isActive: boolean;
  jumlahPenghuni: number;
  adaRiwayatBayar: boolean;
};

export default function FormRumah({ awal }: { awal?: RumahAwal }) {
  const [hasil, aksi, sibuk] = useActionState<HasilForm, FormData>(simpanRumah, {
    ok: false,
    galat: "",
  });
  const id = awal?.id ?? "";

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <form action={aksi} className="space-y-5">
        <input type="hidden" name="id" value={id} />
        {!hasil.ok && hasil.galat && <Flash pesan={hasil.galat} jenis="galat" />}

        <div className="sheet p-5 sm:p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="field-label" htmlFor="nomor">
                Nomor/Blok Rumah
              </label>
              <input
                id="nomor"
                name="nomor"
                defaultValue={awal?.number ?? ""}
                className="input"
                placeholder="Mis. A-12"
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="nama_kk">
                Nama Kepala Keluarga
              </label>
              <input
                id="nama_kk"
                name="nama_kk"
                defaultValue={awal?.headName ?? ""}
                className="input"
                placeholder="Nama lengkap"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="field-label" htmlFor="status_hunian">
                Status Hunian
              </label>
              <select
                id="status_hunian"
                name="status_hunian"
                defaultValue={awal?.occupancyStatus ?? "pemilik"}
                className="input"
              >
                <option value="pemilik">Pemilik</option>
                <option value="kontrak">Kontrak</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="no_hp">
                No HP/WA
              </label>
              <input
                id="no_hp"
                name="no_hp"
                defaultValue={awal?.phone ?? ""}
                className="input"
                placeholder="Mis. 081234567890"
                inputMode="tel"
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="no_kk">
              Nomor KK
            </label>
            <input
              id="no_kk"
              name="no_kk"
              defaultValue={awal?.kkNumber ?? ""}
              className="input font-mono"
              placeholder="16 digit nomor Kartu Keluarga"
              inputMode="numeric"
              maxLength={16}
            />
            <span className="field-hint">Bisa juga diisi otomatis dari hasil scan OCR KK.</span>
          </div>

          <div>
            <label className="field-label" htmlFor="catatan">
              Catatan <span className="font-normal text-ink-subtle">(hanya pengurus)</span>
            </label>
            <textarea
              id="catatan"
              name="catatan"
              rows={3}
              defaultValue={awal?.note ?? ""}
              className="input"
              placeholder="Catatan internal, tidak tampil ke warga…"
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
              <span className="block font-semibold text-ink">Status Aktif Ditagih Iuran</span>
              <span className="block text-xs text-ink-muted">
                Rumah nonaktif tidak muncul di daftar tagihan &amp; pembayaran.
              </span>
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={sibuk} className="btn btn-primary flex-1 sm:flex-none">
            {sibuk ? "Menyimpan…" : id ? "Simpan Perubahan" : "Tambah Rumah"}
          </button>
          <Link href="/admin/rumah" className="btn btn-quiet">
            Batal
          </Link>
        </div>

        {id && !awal?.adaRiwayatBayar && (
          <div className="sheet p-5 border-terakota/30">
            <p className="font-bold text-terakota mb-1">Zona Berbahaya</p>
            <p className="text-sm text-ink-muted mb-3">
              Rumah ini belum punya riwayat pembayaran, sehingga datanya bisa dihapus permanen.
            </p>
            <HapusButton
              aksi={async () => {
                const h = await hapusRumah(id);
                if (h.ok) window.location.href = "/admin/rumah";
                return h;
              }}
              label="🗑️ Hapus Rumah Ini"
              pesan={`Hapus permanen rumah ${awal?.number} (${awal?.headName})?`}
            />
          </div>
        )}
      </form>

      <aside className="space-y-4">
        <div className="sheet p-5 border-indigo-200 bg-indigo-50/50">
          <p className="font-bold text-indigo-900">👥 Penghuni Rumah</p>
          <p className="text-3xl font-extrabold text-indigo-700 mt-1">
            {awal?.jumlahPenghuni ?? 0}{" "}
            <span className="text-sm font-semibold text-indigo-500">jiwa terdata</span>
          </p>
          {id ? (
            <Link
              href={`/admin/rumah/${id}/penghuni`}
              className="btn btn-sm bg-indigo-600 text-white hover:bg-indigo-700 no-underline mt-3 w-full"
            >
              Buka Data Penghuni &amp; OCR KK →
            </Link>
          ) : (
            <p className="text-xs text-indigo-500 mt-3">
              Simpan dulu data rumah untuk mendata penghuni &amp; scan KK.
            </p>
          )}
        </div>

        <div className="sheet p-5 border-daun/30 bg-daun-soft/40">
          <p className="font-bold text-daun-dark">📘 Panduan Data Rumah</p>
          <ul className="text-sm text-ink-muted mt-2 space-y-1.5 list-disc pl-5">
            <li>Data rumah dipakai untuk tagihan iuran &amp; kabar warga.</li>
            <li>Nomor rumah harus unik — tidak boleh sama dengan rumah lain.</li>
            <li>Nomor HP dipakai untuk kirim pengingat via WhatsApp.</li>
          </ul>
          {awal && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-ink-muted">Status:</span>
              {awal.isActive ? (
                <Badge variant="success">Aktif</Badge>
              ) : (
                <Badge variant="danger">Nonaktif</Badge>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
