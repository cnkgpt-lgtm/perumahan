"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import FormTambahPengurus from "./FormTambahPengurus";
import { cabutAkses } from "./actions";
import HapusButton from "../_ui/HapusButton";

export type PengurusTampil = {
  id: string;
  name: string;
  email: string;
};

function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/);
  return (kata[0]?.[0] ?? "?").toUpperCase() + (kata[1]?.[0] ?? "").toUpperCase();
}

export default function AreaPengurus({
  daftar,
  sayaId,
}: {
  daftar: PengurusTampil[];
  sayaId: string;
}) {
  const router = useRouter();

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="sheet p-5 sm:p-6">
        <h2 className="text-lg font-extrabold tracking-tight mb-4">
          Daftar Pengurus Aktif ({daftar.length})
        </h2>
        <ul className="space-y-3">
          {daftar.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-2xl border border-rule p-3"
            >
              <span className="size-11 rounded-2xl bg-daun-soft text-daun-dark font-extrabold flex items-center justify-center shrink-0">
                {inisial(u.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink flex items-center gap-2 flex-wrap">
                  {u.name}
                  {u.id === sayaId && <Badge variant="success">Anda</Badge>}
                </p>
                <p className="text-xs text-ink-muted truncate">{u.email}</p>
              </div>
              {u.id !== sayaId && (
                <HapusButton
                  aksi={cabutAkses.bind(null, u.id)}
                  label="Cabut Akses"
                  pesan={`Cabut akses ${u.name}? Ia tidak bisa masuk lagi.`}
                />
              )}
            </li>
          ))}
        </ul>
        {daftar.length === 0 && (
          <p className="text-sm text-ink-muted">Tidak ada pengurus aktif.</p>
        )}
      </div>

      <FormTambahPengurus onSukses={() => router.refresh()} />
    </div>
  );
}
