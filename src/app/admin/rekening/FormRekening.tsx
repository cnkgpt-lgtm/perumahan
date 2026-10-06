"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { isValidQris } from "@/lib/qris";
import { simpanRekening, type HasilForm } from "./actions";
import { Flash, Badge } from "@/components/ui";
import FotoInput from "../_ui/FotoInput";

const DAFTAR_BANK = [
  "BCA",
  "BRI",
  "BNI",
  "Mandiri",
  "BSI",
  "SeaBank",
  "Jago",
  "DANA",
  "GoPay",
  "OVO",
  "ShopeePay",
  "QRIS",
];

export type RekeningAwal = {
  id: string;
  bankName: string;
  accountNumber: string | null;
  accountName: string | null;
  qrisPayload: string | null;
  isActive: boolean;
  adaQris: boolean;
};

export default function FormRekening({ awal }: { awal?: RekeningAwal }) {
  const [hasil, aksi, sibuk] = useActionState<HasilForm, FormData>(simpanRekening, {
    ok: false,
    galat: "",
  });
  const [payload, setPayload] = useState(awal?.qrisPayload ?? "");
  const [cekQris, setCekQris] = useState<"belum" | "valid" | "tidak">(
    awal?.qrisPayload ? "belum" : "belum",
  );
  const id = awal?.id ?? "";

  const validasi = () => {
    if (!payload.trim()) {
      setCekQris("belum");
      return;
    }
    setCekQris(isValidQris(payload.trim()) ? "valid" : "tidak");
  };

  return (
    <form action={aksi} className="space-y-5 max-w-2xl">
      <input type="hidden" name="id" value={id} />
      {!hasil.ok && hasil.galat && <Flash pesan={hasil.galat} jenis="galat" />}

      <div className="sheet p-5 sm:p-6 space-y-5">
        <div>
          <label className="field-label" htmlFor="bank">
            Nama Bank/E-wallet
          </label>
          <input
            id="bank"
            name="bank"
            list="daftar-bank"
            defaultValue={awal?.bankName ?? ""}
            className="input"
            placeholder="Mis. BCA"
            required
          />
          <datalist id="daftar-bank">
            {DAFTAR_BANK.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="field-label" htmlFor="nomor">
              Nomor Rekening/HP
            </label>
            <input
              id="nomor"
              name="nomor"
              defaultValue={awal?.accountNumber ?? ""}
              className="input font-mono"
              placeholder="Mis. 1234567890"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="atas_nama">
              Atas Nama
            </label>
            <input
              id="atas_nama"
              name="atas_nama"
              defaultValue={awal?.accountName ?? ""}
              className="input"
              placeholder="Nama pemilik rekening"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-rule p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="field-label !mb-0">Gambar QRIS</span>
            {awal?.adaQris ? (
              <Badge variant="success">QRIS Aktif</Badge>
            ) : (
              <Badge variant="neutral">Belum ada</Badge>
            )}
          </div>
          {awal?.adaQris && (
            <img
              src={`/api/gambar/qris/${awal.id}`}
              alt="QRIS tersimpan"
              className="w-40 rounded-xl border border-rule bg-white object-contain"
            />
          )}
          <FotoInput
            name="qris"
            label={awal?.adaQris ? "Ganti gambar QRIS" : "Upload gambar QRIS"}
            hint="Opsional. JPG/PNG/WebP, maksimal 5 MB."
          />
          {awal?.adaQris && (
            <label className="flex items-center gap-2 text-sm text-terakota font-semibold cursor-pointer">
              <input
                type="checkbox"
                name="hapus_qris"
                value="1"
                className="size-4 accent-[#ea580c]"
              />
              Hapus gambar QRIS yang tersimpan
            </label>
          )}
        </div>

        <details className="rounded-2xl border border-rule bg-slate-50/60 p-4">
          <summary className="font-bold text-ink cursor-pointer">
            QRIS dinamis (opsional)
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="field-label" htmlFor="qris_payload">
                Payload QRIS statis
              </label>
              <textarea
                id="qris_payload"
                name="qris_payload"
                rows={4}
                value={payload}
                onChange={(e) => {
                  setPayload(e.target.value);
                  setCekQris("belum");
                }}
                className="input font-mono text-xs"
                placeholder="Tempel payload QRIS dari aplikasi bank/e-wallet…"
              />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={validasi} className="btn btn-sm btn-quiet">
                🔎 Validasi
              </button>
              {cekQris === "valid" && <Badge variant="success">✓ Payload valid</Badge>}
              {cekQris === "tidak" && (
                <Badge variant="danger">✕ Payload tidak valid</Badge>
              )}
            </div>
            <p className="field-hint">
              Bila diisi payload valid, halaman bayar menampilkan QR nominal otomatis + kode
              unik.
            </p>
          </div>
        </details>

        <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-rule p-4">
          <input
            type="checkbox"
            name="aktif"
            value="1"
            defaultChecked={awal?.isActive ?? true}
            className="mt-1 size-5 accent-[#16a34a]"
          />
          <span>
            <span className="block font-semibold text-ink">Aktif</span>
            <span className="block text-xs text-ink-muted">
              Hanya rekening aktif yang tampil di halaman Bayar Iuran.
            </span>
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={sibuk} className="btn btn-primary flex-1 sm:flex-none">
          {sibuk ? "Menyimpan…" : id ? "Simpan Perubahan" : "Tambah Rekening"}
        </button>
        <Link href="/admin/rekening" className="btn btn-quiet">
          Batal
        </Link>
      </div>
    </form>
  );
}
