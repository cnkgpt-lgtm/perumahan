// GET /api/v1/home — ringkasan beranda publik.
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { labelPeriode } from "@/lib/format";
import { currentProgress } from "@/lib/ledger";
import { j, ringkasKabar, sudahTerbit } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();

  const [pinned, upcoming, latest, totalBalance, totalHouseholds, progress] = await Promise.all([
    prisma.post.findMany({
      where: { ...sudahTerbit(), isPinned: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.post.findMany({
      where: {
        ...sudahTerbit(),
        category: "kegiatan",
        eventStartsAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      orderBy: { eventStartsAt: "asc" },
      take: 3,
    }),
    prisma.post.findMany({
      where: sudahTerbit(),
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.payment
      .aggregate({ _sum: { amount: true } })
      .then((p) =>
        prisma.expense
          .aggregate({ _sum: { amount: true } })
          .then((e) => (p._sum.amount ?? 0) - (e._sum.amount ?? 0)),
      ),
    prisma.household.count({ where: { isActive: true } }),
    currentProgress(),
  ]);

  return j({
    site: {
      name: settings.site_name || "SISTER",
      tagline: settings.site_tagline || "Sistem Informasi Cluster",
      address: settings.address || "",
      treasurer_contact: settings.treasurer_contact || "",
    },
    pinned: pinned.map(ringkasKabar),
    upcoming: upcoming.map((p) => ({
      ...ringkasKabar(p),
      event_starts_at: p.eventStartsAt ? p.eventStartsAt.toISOString() : null,
      event_location: p.eventLocation,
    })),
    latest: latest.map(ringkasKabar),
    progress: progress.map(({ type, label, paid, total }) => ({
      dues_type: { id: type.id, name: type.name, amount: type.amount, frequency: type.frequency },
      label: type.frequency === "bulanan" ? labelPeriode(label) : label,
      paid,
      total,
    })),
    total_balance: totalBalance,
    total_households: totalHouseholds,
  });
}
