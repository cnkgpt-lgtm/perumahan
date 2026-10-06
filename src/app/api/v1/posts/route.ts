// GET /api/v1/posts — daftar kabar (kabar publik).
// Query: kategori=pengumuman|berita|kegiatan, halaman=1, per_halaman=10
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { j, ringkasKabar, sudahTerbit, paginasi, metaHalaman } from "@/lib/api";

const KATEGORI = ["pengumuman", "berita", "kegiatan"] as const;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const kategori = url.searchParams.get("kategori");
  if (kategori && !(KATEGORI as readonly string[]).includes(kategori)) {
    return j({ message: "Kategori tidak dikenal." }, 422);
  }
  const { halaman, per, lewati } = paginasi(url, 10);
  const where = { ...sudahTerbit(), ...(kategori ? { category: kategori } : {}) };

  const [total, data] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      skip: lewati,
      take: per,
    }),
  ]);

  return j({ data: data.map(ringkasKabar), meta: metaHalaman(total, halaman, per) });
}
