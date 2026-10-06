import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker, Badge } from "@/components/ui";
import PenghuniClient, { type AnggotaTampil, type RumahTampil } from "./PenghuniClient";

export default async function PenghuniPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const { id } = await params;

  const r = await prisma.household.findUnique({
    where: { id },
    include: { members: { orderBy: { createdAt: "asc" } } },
  });
  if (!r) notFound();

  const cek = await prisma.$queryRaw<{ ada: boolean }[]>`
    SELECT "kkImage" IS NOT NULL AS ada FROM "Household" WHERE id = ${id}
  `;

  const rumah: RumahTampil = {
    id: r.id,
    number: r.number,
    headName: r.headName,
    occupancyStatus: r.occupancyStatus,
    kkNumber: r.kkNumber,
    adaFotoKk: cek[0]?.ada ?? false,
  };

  const anggota: AnggotaTampil[] = r.members.map((m) => ({
    id: m.id,
    nik: m.nik,
    name: m.name,
    familyRelation: m.familyRelation,
    gender: m.gender,
    birthPlace: m.birthPlace,
    birthDate: m.birthDate ? m.birthDate.toISOString().slice(0, 10) : "",
    religion: m.religion,
    education: m.education,
    job: m.job,
    maritalStatus: m.maritalStatus,
    phone: m.phone,
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="badge bg-ink text-white font-mono text-sm">{r.number}</span>
        <Kicker>Data Master</Kicker>
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
        Data Penghuni &amp; Kartu Keluarga
      </h1>
      <div className="flex flex-wrap items-center gap-2 mt-2 mb-6">
        <span className="text-sm text-ink-muted font-semibold">{r.headName}</span>
        {r.occupancyStatus === "kontrak" ? (
          <span className="badge bg-amber-50 text-amber-800 border border-amber-200/60">Kontrak</span>
        ) : (
          <span className="badge bg-blue-50 text-blue-700 border border-blue-200">Pemilik</span>
        )}
        {r.kkNumber && (
          <span className="text-xs font-mono text-ink-muted">KK: {r.kkNumber}</span>
        )}
        <Badge variant="success">{r.members.length} Anggota Terdata</Badge>
      </div>

      <PenghuniClient rumah={rumah} anggota={anggota} />
    </div>
  );
}
