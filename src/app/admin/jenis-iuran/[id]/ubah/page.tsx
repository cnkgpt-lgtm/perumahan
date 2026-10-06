import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import FormJenis, { type JenisAwal } from "../../FormJenis";

export default async function JenisUbahPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const { id } = await params;

  const t = await prisma.duesType.findUnique({ where: { id } });
  if (!t) notFound();
  const dipakai =
    (await prisma.payment.count({ where: { duesTypeId: id } })) > 0 ||
    (await prisma.paymentSubmission.count({ where: { duesTypeId: id } })) > 0;

  const awal: JenisAwal = {
    id: t.id,
    name: t.name,
    frequency: t.frequency,
    amount: t.amount,
    startsOn: t.startsOn
      ? `${t.startsOn.getFullYear()}-${String(t.startsOn.getMonth() + 1).padStart(2, "0")}`
      : "",
    dueOn: t.dueOn ? t.dueOn.toISOString().slice(0, 10) : "",
    description: t.description,
    isActive: t.isActive,
    adaPembayaran: dipakai,
  };

  return (
    <div>
      <Kicker>Data Master</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Ubah Jenis Iuran
      </h1>
      <FormJenis awal={awal} />
    </div>
  );
}
