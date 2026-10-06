// GET /api/v1/settings — pengaturan situs publik.
import { getSettings } from "@/lib/settings";
import { j } from "@/lib/api";

export async function GET() {
  const s = await getSettings();
  return j({
    site_name: s.site_name || "SISTER",
    site_tagline: s.site_tagline || "Sistem Informasi Cluster",
    address: s.address || "",
    treasurer_contact: s.treasurer_contact || "",
    payment_info: s.payment_info || "",
  });
}
