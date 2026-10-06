import type { Metadata } from "next";
import { Bitter, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const bitter = Bitter({
  subsets: ["latin"],
  variable: "--font-bitter",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans-3",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SISTER — Sistem Informasi Cluster",
    template: "%s · SISTER",
  },
  description: "Kabar, kegiatan, dan catatan iuran warga cluster.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`h-full ${bitter.variable} ${sourceSans.variable}`}>
      <body className="min-h-full flex flex-col bg-paper text-ink antialiased selection:bg-daun-soft selection:text-daun-dark">
        {children}
      </body>
    </html>
  );
}
