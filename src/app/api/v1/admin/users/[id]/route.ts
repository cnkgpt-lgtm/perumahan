// Admin: DELETE /api/v1/admin/users/[id] — nonaktifkan akun pengurus.
// Dilarang: menonaktifkan diri sendiri & menonaktifkan akun aktif terakhir.
import { prisma } from "@/lib/db";
import { j, galat, butuhAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  if (id === uid) return galat("Tidak bisa menonaktifkan akun sendiri.");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return j({ message: "Akun tidak ditemukan." }, 404);
  if (!target.isActive) return j({ message: "Akun sudah nonaktif." });

  const aktifLain = await prisma.user.count({ where: { isActive: true, id: { not: id } } });
  if (aktifLain === 0) {
    return galat("Tidak bisa menonaktifkan akun aktif terakhir.");
  }

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return j({ message: `Akun ${target.name} dinonaktifkan.` });
}
