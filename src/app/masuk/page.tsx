import Link from "next/link";
import FormMasuk from "./FormMasuk";

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="max-w-md mx-auto py-6">
      <div className="sheet p-6 sm:p-8">
        <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-daun to-emerald-700 flex items-center justify-center text-white shadow-xs mb-4">
          <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-center">Masuk Khusus Pengurus</h1>
        <p className="text-sm text-ink-muted text-center mt-2">
          Khusus pengurus yang bertugas mencatat iuran dan memasang kabar.{" "}
          <strong className="text-ink">Warga umum tidak perlu masuk.</strong>
        </p>
        <FormMasuk callbackUrl={sp.callbackUrl ?? "/admin"} galatAwal={sp.error ? "Email atau kata sandi salah." : null} />
        <Link href="/" className="block text-center text-sm font-bold mt-5">
          ← Kembali ke Halaman Utama Warga
        </Link>
      </div>
    </div>
  );
}
