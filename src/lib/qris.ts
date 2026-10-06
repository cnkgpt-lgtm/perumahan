// Port dari App\Support\Qris (PHP) — manipulasi payload QRIS (EMVCo).

type Tag = [string, string];

export function parseQris(payload: string): Tag[] | null {
  const tags: Tag[] = [];
  let offset = 0;
  while (offset < payload.length) {
    const id = payload.slice(offset, offset + 2);
    const size = payload.slice(offset + 2, offset + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(size)) return null;
    const len = parseInt(size, 10);
    if (offset + 4 + len > payload.length) return null;
    tags.push([id, payload.slice(offset + 4, offset + 4 + len)]);
    offset += 4 + len;
  }
  return tags;
}

export function crc16(data: string): string {
  let crc = 0xffff;
  for (const ch of data) {
    crc ^= ch.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tag(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

export function qrisValue(payload: string, id: string): string | null {
  for (const [t, v] of parseQris(payload) ?? []) if (t === id) return v;
  return null;
}

export function isValidQris(payload: string): boolean {
  const tags = parseQris(payload);
  if (!tags || tags.length === 0) return false;
  if (tags[0][0] !== "00" || tags[0][1] !== "01") return false;
  const last = tags[tags.length - 1];
  if (last[0] !== "63") return false;
  return last[1].toUpperCase() === crc16(payload.slice(0, -4));
}

export function isStaticQris(payload: string): boolean {
  return isValidQris(payload) && qrisValue(payload, "01") !== "12";
}

/** Ubah QRIS statis menjadi dinamis dengan nominal persis. */
export function qrisWithAmount(payload: string, amount: number): string {
  const tags = (parseQris(payload) ?? []).filter(
    (t) => !["54", "55", "56", "57", "63"].includes(t[0]),
  );
  let result = "";
  let amountAdded = false;
  for (const [id, value] of tags) {
    const v = id === "01" ? "12" : value;
    if (!amountAdded && parseInt(id, 10) > 54) {
      result += tag("54", String(amount));
      amountAdded = true;
    }
    result += tag(id, v);
  }
  if (!amountAdded) result += tag("54", String(amount));
  result += "6304";
  return result + crc16(result);
}
