"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import QRCode from "qrcode";
import { kirimBukti } from "./actions";
import { rupiah, labelPeriode, namaBulan } from "@/lib/format";
import { qrisWithAmount, isValidQris } from "@/lib/qris";
import { Badge } from "@/components/ui";

type Household = { id: string; number: string; headName: string; uniqueCode: number };
type DuesType = { id: string; name: string; amount: number; frequency: string; startsOn: string | null };
type Account = { id: string; bankName: string; accountNumber: string | null; accountName: string | null; hasQrisImage: boolean; qrisPayload: string | null };
type History = { code: string; status: string; createdAt: string; duesName: string; periods: string[]; total: number };

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function FormBayar({
  households, types, accounts, rumahAktif, jenisAktif, tahun, tahunIni,
  paid, pending, history, householdName, typeName,
}: {
  households: Household[]; types: DuesType[]; accounts: Account[];
  rumahAktif: string; jenisAktif: string; tahun: number; tahunIni: number;
  paid: Record<string, boolean>; pending: string[];
  history: History[]; householdName: string; typeName: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [bulan, setBulan] = useState<string[]>([]);
  const [rekening, setRekening] = useState(accounts[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const type = types.find((t) => t.id === jenisAktif) ?? null;
  const bulanan = type?.frequency === "bulanan";
  const account = accounts.find((a) => a.id === rekening) ?? null;
  const dinamis = !!account?.qrisPayload && isValidQris(account.qrisPayload);
  const uniqueCode = dinamis && rumahAktif
    ? (households.find((h) => h.id === rumahAktif)?.uniqueCode ?? 0)
    : 0;
  const total = (type ? type.amount * (bulanan ? bulan.length : 1) : 0) + uniqueCode;

  const now = new Date();
  const ymNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startsYm = type?.startsOn ? type.startsOn.slice(0, 7) : null;

  const payloadQris = useMemo(() => {
    if (!account?.qrisPayload || !isValidQris(account.qrisPayload) || total <= 0) return null;
    return qrisWithAmount(account.qrisPayload, total);
  }, [account, total]);

  useEffect(() => {
    if (payloadQris && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, payloadQris, { width: 560, margin: 2, errorCorrectionLevel: "M" }).catch(() => {});
    }
  }, [payloadQris]);

  useEffect(() => {
    setBulan([]);
    setGalat(null);
  }, [rumahAktif, jenisAktif, tahun]);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const gantiQuery = (patch: Record<string, string>) => {
    const q = new URLSearchParams();
    if (patch.rumah || rumahAktif) q.set("rumah", patch.rumah ?? rumahAktif);
    if (patch.jenis || jenisAktif) q.set("jenis", patch.jenis ?? jenisAktif);
    q.set("tahun", String(patch.tahun ?? tahun));
    router.push(`/bayar?${q.toString()}`);
  };

  const toggleBulan = (p: string) => {
    setBulan((b) => (b.includes(p) ? b.filter((x) => x !== p) : [...b, p].sort()));
  };

  const bulanIni = `${tahunIni}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const pilihCepat = (mode: "ini" | "tunggakan" | "kosong") => {
    if (mode === "kosong") return setBulan([]);
    const list: string[] = [];
    for (let m = 1; m <= 12; m++) {
      const p = `${tahun}-${String(m).padStart(2, "0")}`;
      if (paid[p] || pending.includes(p)) continue;
      if (startsYm && p < startsYm) continue;
      if (mode === "ini" && p !== `${tahun}-${String(now.getMonth() + 1).padStart(2, "0")}`) continue;
      if (mode === "tunggakan" && p > ymNow) continue;
      list.push(p);
    }
    setBulan(list);
  };

  const salin = async (teks: string) => {
    try { await navigator.clipboard.writeText(teks); } catch { /* abaikan */ }
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGalat(null);
    const fd = new FormData(e.currentTarget);
    if (bulanan) { for (const b of bulan) fd.append("periods", b); }
    setMengirim(true);
    startTransition(async () => {
      const hasil = await kirimBukti(fd);
      setMengirim(false);
      if (hasil && !hasil.ok) {
        setGalat(hasil.galat);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const langkah = "flex items-center gap-3 mb-4";
  const nomorLangkah = "shrink-0 size-8 rounded-full bg-ink text-white text-sm font-extrabold flex items-center justify-center";

  return (
    <div className="grid lg:grid-cols-3 gap-6 mt-6">
      <form onSubmit={submit} className="lg:col-span-2 space-y-6">
        {galat && (
          <div className="rounded-2xl border border-terakota/30 bg-terakota-soft text-terakota px-4 py-3 text-sm font-semibold">
            {galat}
          </div>
        )}

        {/* Langkah 1 */}
        <section className="sheet p-5 sm:p-6">
          <div className={langkah}>
            <span className={nomorLangkah}>1</span>
            <h2 className="font-extrabold tracking-tight text-lg">Rumah &amp; Jenis Iuran</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="f-rumah">Rumah Warga</label>
              <select id="f-rumah" name="household_id" className="input" value={rumahAktif}
                onChange={(e) => gantiQuery({ rumah: e.target.value })} required>
                <option value="">— Pilih rumah —</option>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>{h.number} · {h.headName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="f-jenis">Jenis Iuran</label>
              <select id="f-jenis" name="dues_type_id" className="input" value={jenisAktif}
                onChange={(e) => gantiQuery({ jenis: e.target.value })} required>
                <option value="">— Pilih iuran —</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} · {rupiah(t.amount)}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Langkah 2 */}
        {type && bulanan && (
          <section className="sheet p-5 sm:p-6">
            <div className={langkah}>
              <span className={nomorLangkah}>2</span>
              <h2 className="font-extrabold tracking-tight text-lg">Bulan yang Dibayar</h2>
            </div>
            <div className="flex items-center justify-between mb-3">
              <button type="button" disabled={tahun <= tahunIni - 1} onClick={() => gantiQuery({ tahun: String(tahun - 1) })}
                className="btn btn-sm btn-quiet no-underline">← {tahun - 1}</button>
              <span className="font-extrabold text-lg">{tahun}</span>
              <button type="button" disabled={tahun >= tahunIni + 1} onClick={() => gantiQuery({ tahun: String(tahun + 1) })}
                className="btn btn-sm btn-quiet no-underline">{tahun + 1} →</button>
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              <button type="button" onClick={() => pilihCepat("ini")} className="btn btn-sm btn-quiet">Bulan ini saja</button>
              <button type="button" onClick={() => pilihCepat("tunggakan")} className="btn btn-sm btn-quiet">Semua yang belum sampai bulan ini</button>
              <button type="button" onClick={() => pilihCepat("kosong")} className="btn btn-sm btn-quiet">Kosongkan</button>
              <span className="ml-auto text-xs font-bold text-daun-dark self-center">
                Terpilih: {bulan.length} bulan · Total: {rupiah((type.amount * bulan.length) + uniqueCode)}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const p = `${tahun}-${String(m).padStart(2, "0")}`;
                const isPaid = !!paid[p];
                const isPending = pending.includes(p);
                const belumBerlaku = !!startsYm && p < startsYm;
                const isNow = p === `${tahunIni}-${String(now.getMonth() + 1).padStart(2, "0")}` && tahun === tahunIni;
                const bisa = !isPaid && !isPending && !belumBerlaku;
                const checked = bulan.includes(p);
                return (
                  <label key={m}
                    className={`relative rounded-xl border-2 px-2 py-2.5 text-center transition-all select-none ${
                      isPaid ? "border-daun/40 bg-daun-soft/70 cursor-not-allowed"
                      : isPending ? "border-dashed border-amber-400 bg-amber-50/70 cursor-not-allowed"
                      : belumBerlaku ? "border-dashed border-rule bg-slate-50 cursor-not-allowed opacity-60"
                      : checked ? "border-daun bg-emerald-50 cursor-pointer"
                      : "border-rule bg-white cursor-pointer hover:border-daun/50"
                    } ${isNow ? "ring-2 ring-daun/50" : ""}`}>
                    {bisa && (
                      <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleBulan(p)} />
                    )}
                    <span className="block text-xs font-bold">{namaBulan(m)}</span>
                    <span className={`block text-[11px] font-bold mt-0.5 ${isPaid ? "text-daun-dark" : isPending ? "text-amber-700" : "text-ink-subtle"}`}>
                      {isPaid ? "✓ Lunas" : isPending ? "Dicek" : belumBerlaku ? "–" : checked ? rupiah(type.amount) : "Pilih"}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* Langkah 3 */}
        {type && (
          <section className="sheet p-5 sm:p-6">
            <div className={langkah}>
              <span className={nomorLangkah}>{bulanan ? 3 : 2}</span>
              <h2 className="font-extrabold tracking-tight text-lg">Transfer ke Rekening Pengurus</h2>
            </div>

            <div className="rounded-2xl bg-ink text-white p-5 mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Jumlah yang ditransfer</p>
              <p className="text-3xl font-black mt-1">{rupiah(total)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {bulanan ? `${bulan.length} bulan × ${rupiah(type.amount)}` : `1 × ${rupiah(type.amount)}`}
                {uniqueCode > 0 && <span className="text-amber-300 font-bold"> + kode unik {uniqueCode}</span>}
              </p>
              {uniqueCode > 0 && (
                <p className="text-xs text-slate-300 mt-2">Kode unik {uniqueCode} membantu bendahara mengenali transfer dari rumah Anda.</p>
              )}
            </div>

            <div className="space-y-2.5">
              {accounts.map((a) => {
                const aktif = rekening === a.id;
                const punyaQris = a.hasQrisImage || (a.qrisPayload && isValidQris(a.qrisPayload));
                return (
                  <label key={a.id}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 cursor-pointer transition-all has-[:checked]:border-daun has-[:checked]:bg-emerald-50/60 ${aktif ? "" : "border-rule"}`}>
                    <input type="radio" name="bank_account_id" value={a.id} checked={aktif}
                      onChange={() => setRekening(a.id)} className="mt-1 size-5 accent-green-600" required />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold">{a.bankName}</span>
                        {punyaQris && <span className="badge badge-danger">QRIS</span>}
                      </div>
                      {a.accountNumber && (
                        <p className="font-mono text-sm font-bold mt-1 flex items-center gap-2">
                          {a.accountNumber}
                          <button type="button" onClick={(e) => { e.preventDefault(); salin(a.accountNumber!); }}
                            className="text-xs font-bold text-daun hover:underline">Salin</button>
                        </p>
                      )}
                      {a.accountName && <p className="text-xs text-ink-muted">a.n. {a.accountName}</p>}
                    </div>
                  </label>
                );
              })}
            </div>

            {account && (account.hasQrisImage || payloadQris) && (
              <div className="mt-5 rounded-2xl border border-rule bg-slate-50/60 p-5 text-center">
                <p className="font-extrabold mb-1">Scan QRIS {account.bankName}</p>
                {payloadQris ? (
                  <>
                    <canvas ref={canvasRef} className="mx-auto rounded-xl border border-rule bg-white max-w-[280px] w-full" />
                    <p className="text-sm font-bold mt-3">Nominal: {rupiah(total)} {uniqueCode > 0 && <span className="text-ink-subtle font-semibold">(termasuk kode unik)</span>}</p>
                    <a
                      href={canvasRef.current?.toDataURL("image/png") ?? "#"}
                      download={`qris-${rupiah(total).replace(/[^0-9]/g, "")}.png`}
                      onClick={(e) => {
                        const url = canvasRef.current?.toDataURL("image/png");
                        if (url) (e.target as HTMLAnchorElement).href = url;
                      }}
                      className="btn btn-sm btn-primary mt-3 no-underline"
                    >
                      Simpan gambar QRIS
                    </a>
                  </>
                ) : (
                  <>
                    <img src={`/api/gambar/qris/${account.id}`} alt={`QRIS ${account.bankName}`}
                      className="mx-auto rounded-xl border border-rule bg-white max-w-[280px] w-full" loading="lazy" />
                    <a href={`/api/gambar/qris/${account.id}`} download className="btn btn-sm btn-primary mt-3 no-underline">
                      Simpan gambar QRIS
                    </a>
                  </>
                )}
                <ol className="text-xs text-ink-muted text-left mt-4 space-y-1 list-decimal pl-5 max-w-sm mx-auto">
                  <li>Buka aplikasi e-wallet / m-banking Anda.</li>
                  <li>Pindai kode QR di atas.</li>
                  <li>Pastikan nominalnya {rupiah(total)}, lalu bayar.</li>
                </ol>
              </div>
            )}
          </section>
        )}

        {/* Langkah 4 */}
        {type && (
          <section className="sheet p-5 sm:p-6">
            <div className={langkah}>
              <span className={nomorLangkah}>{bulanan ? 4 : 3}</span>
              <h2 className="font-extrabold tracking-tight text-lg">Kirim Bukti Transfer</h2>
            </div>

            <label
              className={`block rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${file ? "border-daun bg-emerald-50/50" : "border-rule hover:border-daun/50 bg-slate-50/50"}`}
            >
              <input
                type="file" name="proof" accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only" required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {preview && file?.type !== "application/pdf" ? (
                <img src={preview} alt="Pratinjau bukti" className="mx-auto max-h-48 rounded-xl border border-rule" />
              ) : file ? (
                <p className="font-bold text-sm">📄 {file.name}</p>
              ) : (
                <>
                  <p className="text-3xl mb-2">📤</p>
                  <p className="font-bold">Ketuk untuk pilih foto bukti</p>
                  <p className="text-xs text-ink-muted mt-1">JPG / PNG / PDF · maksimal 5 MB</p>
                </>
              )}
            </label>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="field-label" htmlFor="f-nama">Nama Pengirim <span className="text-ink-subtle font-normal">(opsional)</span></label>
                <input id="f-nama" name="payer_name" className="input" placeholder="Nama yang tertera di bukti" />
              </div>
              <div>
                <label className="field-label" htmlFor="f-wa">No. WhatsApp <span className="text-ink-subtle font-normal">(opsional)</span></label>
                <input id="f-wa" name="phone" className="input" placeholder="08…" inputMode="tel" />
              </div>
            </div>
            <div className="mt-4">
              <label className="field-label" htmlFor="f-catatan">Catatan <span className="text-ink-subtle font-normal">(opsional)</span></label>
              <textarea id="f-catatan" name="note" className="input min-h-20" placeholder="Keterangan tambahan bila ada…" />
            </div>

            <button type="submit" disabled={mengirim || (bulanan && bulan.length === 0)} className="btn btn-primary w-full mt-5 text-base">
              {mengirim ? "Mengirim…" : "Kirim Bukti Pembayaran"}
            </button>
            <p className="field-hint text-center mt-2">Iuran tercatat lunas setelah pengurus mengecek bukti Anda.</p>
          </section>
        )}
      </form>

      {/* Sidebar */}
      <aside className="space-y-4">
        {householdName && (
          <div className="sheet p-5">
            <h3 className="font-extrabold tracking-tight mb-1">Kiriman {householdName.split("·")[0].trim()}</h3>
            <div className="space-y-2.5 mt-3">
              {history.map((h) => (
                <a key={h.code} href={`/bayar/cek/${h.code}`} className="block rounded-xl border border-rule p-3 no-underline hover:border-daun/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold">{h.code}</span>
                    {h.status === "menunggu" && <Badge variant="warning">Dicek</Badge>}
                    {h.status === "disetujui" && <Badge variant="success">✓ Diterima</Badge>}
                    {h.status === "ditolak" && <Badge variant="danger">Ditolak</Badge>}
                  </div>
                  <p className="text-xs text-ink-muted mt-1">
                    {h.duesName} · {h.periods.map(labelPeriode).join(", ")} · {rupiah(h.total)}
                  </p>
                </a>
              ))}
              {history.length === 0 && <p className="text-sm text-ink-muted">Belum ada kiriman dari rumah ini.</p>}
            </div>
          </div>
        )}
        <div className="sheet p-5">
          <h3 className="font-extrabold tracking-tight mb-3">Cara kerjanya</h3>
          <ol className="space-y-3 text-sm">
            {[
              "Pilih rumah, jenis iuran, dan bulan yang dibayar.",
              "Transfer tepat sesuai nominal (termasuk kode unik bila ada) ke rekening pengurus.",
              "Kirim foto bukti transfer — pengurus akan mengecek dan mencatatnya lunas.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 size-6 rounded-full bg-ink text-white text-xs font-extrabold flex items-center justify-center">{i + 1}</span>
                <span className="text-ink-muted">{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
