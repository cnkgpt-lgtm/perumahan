// Admin: GET/POST /api/v1/admin/users — daftar & tambah akun pengurus.
import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin, ringkasUser } from "@/lib/api";


const skema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100),
  email: z.string().trim().email("Email tidak valid.").max(100),
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(100),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const rows = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return j(rows.map(ringkasUser));
}

export async function POST(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const parsed = skema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const email = b.email.toLowerCase();
  const dipakai = await prisma.user.findUnique({ where: { email } });
  if (dipakai) return galat("Email sudah dipakai akun lain.");

  const dibuat = await prisma.user.create({
    data: { name: b.name, email, passwordHash: await bcrypt.hash(b.password, 10) },
  });

  return j(ringkasUser(dibuat), 201);
}
