"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, EmptyState } from "@/components/ui";
import ModalAnggota, { type AnggotaAwal } from "./ModalAnggota";
import PanelOcr from "./PanelOcr";
import { hapusAnggota } from "./actions";
import HapusButton from "../../../_ui/HapusButton";

export type AnggotaTampil = {
  id: string;
  nik: string | null;
  name: string;
  familyRelation: string | null;
  gender: string | null;
  birthPlace: string | null;
  birthDate: string; // "YYYY-MM-DD" atau ""
  religion: string | null;
  education: string | null;
  job: string | null;
  maritalStatus: string | null;
  phone: string | null;
};

export type RumahTampil = {
  id: string;
  number: string;
  headName: string;
  occupancyStatus: string | null;
  kkNumber: string | null;
  adaFotoKk: boolean;
};

function usia(tgl: string): string {
  if (!tgl) return "—";
  const lahir = new Date(tgl + "T00:00:00");
  const kini = new Date();
  let th = kini.getFullYear() - lahir.getFullYear();
  const m = kini.getMonth() - lahir.getMonth();
  if (m < 0 || (m === 0 && kini.getDate() < lahir.getDate())) th--;
  return `${th} thn`;
}

function tglLahir(t: string): string {
  if (!t) return "—";
  const [y, m, d] = t.split("-");
  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${Number(d)} ${BULAN[Number(m) - 1]} ${y}`;
}

export default function PenghuniClient({
  rumah,
  anggota,
}: {
  rumah: RumahTampil;
  anggota: AnggotaTampil[];
}) {
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [editTarget, setEditTarget] = useState<AnggotaAwal | null>(null);
  const router = useRouter();

  const segarkan = () => router.refresh();

  const bukaTambah = () => {
    setEditTarget(null);
    setModalTerbuka(true);
  };
  const bukaUbah = (a: AnggotaTampil) => {
    setEditTarget({
      id: a.id,
      nik: a.nik ?? "",
      name: a.name,
      familyRelation: a.familyRelation ?? "",
      gender: a.gender ?? "",
      birthPlace: a.birthPlace ?? "",
      birthDate: a.birthDate,
      religion: a.religion ?? "",
      education: a.education ?? "",
      job: a.job ?? "",
      maritalStatus: a.maritalStatus ?? "",
      phone: a.phone ?? "",
    });
    setModalTerbuka(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <a href="#panel-ocr" className="btn btn-primary">
          📷 Upload KK &amp; Scan OCR
        </a>
        <button type="button" onClick={bukaTambah} className="btn btn-quiet">
          ＋ Tambah manual
        </button>
        {rumah.adaFotoKk && (
          <a
            href={`/api/gambar/kk/${rumah.id}`}
            target="_blank"
            rel="noopener"
            className="btn btn-quiet"
          >
            🖼️ Lihat Foto KK Tersimpan
          </a>
        )}
      </div>

      <div className="sheet overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-rule flex items-center justify-between">
          <h2 className="font-extrabold tracking-tight">
            Anggota Keluarga <span className="text-ink-muted font-semibold">({anggota.length})</span>
          </h2>
          {rumah.kkNumber && (
            <span className="text-xs font-mono text-ink-muted">KK: {rumah.kkNumber}</span>
          )}
        </div>
        {anggota.length === 0 ? (
          <div className="p-4">
            <EmptyState
              judul="Belum ada penghuni terdata"
              deskripsi="Scan Kartu Keluarga dengan OCR atau tambah manual satu per satu."
              aksi={
                <button type="button" onClick={bukaTambah} className="btn btn-primary">
                  ＋ Tambah manual
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {["#", "Nama Lengkap", "NIK", "Hubungan", "L/P", "Lahir / Usia", "Pekerjaan & Agama", "No. HP", "Aksi"].map(
                    (h) => (
                      <th key={h} className="px-3 py-2.5 font-bold text-ink-muted whitespace-nowrap text-xs uppercase tracking-wide">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {anggota.map((a, i) => (
                  <tr key={a.id} className="border-t border-rule hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 text-ink-subtle">{i + 1}</td>
                    <td className="px-3 py-2.5 font-bold text-ink">{a.name}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">
                      {a.nik ?? <span className="text-ink-subtle">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {a.familyRelation ? (
                        <Badge variant="neutral">{a.familyRelation}</Badge>
                      ) : (
                        <span className="text-ink-subtle">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-bold">{a.gender ?? "—"}</td>
                    <td className="px-3 py-2.5 text-ink-muted whitespace-nowrap">
                      {a.birthPlace ? `${a.birthPlace}, ` : ""}
                      {tglLahir(a.birthDate)}
                      <span className="block text-xs text-ink-subtle">
                        {a.birthDate ? usia(a.birthDate) : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted">
                      {a.job ?? <span className="text-ink-subtle">—</span>}
                      {a.religion && <span className="block text-xs text-ink-subtle">{a.religion}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted">{a.phone ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => bukaUbah(a)}
                          className="btn btn-sm btn-quiet"
                        >
                          Ubah
                        </button>
                        <HapusButton aksi={hapusAnggota.bind(null, a.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PanelOcr householdId={rumah.id} onSelesai={segarkan} />

      <ModalAnggota
        householdId={rumah.id}
        awal={editTarget}
        terbuka={modalTerbuka}
        onTutup={() => setModalTerbuka(false)}
        onSelesai={segarkan}
      />
    </div>
  );
}
