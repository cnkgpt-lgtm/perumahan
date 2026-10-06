import { prisma } from "./db";

const DEFAULTS: Record<string, string> = {
  site_name: "SISTER",
  site_tagline: "Sistem Informasi Cluster",
  address: "",
  treasurer_contact: "",
  payment_info: "",
};

const cache = new Map<string, string>();

export async function getSetting(key: string): Promise<string> {
  if (cache.has(key)) return cache.get(key)!;
  const row = await prisma.setting.findUnique({ where: { key } });
  const val = row?.value ?? DEFAULTS[key] ?? "";
  cache.set(key, val);
  return val;
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const out: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) if (r.value != null) out[r.key] = r.value;
  return out;
}

export function invalidateSettingsCache() {
  cache.clear();
}

/** Normalisasi nomor HP ke format 62xxxxxxxxxx untuk wa.me */
export function cleanPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
}

export function waLink(phone: string | null | undefined, text: string): string {
  const clean = cleanPhone(phone);
  const base = clean ? `https://wa.me/${clean}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
