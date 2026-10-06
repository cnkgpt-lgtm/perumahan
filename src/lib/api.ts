// Helper bersama untuk REST API v1 SISTER.
import { auth } from "@/auth";

/** Respons JSON standar. */
export function j(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

/** Respons galat validasi/logika bisnis (422 default, bisa dioverride). */
export function galat(message: string, status = 422): Response {
  return Response.json({ message }, { status });
}

/**
 * Penjaga route admin. Mengembalikan userId bila login,
 * atau Response 401 bila belum login.
 */
export async function butuhAdmin(): Promise<string | Response> {
  const s = await auth();
  if (!s?.user) return Response.json({ message: "Perlu login" }, { status: 401 });
  return (s.user as { id?: string }).id ?? "";
}

/** Ringkasan teks dari body kabar (untuk excerpt API). */
export function excerpt(body: string, panjang = 160): string {
  return body
    .replace(/[#>*_`\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, panjang);
}

import type { Post, BankAccount } from "@prisma/client";

/** Format ringkas satu kabar untuk API publik. */
export function ringkasKabar(p: Post) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    excerpt: excerpt(p.body),
    published_at: p.publishedAt ? p.publishedAt.toISOString() : null,
    image_url: p.image ? `/api/gambar/kabar/${p.id}` : null,
    is_pinned: p.isPinned,
  };
}

/** Filter "sudah terbit" untuk kabar publik. */
export function sudahTerbit() {
  return { publishedAt: { not: null, lte: new Date() } };
}

/** Ambil parameter paginasi dari query string. */
export function paginasi(url: URL, def = 10, maks = 100) {
  const halaman = Math.max(1, parseInt(url.searchParams.get("halaman") ?? "1", 10) || 1);
  const per = Math.min(
    maks,
    Math.max(1, parseInt(url.searchParams.get("per_halaman") ?? String(def), 10) || def),
  );
  return { halaman, per, lewati: (halaman - 1) * per };
}

/** Objek meta paginasi standar. */
export function metaHalaman(total: number, halaman: number, per: number) {
  return {
    halaman,
    per_halaman: per,
    total,
    total_halaman: Math.max(1, Math.ceil(total / per)),
  };
}

/** Validasi berkas unggahan bukti/gambar: maks 5 MB, tipe gambar/PDF. */
export function validasiBerkas(
  file: File | null,
  tipeOk: string[] = ["image/jpeg", "image/png", "image/webp", "application/pdf"],
): string | null {
  if (!file || file.size === 0) return "Berkas wajib diunggah.";
  if (file.size > 5 * 1024 * 1024) return "Ukuran berkas maksimal 5 MB.";
  if (!tipeOk.includes(file.type)) return "Berkas harus berupa foto (JPG/PNG/WEBP) atau PDF.";
  return null;
}

/** Ambil satu nilai string dari FormData (trim, null bila kosong). */
export function str(form: FormData, kunci: string): string | null {
  const v = String(form.get(kunci) ?? "").trim();
  return v === "" ? null : v;
}

/** Konversi nilai "1"/"true"/"on" menjadi boolean. */
export function bool(v: string | null | undefined): boolean {
  return v === "1" || v === "true" || v === "on";
}

/** Format ringkas satu kabar untuk API admin. */
export function ringkasKabarAdmin(p: Post) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    published_at: p.publishedAt ? p.publishedAt.toISOString() : null,
    is_pinned: p.isPinned,
    is_popup: p.isPopup,
    has_image: !!p.image,
  };
}

/** Format ringkas satu rekening untuk API admin. */
export function ringkasRekening(a: BankAccount) {
  return {
    id: a.id,
    bank_name: a.bankName,
    account_number: a.accountNumber,
    account_name: a.accountName,
    has_qris_payload: !!a.qrisPayload,
    has_qris: !!(a.qrisImage || a.qrisPayload),
    qris_image_url: a.qrisImage ? `/api/gambar/qris/${a.id}` : null,
    is_active: a.isActive,
    position: a.position,
  };
}

/** Dipindah dari src/app/api/v1/admin/payment-submissions/route.ts. */
export function ringkasPengajuan(s: {
  id: string;
  code: string;
  status: string;
  periods: unknown;
  unitAmount: number;
  uniqueCode: number;
  payerName: string | null;
  createdAt: Date;
  rejectReason: string | null;
  household: { id: string; number: string; headName: string };
  duesType: { id: string; name: string };
  bankAccount: { id: string; bankName: string } | null;
}) {
  const periods = s.periods as string[];
  return {
    id: s.id,
    code: s.code,
    status: s.status,
    household: { id: s.household.id, number: s.household.number, head_name: s.household.headName },
    dues_type: { id: s.duesType.id, name: s.duesType.name },
    periods,
    total: s.unitAmount * periods.length + s.uniqueCode,
    bank_name: s.bankAccount?.bankName ?? null,
    payer_name: s.payerName,
    created_at: s.createdAt.toISOString(),
    reject_reason: s.rejectReason,
  };
}

/** Dipindah dari src/app/api/v1/admin/households/route.ts. */
export function ringkasRumah(h: {
  id: string;
  number: string;
  headName: string;
  phone: string | null;
  occupancyStatus: string | null;
  isActive: boolean;
  note: string | null;
}) {
  return {
    id: h.id,
    number: h.number,
    head_name: h.headName,
    phone: h.phone,
    occupancy_status: h.occupancyStatus,
    is_active: h.isActive,
    note: h.note,
  };
}

/** Dipindah dari src/app/api/v1/admin/dues-types/route.ts. */
export function ringkasJenisIuran(t: {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  startsOn: Date | null;
  dueOn: Date | null;
  isActive: boolean;
  description: string | null;
}) {
  return {
    id: t.id,
    name: t.name,
    amount: t.amount,
    frequency: t.frequency,
    starts_on: t.startsOn ? t.startsOn.toISOString().slice(0, 10) : null,
    due_on: t.dueOn ? t.dueOn.toISOString().slice(0, 10) : null,
    is_active: t.isActive,
    description: t.description,
  };
}

/** Dipindah dari src/app/api/v1/admin/users/route.ts. */
export function ringkasUser(u: { id: string; name: string; email: string; isActive: boolean; createdAt: Date }) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    is_active: u.isActive,
    created_at: u.createdAt.toISOString(),
  };
}

/** Dipindah dari src/app/api/v1/admin/expenses/route.ts. */
export function ringkasPengeluaran(e: {
  id: string;
  spentOn: Date;
  description: string;
  amount: number;
  recordedBy: { name: string } | null;
}) {
  return {
    id: e.id,
    spent_on: e.spentOn.toISOString().slice(0, 10),
    description: e.description,
    amount: e.amount,
    recorded_by: e.recordedBy?.name ?? null,
  };
}
