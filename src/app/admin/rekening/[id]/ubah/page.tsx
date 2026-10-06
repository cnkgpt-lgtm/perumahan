import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import FormRekening, { type RekeningAwal } from "../../FormRekening";

export default async function RekeningUbahPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const { id } = await params;

  const r = await prisma.bankAccount.findUnique({ where: { id } });
  if (!r) notFound();

  const awal: RekeningAwal = {
    id: r.id,
    bankName: r.bankName,
    accountNumber: r.accountNumber,
    accountName: r.accountName,
    qrisPayload: r.qrisPayload,
    isActive: r.isActive,
    adaQris: !!r.qrisImage,
  };

  return (
    <div>
      <Kicker>Bayar Online Warga</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Ubah Rekening
      </h1>
      <FormRekening awal={awal} />
    </div>
  );
}
