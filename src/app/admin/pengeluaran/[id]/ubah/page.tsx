import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import FormPengeluaran, { type PengeluaranAwal } from "../../FormPengeluaran";

export default async function PengeluaranUbahPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const { id } = await params;

  const e = await prisma.expense.findUnique({ where: { id } });
  if (!e) notFound();

  const awal: PengeluaranAwal = {
    id: e.id,
    description: e.description,
    amount: e.amount,
    spentOn: e.spentOn.toISOString().slice(0, 10),
  };

  return (
    <div>
      <Kicker>Kas Cluster</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Ubah Pengeluaran
      </h1>
      <FormPengeluaran awal={awal} />
    </div>
  );
}
