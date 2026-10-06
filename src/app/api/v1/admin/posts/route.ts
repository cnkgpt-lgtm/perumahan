// Admin: GET/POST /api/v1/admin/posts — daftar & tambah kabar.
// POST memakai multipart (gambar opsional).
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";
import { j, galat, butuhAdmin, paginasi, metaHalaman, str, bool, validasiBerkas, ringkasKabarAdmin } from "@/lib/api";

const skema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan strip.")
    .max(100)
    .optional(),
  category: z.enum(["pengumuman", "berita", "kegiatan"]),
  body: z.string().trim().min(1, "Isi kabar wajib diisi."),
  published_at: z.string().optional().nullable(),
  is_pinned: z.boolean().optional().default(false),
  is_popup: z.boolean().optional().default(false),
  event_starts_at: z.string().optional().nullable(),
  event_location: z.string().max(200).optional().nullable(),
});

type NilaiForm = {
  title?: string | null;
  slug?: string | null;
  category?: string | null;
  body?: string | null;
  published_at?: string | null;
  is_pinned?: boolean;
  is_popup?: boolean;
  event_starts_at?: string | null;
  event_location?: string | null;
};

function bacaForm(form: FormData): NilaiForm {
  return {
    title: str(form, "title"),
    slug: str(form, "slug"),
    category: str(form, "category"),
    body: str(form, "body"),
    published_at: str(form, "published_at"),
    is_pinned: bool(str(form, "is_pinned")),
    is_popup: bool(str(form, "is_popup")),
    event_starts_at: str(form, "event_starts_at"),
    event_location: str(form, "event_location"),
  };
}

function tanggalValid(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// GET ?kategori=&halaman=&per_halaman=
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const url = new URL(req.url);
  const kategori = url.searchParams.get("kategori") ?? undefined;
  const { halaman, per, lewati } = paginasi(url, 20);
  const where = kategori ? { category: kategori } : {};

  const [total, rows] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: lewati,
      take: per,
    }),
  ]);

  return j({ data: rows.map(ringkasKabarAdmin), meta: metaHalaman(total, halaman, per) });
}

export async function POST(req: NextRequest) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const form = await req.formData();
  const parsed = skema.safeParse(bacaForm(form));
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const slug = b.slug || slugify(b.title);
  const slugAda = await prisma.post.findUnique({ where: { slug } });
  if (slugAda) return galat("Slug sudah dipakai kabar lain.");

  const publishedAt = tanggalValid(b.published_at);
  if (b.published_at && !publishedAt) return galat("Tanggal terbit tidak valid.");
  const eventStartsAt = tanggalValid(b.event_starts_at);
  if (b.event_starts_at && !eventStartsAt) return galat("Jadwal kegiatan tidak valid.");

  const gambar = form.get("image") as File | null;
  const popup = form.get("popup_image") as File | null;
  for (const [f, nama] of [
    [gambar, "gambar"],
    [popup, "gambar popup"],
  ] as const) {
    if (f && f.size > 0) {
      const e = validasiBerkas(f, ["image/jpeg", "image/png", "image/webp"]);
      if (e) return galat(`${nama}: ${e}`);
    }
  }

  const dibuat = await prisma.post.create({
    data: {
      title: b.title,
      slug,
      category: b.category,
      body: b.body,
      publishedAt,
      isPinned: b.is_pinned,
      isPopup: b.is_popup,
      eventStartsAt,
      eventLocation: b.event_location ?? null,
      image: gambar && gambar.size > 0 ? (new Uint8Array(await gambar.arrayBuffer()) as Uint8Array<ArrayBuffer>) : null,
      imageType: gambar && gambar.size > 0 ? gambar.type : null,
      popupImage: popup && popup.size > 0 ? (new Uint8Array(await popup.arrayBuffer()) as Uint8Array<ArrayBuffer>) : null,
      popupImageType: popup && popup.size > 0 ? popup.type : null,
      authorId: uid,
    },
  });

  return j(ringkasKabarAdmin(dibuat), 201);
}
