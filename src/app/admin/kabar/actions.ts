"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { slugify } from "@/lib/format";

const KATEGORI_VALID = ["pengumuman", "berita", "kegiatan", "iuran"];
const TIPE_GAMBAR = ["image/jpeg", "image/png", "image/webp"];
const MAKS_GAMBAR = 5 * 1024 * 1024;

export type HasilForm = { ok: false; galat: string } | { ok: true };

async function wajibLogin() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  return (s.user as { id?: string }).id ?? "";
}

async function bacaGambar(
  file: File | null,
): Promise<{ buf: Uint8Array<ArrayBuffer>; tipe: string } | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAKS_GAMBAR) throw new Error("Ukuran gambar maksimal 5 MB.");
  if (!TIPE_GAMBAR.includes(file.type))
    throw new Error("Gambar harus berformat JPG, PNG, atau WebP.");
  return { buf: (new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>), tipe: file.type };
}

async function slugUnik(judul: string, kecualiId?: string): Promise<string> {
  const dasar = slugify(judul) || "kabar";
  let slug = dasar;
  let i = 2;
  for (;;) {
    const ada = await prisma.post.findFirst({
      where: { slug, ...(kecualiId ? { id: { not: kecualiId } } : {}) },
      select: { id: true },
    });
    if (!ada) return slug;
    slug = `${dasar}-${i++}`;
  }
}

export async function simpanKabar(
  _sebelum: HasilForm,
  form: FormData,
): Promise<HasilForm> {
  const penulisId = await wajibLogin();
  const id = String(form.get("id") ?? "").trim();
  const judul = String(form.get("judul") ?? "").trim();
  const kategori = String(form.get("kategori") ?? "pengumuman");
  const isi = String(form.get("isi") ?? "").trim();
  const waktuKegiatan = String(form.get("waktu_kegiatan") ?? "").trim();
  const lokasiKegiatan = String(form.get("lokasi_kegiatan") ?? "").trim();
  const publikasi = String(form.get("publikasi") ?? "").trim();
  const disematkan = form.get("disematkan") === "1";
  const popup = form.get("popup") === "1";

  if (!judul) return { ok: false, galat: "Judul kabar wajib diisi." };
  if (!KATEGORI_VALID.includes(kategori))
    return { ok: false, galat: "Kategori tidak dikenal." };
  if (!isi) return { ok: false, galat: "Isi kabar wajib diisi." };
  if (kategori === "kegiatan" && !waktuKegiatan)
    return { ok: false, galat: "Untuk kategori Kegiatan, waktu & tanggal wajib diisi." };

  try {
    const foto = await bacaGambar(form.get("foto") as File | null);
    const gambarPopup = await bacaGambar(form.get("gambar_popup") as File | null);

    const data = {
      title: judul,
      category: kategori,
      body: isi,
      eventStartsAt: waktuKegiatan ? new Date(waktuKegiatan) : null,
      eventLocation: kategori === "kegiatan" ? lokasiKegiatan || null : null,
      isPinned: disematkan,
      isPopup: popup,
      publishedAt: publikasi ? new Date(publikasi) : null,
      ...(foto ? { image: foto.buf, imageType: foto.tipe } : {}),
      ...(gambarPopup ? { popupImage: gambarPopup.buf, popupImageType: gambarPopup.tipe } : {}),
    };

    if (id) {
      const lama = await prisma.post.findUnique({ where: { id }, select: { id: true } });
      if (!lama) return { ok: false, galat: "Kabar tidak ditemukan." };
      const slug = await slugUnik(judul, id);
      await prisma.post.update({ where: { id }, data: { ...data, slug } });
    } else {
      const slug = await slugUnik(judul);
      await prisma.post.create({ data: { ...data, slug, authorId: penulisId } });
    }
  } catch (e) {
    return { ok: false, galat: e instanceof Error ? e.message : "Gagal menyimpan kabar." };
  }

  revalidatePath("/admin/kabar");
  revalidatePath("/kabar");
  revalidatePath("/");
  redirect("/admin/kabar");
}

export async function hapusKabar(id: string): Promise<{ ok: boolean; galat?: string }> {
  await wajibLogin();
  try {
    await prisma.post.delete({ where: { id } });
  } catch {
    return { ok: false, galat: "Gagal menghapus kabar." };
  }
  revalidatePath("/admin/kabar");
  revalidatePath("/kabar");
  revalidatePath("/");
  return { ok: true };
}
