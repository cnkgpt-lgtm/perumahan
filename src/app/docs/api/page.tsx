import type { Metadata } from "next";
import ScalarView from "./ScalarView";

export const metadata: Metadata = {
  title: "Dokumentasi API",
  description: "Dokumentasi interaktif REST API v1 SISTER — Sistem Informasi Cluster.",
};

export default function DocsApiPage() {
  return (
    <main className="min-h-screen bg-white">
      <ScalarView />
    </main>
  );
}
