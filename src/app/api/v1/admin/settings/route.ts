// Admin: GET/PUT /api/v1/admin/settings — baca & ubah pengaturan situs.
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSettings, invalidateSettingsCache } from "@/lib/settings";
import { j, galat, butuhAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  return j(await getSettings());
}

const skema = z.record(z.string().max(50), z.string().max(2000).nullable());

export async function PUT(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const parsed = skema.safeParse(await req.json());
  if (!parsed.success) return galat("Format pengaturan tidak valid (objek kunci: nilai).");

  await prisma.$transaction(
    Object.entries(parsed.data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );
  invalidateSettingsCache();

  return j(await getSettings());
}
