// Admin: PUT /api/v1/admin/password — ganti kata sandi akun sendiri.
// Body: { current_password, password, password_confirmation }
import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin } from "@/lib/api";

const skema = z.object({
  current_password: z.string().min(1, "Kata sandi lama wajib diisi."),
  password: z.string().min(8, "Kata sandi baru minimal 8 karakter.").max(100),
  password_confirmation: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
});

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const parsed = skema.safeParse(await req.json());
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  if (b.password !== b.password_confirmation) {
    return galat("Konfirmasi kata sandi tidak sama.");
  }

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return j({ message: "Akun tidak ditemukan." }, 404);

  const cocok = await bcrypt.compare(b.current_password, user.passwordHash);
  if (!cocok) return galat("Kata sandi lama salah.");

  await prisma.user.update({
    where: { id: uid },
    data: { passwordHash: await bcrypt.hash(b.password, 10) },
  });

  return j({ message: "Kata sandi berhasil diganti." });
}
