"use client";

import { useState, useTransition } from "react";
import { tambahAnggota, ubahAnggota, type AnggotaInput } from "./actions";
import { OPSI_HUBUNGAN, OPSI_AGAMA, OPSI_PENDIDIKAN, OPSI_KAWIN } from "./opsi";

export type AnggotaAwal = AnggotaInput & { id?: string };

const KOSONG: AnggotaInput = {
  nik: "",
  name: "",
  familyRelation: "ANAK",
  gender: "",
  birthPlace: "",
  birthDate: "",
  religion: "",
  education: "",
  job: "",
  maritalStatus: "",
  phone: "",
};

export default function ModalAnggota({
  householdId,
  awal,
  terbuka,
  onTutup,
  onSelesai,
}: {
  householdId: string;
  awal?: AnggotaAwal | null;
  terbuka: boolean;
  onTutup: () => void;
  onSelesai: () => void;
}) {
  const [form, setForm] = useState<AnggotaInput>(KOSONG);
  const [dibukaUntuk, setDibukaUntuk] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, mulai] = useTransition();

  // Sinkronkan form setiap kali modal dibuka untuk baris berbeda.
  const kunci = awal?.id ?? "baru";
  if (terbuka && dibukaUntuk !== `${kunci}`) {
    setDibukaUntuk(`${kunci}`);
    setForm({
      nik: awal?.nik ?? "",
      name: awal?.name ?? "",
      familyRelation: awal?.familyRelation ?? "ANAK",
      gender: awal?.gender ?? "",
      birthPlace: awal?.birthPlace ?? "",
      birthDate: awal?.birthDate ?? "",
      religion: awal?.religion ?? "",
      education: awal?.education ?? "",
      job: awal?.job ?? "",
      maritalStatus: awal?.maritalStatus ?? "",
      phone: awal?.phone ?? "",
    });
    setGalat(null);
  }

  if (!terbuka) return null;

  const set = (k: keyof AnggotaInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const simpan = () => {
    setGalat(null);
    mulai(async () => {
      const hasil = awal?.id
        ? await ubahAnggota(awal.id, form)
        : await tambahAnggota(householdId, form);
      if (hasil.ok) {
        setDibukaUntuk(null);
        onSelesai();
        onTutup();
      } else {
        setGalat(hasil.galat);
      }
    });
  };

  const field = "block w-full";
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onTutup}
    >
      <div
        className="bg-card w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold tracking-tight">
            {awal?.id ? "Ubah Data Anggota" : "Tambah Anggota Manual"}
          </h3>
          <button type="button" onClick={onTutup} className="btn btn-sm btn-quiet" aria-label="Tutup">
            ✕
          </button>
        </div>

        {galat && (
          <div className="mb-4 rounded-2xl border border-terakota/30 bg-terakota-soft px-4 py-3 text-sm font-semibold text-terakota">
            {galat}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className={field}>
            <label className="field-label">Nama Lengkap *</label>
            <input value={form.name} onChange={set("name")} className="input" placeholder="Nama sesuai KK" />
          </div>
          <div className={field}>
            <label className="field-label">NIK (16 digit)</label>
            <input value={form.nik} onChange={set("nik")} className="input font-mono" inputMode="numeric" maxLength={16} placeholder="3273…" />
          </div>
          <div>
            <label className="field-label">Hubungan Keluarga</label>
            <select value={form.familyRelation} onChange={set("familyRelation")} className="input">
              {OPSI_HUBUNGAN.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Jenis Kelamin</label>
            <select value={form.gender} onChange={set("gender")} className="input">
              <option value="">— Pilih —</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
          <div>
            <label className="field-label">Tempat Lahir</label>
            <input value={form.birthPlace} onChange={set("birthPlace")} className="input" />
          </div>
          <div>
            <label className="field-label">Tanggal Lahir</label>
            <input type="date" value={form.birthDate} onChange={set("birthDate")} className="input" />
          </div>
          <div>
            <label className="field-label">Agama</label>
            <select value={form.religion} onChange={set("religion")} className="input">
              <option value="">— Pilih —</option>
              {OPSI_AGAMA.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Pendidikan</label>
            <select value={form.education} onChange={set("education")} className="input">
              <option value="">— Pilih —</option>
              {OPSI_PENDIDIKAN.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Pekerjaan</label>
            <input value={form.job} onChange={set("job")} className="input" />
          </div>
          <div>
            <label className="field-label">Status Perkawinan</label>
            <select value={form.maritalStatus} onChange={set("maritalStatus")} className="input">
              <option value="">— Pilih —</option>
              {OPSI_KAWIN.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">No. HP</label>
            <input value={form.phone} onChange={set("phone")} className="input" inputMode="tel" placeholder="Opsional" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={simpan} disabled={sibuk} className="btn btn-primary flex-1">
            {sibuk ? "Menyimpan…" : awal?.id ? "Simpan Perubahan" : "Tambah Anggota"}
          </button>
          <button type="button" onClick={onTutup} className="btn btn-quiet">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
