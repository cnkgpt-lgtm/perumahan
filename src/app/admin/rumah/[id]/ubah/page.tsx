import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import FormRumah, { type RumahAwal } from "../../FormRumah";

export default async function RumahUbahPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const { id } = await params;

  const r = await prisma.household.findUnique({
    where: { id },
    include: { _count: { select: { members: true, payments: true } } },
  });
  if (!r) notFound();

  const awal: RumahAwal = {
    id: r.id,
    number: r.number,
    headName: r.headName,
    occupancyStatus: r.occupancyStatus,
    phone: r.phone,
    kkNumber: r.kkNumber,
    note: r.note,
    isActive: r.isActive,
    jumlahPenghuni: r._count.members,
    adaRiwayatBayar: r._count.payments > 0,
  };

  return (
    <div>
      <Kicker>Data Master</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Ubah Data Rumah <span className="font-mono">{r.number}</span>
      </h1>
      <FormRumah awal={awal} />
    </div>
  );
}
