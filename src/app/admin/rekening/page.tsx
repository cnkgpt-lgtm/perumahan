import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker, Badge, EmptyState } from "@/components/ui";

type BarisRek = {
  id: string;
  bankName: string;
  accountNumber: string | null;
  accountName: string | null;
  qrisPayload: string | null;
  isActive: boolean;
  adaQris: boolean;
};

export default async function RekeningPage() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");

  const rows = await prisma.$queryRaw<BarisRek[]>`
    SELECT id, "bankName", "accountNumber", "accountName", "qrisPayload", "isActive",
           "qrisImage" IS NOT NULL AS "adaQris"
    FROM "BankAccount"
    ORDER BY "isActive" DESC, position ASC, "bankName" ASC
  `;

  return (
    <div>
      <Kicker>Bayar Online Warga</Kicker>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Rekening Pembayaran
          </h1>
          <p className="text-ink-muted mt-2 text-sm max-w-xl">
            Rekening aktif tampil di halaman Bayar Iuran. Tanpa rekening aktif, bayar online
            tidak dibuka.
          </p>
        </div>
        <Link href="/admin/rekening/baru" className="btn btn-primary">
          ＋ Tambah Rekening
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {rows.length === 0 && (
          <EmptyState
            judul="Belum ada rekening"
            deskripsi="Tambahkan rekening agar warga bisa membayar iuran secara online."
            aksi={
              <Link href="/admin/rekening/baru" className="btn btn-primary">
                ＋ Tambah Rekening
              </Link>
            }
          />
        )}
        {rows.map((r) => (
          <div key={r.id} className="sheet p-4 flex gap-4 items-center">
            {r.adaQris ? (
              <img
                src={`/api/gambar/qris/${r.id}`}
                alt={`QRIS ${r.bankName}`}
                className="size-16 rounded-xl object-contain border border-rule bg-white shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="size-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-ink text-lg">{r.bankName}</span>
                {!r.isActive && <Badge variant="danger">Nonaktif</Badge>}
                {r.adaQris && <Badge variant="success">ada QRIS</Badge>}
              </div>
              <p className="font-mono text-ink-muted mt-0.5">{r.accountNumber ?? "—"}</p>
              <p className="text-xs text-ink-subtle mt-0.5">
                a.n. {r.accountName ?? "—"}
                {r.qrisPayload ? " · QRIS dinamis aktif" : ""}
              </p>
            </div>
            <Link href={`/admin/rekening/${r.id}/ubah`} className="btn btn-sm btn-quiet shrink-0">
              ✏️ Ubah
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
