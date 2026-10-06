"use client";

import Link from "next/link";
import { useState } from "react";
import { Stamp } from "@/components/ui";

export default function PopupModal({
  post,
}: {
  post: { id: string; title: string; slug: string; category: string; body: string; hasImage: boolean };
}) {
  const [tutup, setTutup] = useState(false);
  if (tutup) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={() => setTutup(true)}
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
    >
      <div
        className="sheet max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {post.hasImage ? (
          <Link href={`/kabar/${post.slug}`} className="block no-underline">
            <img
              src={`/api/gambar/popup/${post.id}`}
              alt={post.title}
              className="w-full max-h-[70vh] object-contain bg-slate-100"
            />
          </Link>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-danger">Pengumuman Penting</span>
              <Stamp kategori={post.category} />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">{post.title}</h2>
            <p className="text-sm text-ink-muted mt-2 line-clamp-4">
              {post.body.replace(/[#>*_`\-]/g, "").slice(0, 200)}…
            </p>
            <div className="flex gap-2 mt-5">
              <Link href={`/kabar/${post.slug}`} className="btn btn-primary btn-sm flex-1 no-underline">
                Baca Detail Lengkap
              </Link>
              <button onClick={() => setTutup(true)} className="btn btn-quiet btn-sm">
                Tutup
              </button>
            </div>
          </div>
        )}
        {post.hasImage && (
          <div className="p-3 flex justify-end border-t border-rule">
            <button onClick={() => setTutup(true)} className="btn btn-quiet btn-sm">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
