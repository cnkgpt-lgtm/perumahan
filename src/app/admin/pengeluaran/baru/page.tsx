import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import FormPengeluaran from "../FormPengeluaran";

export default async function PengeluaranBaruPage() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");

  return (
    <div>
      <Kicker>Kas Cluster</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Catat Pengeluaran
      </h1>
      <FormPengeluaran />
    </div>
  );
}
