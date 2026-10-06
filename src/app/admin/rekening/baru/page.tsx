import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import FormRekening from "../FormRekening";

export default async function RekeningBaruPage() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");

  return (
    <div>
      <Kicker>Bayar Online Warga</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Tambah Rekening
      </h1>
      <FormRekening />
    </div>
  );
}
