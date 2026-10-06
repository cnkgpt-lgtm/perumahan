// Admin: GET/PUT/DELETE /api/v1/admin/posts/[id] — kelola satu kabar.
// PUT memakai multipart; gambar hanya diganti bila ada berkas baru.
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";
import { j, galat, butuhAdmin, str, bool, validasiBerkas } from "@/lib/api";
import { ringkasKabarAdmin } from "@/lib/api";

const skema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(200).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan strip.")
    .max(100)
    .optional(),
  category: z.enum(["pengumuman", "berita", "kegiatan"]).optional(),
  body: z.string().trim().min(1, "Isi kabar wajib diisi.").optional(),
  published_at: z.string().optional().nullable(),
  is_pinned: z.boolean().optional(),
  is_popup: z.boolean().optional(),
  event_starts_at: z.string().optional().nullable(),
  event_location: z.string().max(200).optional().nullable(),
});

function tanggalValid(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined;
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const p = await prisma.post.findUnique({ where: { id }, include: { author: true } });
  if (!p) return j({ message: "Kabar tidak ditemukan." }, 404);

  return j({
    ...ringkasKabarAdmin(p),
    body: p.body,
    event_starts_at: p.eventStartsAt ? p.eventStartsAt.toISOString() : null,
    event_location: p.eventLocation,
    image_url: p.image ? `/api/gambar/kabar/${p.id}` : null,
    popup_image_url: p.popupImage ? `/api/gambar/popup/${p.id}` : null,
    author_name: p.author?.name ?? null,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.post.findUnique({ where: { id } });
  if (!ada) return j({ message: "Kabar tidak ditemukan." }, 404);

  const form = await req.formData();
  const nilai = {
    title: str(form, "title"),
    slug: str(form, "slug") ?? undefined,
    category: str(form, "category"),
    body: str(form, "body"),
    published_at: form.has("published_at") ? str(form, "published_at") : undefined,
    is_pinned: form.has("is_pinned") ? bool(str(form, "is_pinned")) : undefined,
    is_popup: form.has("is_popup") ? bool(str(form, "is_popup")) : undefined,
    event_starts_at: form.has("event_starts_at") ? str(form, "event_starts_at") : undefined,
    event_location: form.has("event_location") ? str(form, "event_location") : undefined,
  };
  // Hilangkan kunci null agar tidak menimpa dengan nilai kosong.
  const bersih = Object.fromEntries(
    Object.entries(nilai).filter(([, v]) => v !== null && v !== undefined),
  );
  const parsed = skema.safeParse(bersih);
  if (!parsed.success) return galat(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  const b = parsed.data;

  const slug = b.slug ?? (b.title ? slugify(b.title) : undefined);
  if (slug && slug !== ada.slug) {
    const dipakai = await prisma.post.findUnique({ where: { slug } });
    if (dipakai) return galat("Slug sudah dipakai kabar lain.");
  }

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

  const diubah = await prisma.post.update({
    where: { id },
    data: {
      ...(b.title ? { title: b.title } : {}),
      ...(slug ? { slug } : {}),
      ...(b.category ? { category: b.category } : {}),
      ...(b.body ? { body: b.body } : {}),
      ...(publishedAt !== undefined ? { publishedAt } : {}),
      ...(b.is_pinned !== undefined ? { isPinned: b.is_pinned } : {}),
      ...(b.is_popup !== undefined ? { isPopup: b.is_popup } : {}),
      ...(eventStartsAt !== undefined ? { eventStartsAt } : {}),
      ...(b.event_location !== undefined ? { eventLocation: b.event_location } : {}),
      ...(gambar && gambar.size > 0
        ? { image: (new Uint8Array(await gambar.arrayBuffer()) as Uint8Array<ArrayBuffer>), imageType: gambar.type }
        : {}),
      ...(popup && popup.size > 0
        ? { popupImage: (new Uint8Array(await popup.arrayBuffer()) as Uint8Array<ArrayBuffer>), popupImageType: popup.type }
        : {}),
    },
  });

  return j(ringkasKabarAdmin(diubah));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await butuhAdmin();
  if (uid instanceof Response) return uid;

  const { id } = await params;
  const ada = await prisma.post.findUnique({ where: { id } });
  if (!ada) return j({ message: "Kabar tidak ditemukan." }, 404);

  await prisma.post.delete({ where: { id } });
  return j({ message: "Kabar dihapus." });
}
