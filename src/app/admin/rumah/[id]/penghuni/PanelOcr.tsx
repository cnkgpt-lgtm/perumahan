"use client";

import { useRef, useState } from "react";
import { simpanHasilOcr, type AnggotaInput } from "./actions";
import { OPSI_HUBUNGAN, OPSI_AGAMA, OPSI_PENDIDIKAN, OPSI_KAWIN } from "./opsi";

// Satu baris hasil pecahan teks OCR → siap jadi anggota keluarga.
export type BarisOcr = {
  nik: string;
  nama: string;
  hubungan: string;
  gender: string;
  tempatLahir: string;
  tglLahir: string; // YYYY-MM-DD
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  statusNikah: string;
  phone: string;
};

const KATA_AGAMA = ["ISLAM", "KRISTEN", "KATHOLIK", "KATOLIK", "HINDU", "BUDHA", "BUDDHA", "KONGHUCU"];
const KATA_KAWIN = ["BELUM KAWIN", "KAWIN", "CERAI HIDUP", "CERAI MATI"];

function kataDitemukan(teks: string, daftar: string[]): string {
  const t = ` ${teks.toUpperCase()} `;
  for (const k of daftar) {
    if (t.includes(` ${k} `) || t.includes(` ${k},`) || t.includes(` ${k}.`)) {
      if (k === "KATOLIK" || k === "BUDHA") return k === "KATOLIK" ? "KATHOLIK" : "BUDDHA";
      return k;
    }
  }
  return "";
}

/** Heuristik: cari baris ber-NIK 16 digit lalu pecah kolomnya. */
export function pecahBarisAnggota(teks: string): BarisOcr[] {
  const hasil: BarisOcr[] = [];
  for (const mentah of teks.split(/\r?\n/)) {
    const baris = mentah.trim();
    if (baris.length < 12) continue;
    const mNik = baris.match(/\d(?:[\d\s.\-]{14,})\d/);
    const digit = (mNik?.[0] ?? "").replace(/\D/g, "");
    if (digit.length !== 16) continue;

    let kolom = baris.split("|").map((k) => k.trim()).filter(Boolean);
    if (kolom.length < 3)
      kolom = baris.split(/\s{2,}|\t+/).map((k) => k.trim()).filter(Boolean);

    const row: BarisOcr = {
      nik: digit, nama: "", hubungan: "", gender: "", tempatLahir: "",
      tglLahir: "", agama: "", pendidikan: "", pekerjaan: "", statusNikah: "", phone: "",
    };
    const sisa: string[] = [];

    for (const k of kolom) {
      if (k.replace(/\D/g, "") === digit) continue; // kolom NIK, sudah dicatat
      const up = k.toUpperCase();
      if (!row.gender && /LAKI/.test(up)) { row.gender = "L"; continue; }
      if (!row.gender && /PEREMPUAN/.test(up)) { row.gender = "P"; continue; }
      if (!row.gender && /^[LP]$/.test(up)) { row.gender = up; continue; }

      // Tanggal lahir — kadang gabung "KOTA, 12-05-1990"
      const mTgl = k.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
      if (!row.tglLahir && mTgl) {
        const dd = mTgl[1].padStart(2, "0");
        const mm = mTgl[2].padStart(2, "0");
        let yy = mTgl[3];
        if (yy.length === 2) yy = Number(yy) > 30 ? "19" + yy : "20" + yy;
        row.tglLahir = `${yy}-${mm}-${dd}`;
        const sebelum = k.slice(0, mTgl.index).replace(/[,;]$/, "").trim();
        if (sebelum && !row.tempatLahir && /[A-Za-z]{2,}/.test(sebelum)) row.tempatLahir = sebelum;
        continue;
      }
      const agama = kataDitemukan(k, KATA_AGAMA);
      if (!row.agama && agama) { row.agama = agama; continue; }
      const kawin = kataDitemukan(k, KATA_KAWIN);
      if (!row.statusNikah && kawin) { row.statusNikah = kawin; continue; }
      const hub = kataDitemukan(k, OPSI_HUBUNGAN);
      if (!row.hubungan && hub) { row.hubungan = hub; continue; }
      sisa.push(k);
    }

    // Sisa kolom: nama dulu, lalu tempat lahir, sisanya pekerjaan terpanjang.
    const berhuruf = sisa.filter((k) => /[A-Za-z]{3,}/.test(k));
    if (berhuruf.length > 0) row.nama = berhuruf[0].replace(/^\d+\s*/, "").trim();
    const tanpaNama = berhuruf.slice(1);
    if (!row.tempatLahir && tanpaNama.length > 0) row.tempatLahir = tanpaNama[0];
    const kandidatKerja = sisa.filter(
      (k) => k !== row.nama && k !== row.tempatLahir && /[A-Za-z]{3,}/.test(k),
    );
    if (kandidatKerja.length > 0)
      row.pekerjaan = kandidatKerja.sort((a, b) => b.length - a.length)[0];

    if (row.nama) hasil.push(row);
  }
  return hasil;
}

