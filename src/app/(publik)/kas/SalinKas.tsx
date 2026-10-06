"use client";

import { useState } from "react";
import { WaIcon } from "@/components/ui";

export default function SalinKas({ teks }: { teks: string }) {
  const [tersalin, setTersalin] = useState(false);
  const salin = async () => {
    try {
      await navigator.clipboard.writeText(teks);
    } catch {
      const el = document.createElement("textarea");
      el.value = teks;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setTersalin(true);
    setTimeout(() => setTersalin(false), 2000);
  };
  return (
    <button onClick={salin} className="btn btn-primary btn-sm">
      <WaIcon /> {tersalin ? "✓ Tersalin!" : "Salin Format WA"}
    </button>
  );
}
