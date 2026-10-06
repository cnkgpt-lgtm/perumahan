import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import FormRumah from "../FormRumah";

export default async function RumahBaruPage() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");

  return (
    <div>
      <Kicker>Data Master</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Tambah Rumah Baru
      </h1>
      <FormRumah />
    </div>
  );
}
