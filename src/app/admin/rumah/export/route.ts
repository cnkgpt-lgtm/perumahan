import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// Unduh CSV data rumah warga (siap dibuka di Excel).
export async function GET() {
  const s = await auth();
  if (!s?.user) return new NextResponse("Perlu login", { status: 401 });

  const rumah = await prisma.household.findMany({
    orderBy: { number: "asc" },
    include: {
      _count: { select: { members: true } },
      payments: { select: { amount: true } },
    },
  });

  const sel = (v: string | number | null | undefined): string => {
    const t = String(v ?? "");
    return `"${t.replace(/"/g, '""')}"`;
  };

  const baris: string[][] = [
    [
      "Nomor Rumah",
      "Kepala Keluarga",
      "No HP",
      "No KK",
      "Status Hunian",
      "Status Aktif",
      "Jumlah Penghuni",
      "Total Bayar (Rp)",
    ],
  ];
  for (const r of rumah) {
    const total = r.payments.reduce((a, p) => a + p.amount, 0);
    baris.push([
      r.number,
      r.headName,
      r.phone ?? "",
      r.kkNumber ?? "",
      r.occupancyStatus === "kontrak" ? "Kontrak" : "Pemilik",
      r.isActive ? "Aktif" : "Nonaktif",
      String(r._count.members),
      String(total),
    ]);
  }

  const csv = "\uFEFF" + baris.map((b) => b.map(sel).join(",")).join("\r\n");
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const cap = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rumah-warga-${cap}.csv"`,
    },
  });
}
