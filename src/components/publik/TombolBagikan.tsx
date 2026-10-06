"use client";

import { useState } from "react";
import { WaIcon } from "@/components/ui";

export default function TombolBagikan({ waUrl, tautan }: { waUrl: string; tautan: string }) {
  const [tersalin, setTersalin] = useState(false);

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(tautan);
    } catch {
      const el = document.createElement("textarea");
      el.value = tautan;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setTersalin(true);
    setTimeout(() => setTersalin(false), 2000);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm no-underline">
        <WaIcon /> Bagikan ke WhatsApp
      </a>
      <button onClick={salin} className="btn btn-quiet btn-sm">
        {tersalin ? "✓ Tersalin!" : "Salin Tautan"}
      </button>
    </div>
  );
}
