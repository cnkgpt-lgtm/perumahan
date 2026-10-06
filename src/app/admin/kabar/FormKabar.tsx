"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { simpanKabar, type HasilForm } from "./actions";
import { Flash } from "@/components/ui";
import FotoInput from "../_ui/FotoInput";

const KATEGORI = [
  { key: "pengumuman", label: "Pengumuman", desc: "Info resmi untuk warga" },
  { key: "berita", label: "Berita", desc: "Liputan & kabar terkini" },
  { key: "kegiatan", label: "Kegiatan", desc: "Agenda dengan waktu & lokasi" },
  { key: "iuran", label: "Iuran", desc: "Info tagihan & pembayaran" },
];

function untukInput(d: string | Date | null | undefined): string {
  if (!d) return "";
  const t = typeof d === "string" ? new Date(d) : d;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}T${p(t.getHours())}:${p(t.getMinutes())}`;
}

export type KabarAwal = {
  id?: string;
  title?: string;
  category?: string;
  body?: string;
  eventStartsAt?: string | Date | null;
  eventLocation?: string | null;
  isPinned?: boolean;
  isPopup?: boolean;
  publishedAt?: string | Date | null;
  adaFoto?: boolean;
  adaPopup?: boolean;
};

export default function FormKabar({ awal }: { awal?: KabarAwal }) {
  const [hasil, aksi, sibuk] = useActionState<HasilForm, FormData>(simpanKabar, {
    ok: false,
    galat: "",
  });
  const [kategori, setKategori] = useState(awal?.category ?? "pengumuman");

  return (
    <form action={aksi} className="space-y-6">
      <input type="hidden" name="id" value={awal?.id ?? ""} />
      {!hasil.ok && hasil.galat && <Flash pesan={hasil.galat} jenis="galat" />}

      <div className="sheet p-5 sm:p-6">
        <span className="field-label">Kategori Kabar</span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
          {KATEGORI.map((k) => (
            <label
              key={k.key}
              className={`cursor-pointer rounded-xl border-2 px-3 py-3 transition-all ${
                kategori === k.key
                  ? "border-daun bg-daun-soft/60"
                  : "border-rule bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="kategori"
                value={k.key}
                checked={kategori === k.key}
                onChange={() => setKategori(k.key)}
                className="sr-only"
              />
              <span className="block font-bold text-ink">{k.label}</span>
              <span className="block text-xs text-ink-muted mt-0.5">{k.desc}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="sheet p-5 sm:p-6 space-y-5">
        <div>
          <label className="field-label" htmlFor="judul">
            Judul
          </label>
          <input
            id="judul"
            name="judul"
            defaultValue={awal?.title ?? ""}
            className="input"
            placeholder="Mis. Kerja Bakti Rutin Bulan Ini"
            required
          />
        </div>

        {kategori === "kegiatan" && (
          <div className="rounded-2xl border border-daun/30 bg-daun-soft/50 p-4 sm:p-5 space-y-4">
            <p className="font-bold text-daun-dark">📅 Detail Kegiatan</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="waktu_kegiatan">
                  Waktu &amp; Tanggal
                </label>
                <input
                  id="waktu_kegiatan"
                  type="datetime-local"
                  name="waktu_kegiatan"
                  defaultValue={untukInput(awal?.eventStartsAt)}
                  className="input"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="lokasi_kegiatan">
                  Lokasi
                </label>
                <input
                  id="lokasi_kegiatan"
                  name="lokasi_kegiatan"
                  defaultValue={awal?.eventLocation ?? ""}
                  className="input"
                  placeholder="Mis. Balai Warga Blok A"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="isi">
            Isi
          </label>
          <textarea
            id="isi"
            name="isi"
            rows={12}
            defaultValue={awal?.body ?? ""}
            className="input"
            placeholder="Tulis isi kabar di sini…"
            required
          />
          <span className="field-hint">
            Markdown sederhana: <code>**tebal**</code>, <code>*miring*</code>,{" "}
            <code>- list</code>, <code># judul</code>, <code>&gt; kutip</code>
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <FotoInput
            name="foto"
            label="Foto Kabar"
            previewAwal={awal?.adaFoto && awal.id ? `/api/gambar/kabar/${awal.id}` : null}
            hint="Opsional. JPG/PNG/WebP, maksimal 5 MB. Mengganti foto lama bila diisi."
          />
          <FotoInput
            name="gambar_popup"
            label="Gambar Popup"
            previewAwal={awal?.adaPopup && awal.id ? `/api/gambar/popup/${awal.id}` : null}
            hint="Opsional. Ditampilkan sebagai popup saat warga membuka web."
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="disematkan"
              value="1"
              defaultChecked={awal?.isPinned ?? false}
              className="mt-1 size-5 accent-[#16a34a]"
            />
            <span>
              <span className="block font-semibold text-ink">Disematkan di beranda</span>
              <span className="block text-xs text-ink-muted">
                Kabar selalu tampil paling atas di halaman utama warga.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="popup"
              value="1"
              defaultChecked={awal?.isPopup ?? false}
              className="mt-1 size-5 accent-[#16a34a]"
            />
            <span>
              <span className="block font-semibold text-ink">Tampilkan sebagai popup</span>
              <span className="block text-xs text-ink-muted">
                Muncul otomatis sekali saat warga membuka web.
              </span>
            </span>
          </label>
        </div>

        <div>
          <label className="field-label" htmlFor="publikasi">
            Tanggal Publikasi
          </label>
          <input
            id="publikasi"
            type="datetime-local"
            name="publikasi"
            defaultValue={untukInput(awal?.publishedAt)}
            className="input"
          />
          <span className="field-hint">
            Kosongkan untuk menyimpan sebagai draf (tidak tampil di web warga).
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={sibuk} className="btn btn-primary flex-1 sm:flex-none">
          {sibuk ? "Menyimpan…" : awal?.id ? "Simpan Perubahan" : "Terbitkan Kabar"}
        </button>
        <Link href="/admin/kabar" className="btn btn-quiet">
          Batal
        </Link>
      </div>
    </form>
  );
}
