import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker, EmptyState } from "@/components/ui";
import { rupiah, tanggalPanjang } from "@/lib/format";
import { hapusPengeluaran } from "./actions";
import HapusButton from "../_ui/HapusButton";

const PER_HALAMAN = 20;

export default async function PengeluaranPage({
  searchParams,
}: {
  searchParams: Promise<{ halaman?: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const sp = await searchParams;
  const halaman = Math.max(1, parseInt(sp.halaman ?? "1", 10) || 1);

  const [total, rows] = await Promise.all([
    prisma.expense.count(),
    prisma.expense.findMany({
      orderBy: [{ spentOn: "desc" }, { createdAt: "desc" }],
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      include: { recordedBy: { select: { name: true } } },
    }),
  ]);
  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Kicker>Kas Cluster</Kicker>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pengeluaran Kas
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/kas" className="btn btn-quiet">
            📒 Buku Kas Umum
          </Link>
          <Link href="/admin/pengeluaran/baru" className="btn btn-primary">
            ＋ Catat Pengeluaran
          </Link>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {rows.length === 0 && (
          <EmptyState
            judul="Belum ada pengeluaran"
            deskripsi="Catat setiap pengeluaran kas agar transparan ke warga."
            aksi={
              <Link href="/admin/pengeluaran/baru" className="btn btn-primary">
                ＋ Catat Pengeluaran
              </Link>
            }
          />
        )}
        {rows.map((e) => (
          <div key={e.id} className="sheet p-4 flex items-center gap-4">
            <div className="size-11 rounded-2xl bg-terakota-soft text-terakota flex items-center justify-center shrink-0">
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="m19 12-7 7-7-7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink leading-snug">{e.description}</p>
              <p className="text-xs text-ink-muted mt-0.5">
                {tanggalPanjang(e.spentOn)}
                {e.recordedBy ? ` · dicatat ${e.recordedBy.name}` : ""}
              </p>
            </div>
            <p className="font-extrabold text-terakota whitespace-nowrap">
              −{rupiah(e.amount)}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/admin/pengeluaran/${e.id}/ubah`} className="btn btn-sm btn-quiet">
                Ubah
              </Link>
              <HapusButton aksi={hapusPengeluaran.bind(null, e.id)} />
            </div>
          </div>
        ))}
      </div>

      {totalHalaman > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {halaman > 1 && (
            <Link href={`/admin/pengeluaran?halaman=${halaman - 1}`} className="btn btn-sm btn-quiet">
              ← Sebelumnya
            </Link>
          )}
          <span className="text-sm text-ink-muted">
            Halaman {halaman} dari {totalHalaman}
          </span>
          {halaman < totalHalaman && (
            <Link href={`/admin/pengeluaran?halaman=${halaman + 1}`} className="btn btn-sm btn-quiet">
              Berikutnya →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
