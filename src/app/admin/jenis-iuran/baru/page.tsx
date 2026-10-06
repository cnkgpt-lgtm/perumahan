import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import FormJenis from "../FormJenis";

export default async function JenisBaruPage() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");

  return (
    <div>
      <Kicker>Data Master</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Tambah Jenis Iuran
      </h1>
      <FormJenis />
    </div>
  );
}
