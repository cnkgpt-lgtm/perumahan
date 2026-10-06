import { describe, expect, it } from "vitest";
import { terbilang, rupiah, nomorKuitansi, labelPeriode } from "@/lib/format";
import { uniqueCodeFor } from "@/lib/ledger";
import { crc16, isValidQris, qrisWithAmount, qrisValue, parseQris } from "@/lib/qris";

describe("format", () => {
  it("terbilang angka bulat", () => {
    expect(terbilang(50000)).toBe("lima puluh ribu");
    expect(terbilang(150000)).toBe("seratus lima puluh ribu");
    expect(terbilang(0)).toBe("nol");
  });
  it("rupiah memakai titik ribuan", () => {
    expect(rupiah(150000)).toBe("Rp150.000");
  });
  it("nomor kuitansi SIST-YYYYMM-XXXX", () => {
    expect(nomorKuitansi(new Date("2026-10-06"), 7)).toBe("SIST-202610-0007");
  });
  it("label periode bulanan & sekali bayar", () => {
    expect(labelPeriode("2026-10")).toBe("Oktober 2026");
    expect(labelPeriode("")).toBe("Sekali bayar");
  });
  it("kode unik deterministik dari id", () => {
    const a = uniqueCodeFor("abc123");
    expect(a).toBeGreaterThanOrEqual(1);
    expect(a).toBeLessThanOrEqual(999);
    expect(uniqueCodeFor("abc123")).toBe(a);
  });
});

describe("qris", () => {
  it("crc16 sesuai vektor uji CCITT-FALSE", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
  it("parseQris menolak payload rusak", () => {
    expect(parseQris("ZZZZ")).toBeNull();
    expect(isValidQris("000201010211")).toBe(false);
  });
  it("qrisWithAmount menghasilkan payload dinamis valid", () => {
    const inti = "0002010102116304";
    const statis = inti + crc16(inti);
    expect(isValidQris(statis)).toBe(true);
    const dinamis = qrisWithAmount(statis, 50007);
    expect(isValidQris(dinamis)).toBe(true);
    expect(qrisValue(dinamis, "01")).toBe("12");
    expect(qrisValue(dinamis, "54")).toBe("50007");
  });
});
