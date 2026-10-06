"use client";

export default function TombolCetak() {
  return (
    <button onClick={() => window.print()} className="btn btn-sm btn-primary text-xs font-bold flex items-center gap-1.5 shadow-xs">
      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect width="12" height="8" x="6" y="14" />
      </svg>
      Cetak / Simpan PDF
    </button>
  );
}
