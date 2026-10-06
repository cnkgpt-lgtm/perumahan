export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import AdminShell from "./AdminShell";

export const metadata = { title: "Panel Pengurus" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");

  const [settings, pendingCount] = await Promise.all([
    getSettings(),
    prisma.paymentSubmission.count({ where: { status: "menunggu" } }),
  ]);

  return (
    <AdminShell
      siteName={settings.site_name || "SISTER"}
      userName={s.user?.name ?? "Pengurus"}
      pendingCount={pendingCount}
    >
      {children}
    </AdminShell>
  );
}
