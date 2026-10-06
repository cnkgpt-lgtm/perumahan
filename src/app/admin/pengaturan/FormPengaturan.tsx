"use client";

import { useActionState } from "react";
import { simpanPengaturan, gantiSandi, type HasilAksi } from "./actions";
import { Flash } from "@/components/ui";

const AWAL: HasilAksi = { ok: false, galat: "" };

export function FormPengaturan({ awal }: { awal: Record<string, string> }) {
  const [hasil, aksi, sibuk] = useActionState<HasilAksi, FormData>(
    async (_prev, form) => simpanPengaturan(form),
    AWAL,
  );

  return (
    <form action={aksi} className="sheet p-5 sm:p-6 space-y-5">
      <h2 className="text-lg font-extrabold tracking-tight">🏘️ Identitas &amp; Informasi Warga</h2>
      {hasil.ok && <Flash pesan="Pengaturan berhasil disimpan." />}
      {!hasil.ok && hasil.galat && <Flash pesan={hasil.galat} jenis="galat" />}

      <div>
        <label className="field-label" htmlFor="site_name">
          Nama Lingkungan/RT/RW
        </label>
        <input
          id="site_name"
          name="site_name"
          defaultValue={awal.site_name ?? ""}
          className="input"
          placeholder="Mis. RT 04 / RW 07 Griya Asri"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="site_tagline">
          Slogan
        </label>
        <input
          id="site_tagline"
          name="site_tagline"
          defaultValue={awal.site_tagline ?? ""}
          className="input"
          placeholder="Mis. Guyub rukun, transparan, dan amanah"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="address">
          Alamat/Wilayah
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={awal.address ?? ""}
          className="input"
          placeholder="Alamat lengkap lingkungan…"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="treasurer_contact">
          Kontak WhatsApp Bendahara
        </label>
        <input
          id="treasurer_contact"
          name="treasurer_contact"
          defaultValue={awal.treasurer_contact ?? ""}
          className="input"
          placeholder="Mis. 081234567890"
          inputMode="tel"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="payment_info">
          Petunjuk Pembayaran
        </label>
        <textarea
          id="payment_info"
          name="payment_info"
          rows={4}
          defaultValue={awal.payment_info ?? ""}
          className="input"
          placeholder="Mis. Transfer ke rekening di atas, lalu kirim bukti via halaman Bayar…"
        />
        <span className="field-hint">Tampil di halaman Bayar Iuran untuk panduan warga.</span>
      </div>

      <button type="submit" disabled={sibuk} className="btn btn-primary w-full">
        {sibuk ? "Menyimpan…" : "💾 Simpan Pengaturan"}
      </button>
    </form>
  );
}

export function FormSandi() {
  const [hasil, aksi, sibuk] = useActionState<HasilAksi, FormData>(
    async (_prev, form) => gantiSandi(form),
    AWAL,
  );

  return (
    <form action={aksi} className="sheet p-5 sm:p-6 space-y-5">
      <h2 className="text-lg font-extrabold tracking-tight">🔑 Ganti Kata Sandi</h2>
      {hasil.ok && <Flash pesan="Kata sandi berhasil diganti." />}
      {!hasil.ok && hasil.galat && <Flash pesan={hasil.galat} jenis="galat" />}

      <div>
        <label className="field-label" htmlFor="sandi_lama">
          Kata Sandi Saat Ini
        </label>
        <input id="sandi_lama" name="sandi_lama" type="password" className="input" autoComplete="current-password" />
      </div>
      <div>
        <label className="field-label" htmlFor="sandi_baru">
          Kata Sandi Baru
        </label>
        <input id="sandi_baru" name="sandi_baru" type="password" className="input" autoComplete="new-password" />
        <span className="field-hint">Minimal 8 karakter.</span>
      </div>
      <div>
        <label className="field-label" htmlFor="sandi_ulangi">
          Ulangi Kata Sandi Baru
        </label>
        <input id="sandi_ulangi" name="sandi_ulangi" type="password" className="input" autoComplete="new-password" />
      </div>

      <button type="submit" disabled={sibuk} className="btn btn-quiet w-full">
        {sibuk ? "Menyimpan…" : "Ganti Kata Sandi"}
      </button>
    </form>
  );
}

export default FormPengaturan;