const KOLOM_OPSI: Record<string, string[]> = {
  hubungan: OPSI_HUBUNGAN,
  agama: OPSI_AGAMA,
  pendidikan: OPSI_PENDIDIKAN,
  statusNikah: OPSI_KAWIN,
};

export default function PanelOcr({
  householdId,
  onSelesai,
}: {
  householdId: string;
  onSelesai: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "memindai" | "selesai">("idle");
  const [progress, setProgress] = useState(0);
  const [teks, setTeks] = useState("");
  const [baris, setBaris] = useState<BarisOcr[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pilihFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPratinjau(URL.createObjectURL(f));
    setStatus("idle");
    setTeks("");
    setBaris([]);
    setGalat(null);
  };

  const mulaiScan = async () => {
    if (!file) return;
    setGalat(null);
    setStatus("memindai");
    setProgress(0);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("ind", undefined, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text")
            setProgress(Math.round((m.progress ?? 0) * 100));
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setTeks(data.text ?? "");
      setStatus("selesai");
      if (!(data.text ?? "").trim())
        setGalat("Tidak ada teks yang terbaca. Coba foto yang lebih jelas dan tegak lurus.");
    } catch {
      setGalat("Gagal menjalankan OCR di browser ini. Coba lagi atau isi manual.");
      setStatus("idle");
    }
  };

  const pecah = () => {
    const hasil = pecahBarisAnggota(teks);
    setBaris(hasil);
    if (hasil.length === 0)
      setGalat("Tidak ditemukan baris ber-NIK 16 digit. Periksa teks mentah lalu sesuaikan manual.");
    else setGalat(null);
  };

  const ubahBaris = (i: number, kunci: keyof BarisOcr, nilai: string) => {
    setBaris((lama) => lama.map((b, j) => (j === i ? { ...b, [kunci]: nilai } : b)));
  };

  const hapusBaris = (i: number) => setBaris((lama) => lama.filter((_, j) => j !== i));

  const simpan = async () => {
    if (baris.length === 0 || !file) return;
    setMenyimpan(true);
    setGalat(null);
    try {
      const fd = new FormData();
      fd.set("household_id", householdId);
      fd.set("teks", teks);
      const anggota: AnggotaInput[] = baris.map((b) => ({
        nik: b.nik,
        name: b.nama,
        familyRelation: b.hubungan,
        gender: b.gender,
        birthPlace: b.tempatLahir,
        birthDate: b.tglLahir,
        religion: b.agama,
        education: b.pendidikan,
        job: b.pekerjaan,
        maritalStatus: b.statusNikah,
        phone: b.phone,
      }));
      fd.set("anggota", JSON.stringify(anggota));
      fd.set("foto_kk", file);
      const hasil = await simpanHasilOcr(fd);
      if (hasil.ok) {
        onSelesai();
      } else {
        setGalat(hasil.galat);
      }
    } catch {
      setGalat("Terjadi kesalahan saat menyimpan.");
    } finally {
      setMenyimpan(false);
    }
  };

  const selKecil = "input !min-h-9 !py-1 !px-2 text-xs w-full min-w-24";

  return (
    <div id="panel-ocr" className="sheet p-5 sm:p-6 scroll-mt-6">
      <h2 className="text-lg font-extrabold tracking-tight">📷 Upload KK &amp; Scan OCR</h2>
      <p className="text-sm text-ink-muted mt-1">
        Foto Kartu Keluarga, pindai otomatis, periksa hasilnya, lalu simpan. Data lama
        penghuni rumah ini akan diganti seluruhnya.
      </p>

      <div
        className="mt-4 rounded-2xl border-2 border-dashed border-rule bg-slate-50/60 p-6 text-center cursor-pointer hover:border-daun/50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pilihFile(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => pilihFile(e.target.files?.[0] ?? null)}
        />
        {pratinjau ? (
          <img src={pratinjau} alt="Foto KK" className="mx-auto max-h-64 rounded-xl border border-rule object-contain" />
        ) : (
          <>
            <p className="text-3xl">🖼️</p>
            <p className="font-bold text-ink mt-2">Ketuk untuk memilih foto KK</p>
            <p className="text-xs text-ink-muted mt-1">atau seret file ke sini · JPG/PNG/WebP maks 5 MB</p>
          </>
        )}
      </div>

      {file && status !== "memindai" && (
        <button type="button" onClick={mulaiScan} className="btn btn-primary w-full mt-4">
          🔍 Mulai Scan Dokumen Ini
        </button>
      )}

      {status === "memindai" && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-ink mb-2">Memindai dokumen… {progress}%</p>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-daun rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-ink-subtle mt-2">Proses berjalan di browser, bisa 30–60 detik.</p>
        </div>
      )}

      {galat && <p className="field-error mt-3">{galat}</p>}

      {status === "selesai" && (
        <div className="mt-5 space-y-4">
          <div>
            <span className="field-label">Teks mentah hasil scan</span>
            <textarea
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              rows={6}
              className="input font-mono text-xs"
            />
          </div>
          <button type="button" onClick={pecah} className="btn btn-quiet">
            ✂️ Pecah jadi baris anggota
          </button>

          {baris.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-xl border border-rule">
                <table className="w-full text-xs min-w-[1400px]">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      {["#", "NIK 16 digit", "Nama Lengkap*", "Hubungan", "L/P", "Tempat Lahir", "Tgl Lahir", "Agama", "Pendidikan", "Pekerjaan", "Status Nikah", "No HP", "Aksi"].map((h) => (
                        <th key={h} className="px-2 py-2 font-bold text-ink-muted whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {baris.map((b, i) => (
                      <tr key={i} className="border-t border-rule">
                        <td className="px-2 py-1.5 text-ink-subtle">{i + 1}</td>
                        <td className="px-1 py-1"><input value={b.nik} onChange={(e) => ubahBaris(i, "nik", e.target.value)} className={`${selKecil} font-mono`} maxLength={16} /></td>
                        <td className="px-1 py-1"><input value={b.nama} onChange={(e) => ubahBaris(i, "nama", e.target.value)} className={selKecil} /></td>
                        {(["hubungan", "gender", "tempatLahir", "tglLahir", "agama", "pendidikan", "pekerjaan", "statusNikah", "phone"] as (keyof BarisOcr)[]).map((k) => (
                          <td key={k} className="px-1 py-1">
                            {KOLOM_OPSI[k] ? (
                              <select value={b[k]} onChange={(e) => ubahBaris(i, k, e.target.value)} className={selKecil}>
                                <option value="">—</option>
                                {KOLOM_OPSI[k].map((o) => (
                                  <option key={o} value={o}>{o}</option>
                                ))}
                              </select>
                            ) : k === "gender" ? (
                              <select value={b[k]} onChange={(e) => ubahBaris(i, k, e.target.value)} className={selKecil}>
                                <option value="">—</option>
                                <option value="L">L</option>
                                <option value="P">P</option>
                              </select>
                            ) : k === "tglLahir" ? (
                              <input type="date" value={b[k]} onChange={(e) => ubahBaris(i, k, e.target.value)} className={selKecil} />
                            ) : (
                              <input value={b[k]} onChange={(e) => ubahBaris(i, k, e.target.value)} className={selKecil} />
                            )}
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <button type="button" onClick={() => hapusBaris(i)} className="text-terakota font-bold hover:underline">
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-ink-muted">
                Periksa &amp; betulkan tiap baris sebelum disimpan. Nama bertanda * wajib diisi.
              </p>
              <button type="button" onClick={simpan} disabled={menyimpan} className="btn btn-primary w-full sm:w-auto">
                {menyimpan ? "Menyimpan…" : `💾 Simpan Data KK (${baris.length} jiwa)`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
