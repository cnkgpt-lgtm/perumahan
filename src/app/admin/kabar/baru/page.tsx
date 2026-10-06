import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import FormKabar from "../FormKabar";

export default async function KabarBaruPage() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");

  return (
    <div className="max-w-3xl">
      <Kicker>Konten Web Warga</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Tulis Kabar Baru
      </h1>
      <FormKabar />
    </div>
  );
}
