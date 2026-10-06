import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSettings } from "@/lib/settings";
import { Kicker } from "@/components/ui";
import FormPengaturan, { FormSandi } from "./FormPengaturan";

export default async function PengaturanPage() {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const settings = await getSettings();

  return (
    <div>
      <Kicker>Konfigurasi</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Pengaturan Lingkungan
      </h1>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <FormPengaturan awal={settings} />

        <div className="space-y-6">
          <FormSandi />

          <div className="sheet p-5 sm:p-6 border-daun/30 bg-daun-soft/40">
            <p className="font-bold text-daun-dark">🌐 Informasi Publik Warga</p>
            <p className="text-sm text-ink-muted mt-2">
              Nama lingkungan, slogan, alamat, dan kontak bendahara tampil di web warga.
              Pastikan datanya selalu terbaru.
            </p>
            <Link href="/" target="_blank" rel="noopener" className="btn btn-primary btn-sm mt-4">
              Cek tampilan di Web Warga →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
