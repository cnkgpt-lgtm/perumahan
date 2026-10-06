"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function FormMasuk({ callbackUrl, galatAwal }: { callbackUrl: string; galatAwal: string | null }) {
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState(galatAwal);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSibuk(true);
    setGalat(null);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
      callbackUrl,
    });
    if (res?.error) {
      setGalat("Email atau kata sandi salah.");
      setSibuk(false);
    } else {
      window.location.href = res?.url ?? callbackUrl;
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {galat && (
        <div className="rounded-xl border border-terakota/30 bg-terakota-soft text-terakota px-4 py-3 text-sm font-semibold">
          {galat}
        </div>
      )}
      <div>
        <label className="field-label" htmlFor="email">Email Pengurus</label>
        <input id="email" name="email" type="email" required autoComplete="email"
          placeholder="email@rt-rw.id" className="input" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Kata Sandi</label>
        <input id="password" name="password" type="password" required autoComplete="current-password"
          placeholder="••••••••" className="input" />
      </div>
      <button type="submit" disabled={sibuk} className="btn btn-primary w-full">
        {sibuk ? "Memeriksa…" : "Masuk ke Panel Pengurus"}
      </button>
    </form>
  );
}
