import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import AreaPengurus from "./AreaPengurus";

export default async function PengurusPage() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const sayaId = (s.user as { id?: string }).id ?? "";

  const daftar = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div>
      <Kicker>Konfigurasi</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Kelola Akun Pengurus
      </h1>
      <AreaPengurus daftar={daftar} sayaId={sayaId} />
    </div>
  );
}
