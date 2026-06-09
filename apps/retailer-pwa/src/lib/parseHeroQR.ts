/**
 * parseHeroQR — parse a Hero MotoCorp part-box QR string.
 *
 * Format (fields separated by "/"):
 *   D / BATCH / UUID / PARTNO / QTY / PRICE / VER / PACK / CAT / R / R
 *
 * Example:
 *   D/FLKG0000741495/LCFGKCLFJZ64/45010KTP901S/000001/0000532.00/AAF/1/G/000/00
 *
 * Pure function, no I/O. Double-scan prevention (checking scan_log for the
 * uuid) is done by the caller against Supabase — this only parses + validates.
 */

export interface HeroQRData {
  marker: 'D';
  batch: string;
  uuid: string;        // unique per physical packet -> dedupe key
  partNo: string;
  qty: number;         // MOQ / pieces in this packet
  mrp: number;         // rupees, leading zeros stripped (0000532.00 -> 532)
  version: string;
  pack: string;
  category: string;    // "G" = genuine
  isGenuine: boolean;
  raw: string;
}

export type HeroQRResult =
  | { ok: true; data: HeroQRData }
  | { ok: false; error: string };

const MIN_FIELDS = 9;

export function parseHeroQR(raw: string): HeroQRResult {
  if (raw == null || typeof raw !== 'string') {
    return { ok: false, error: 'Not a valid Hero part QR' };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: 'Not a valid Hero part QR' };
  }

  const parts = trimmed.split('/');

  if (parts[0] !== 'D') {
    return { ok: false, error: 'Not a valid Hero part QR' };
  }
  if (parts.length < MIN_FIELDS) {
    return { ok: false, error: 'Not a valid Hero part QR' };
  }

  const uuid = parts[2]?.trim() ?? '';
  const partNo = parts[3]?.trim() ?? '';

  if (uuid.length === 0 || partNo.length === 0) {
    return { ok: false, error: 'Not a valid Hero part QR' };
  }

  const qty = parseInt(parts[4], 10);
  const mrp = parseFloat(parts[5]); // parseFloat handles leading zeros: "0000532.00" -> 532

  const category = (parts[8] ?? '').trim();

  return {
    ok: true,
    data: {
      marker: 'D',
      batch: parts[1]?.trim() ?? '',
      uuid,
      partNo,
      qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
      mrp: Number.isFinite(mrp) && mrp >= 0 ? mrp : 0,
      version: parts[6]?.trim() ?? '',
      pack: parts[7]?.trim() ?? '',
      category,
      isGenuine: category === 'G',
      raw: trimmed,
    },
  };
}
