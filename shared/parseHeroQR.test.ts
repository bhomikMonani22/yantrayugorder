import { describe, it, expect } from 'vitest';
import { parseHeroQR } from './parseHeroQR';

describe('parseHeroQR', () => {
  it('parses the canonical example from the spec', () => {
    const r = parseHeroQR('D/FLKG0000741495/LCFGKCLFJZ64/45010KTP901S/000001/0000532.00/AAF/1/G/000/00');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.uuid).toBe('LCFGKCLFJZ64');
    expect(r.data.partNo).toBe('45010KTP901S');
    expect(r.data.qty).toBe(1);
    expect(r.data.mrp).toBe(532);
    expect(r.data.batch).toBe('FLKG0000741495');
    expect(r.data.category).toBe('G');
    expect(r.data.isGenuine).toBe(true);
  });

  it('strips leading zeros from price correctly', () => {
    const r = parseHeroQR('D/B1/UUID1/PART1/000012/0001250.50/AAF/1/G/000/00');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.mrp).toBe(1250.5);
    expect(r.data.qty).toBe(12);
  });

  it('flags non-genuine category', () => {
    const r = parseHeroQR('D/B1/UUID2/PART2/000001/0000100.00/AAF/1/X/000/00');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.isGenuine).toBe(false);
    expect(r.data.category).toBe('X');
  });

  it('rejects a code not starting with D', () => {
    const r = parseHeroQR('X/B1/UUID3/PART3/000001/0000100.00/AAF/1/G/000/00');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('Not a valid Hero part QR');
  });

  it('rejects a code with too few fields', () => {
    const r = parseHeroQR('D/B1/UUID4/PART4/000001');
    expect(r.ok).toBe(false);
  });

  it('rejects empty / null / non-string input', () => {
    expect(parseHeroQR('').ok).toBe(false);
    expect(parseHeroQR('   ').ok).toBe(false);
    // @ts-expect-error testing runtime guard
    expect(parseHeroQR(null).ok).toBe(false);
    // @ts-expect-error testing runtime guard
    expect(parseHeroQR(undefined).ok).toBe(false);
  });

  it('rejects when uuid or part_no is blank', () => {
    expect(parseHeroQR('D/B1//PART5/000001/0000100.00/AAF/1/G/000/00').ok).toBe(false);
    expect(parseHeroQR('D/B1/UUID6//000001/0000100.00/AAF/1/G/000/00').ok).toBe(false);
  });

  it('defaults qty to 1 when qty field is unparseable', () => {
    const r = parseHeroQR('D/B1/UUID7/PART7/XXX/0000100.00/AAF/1/G/000/00');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.qty).toBe(1);
  });

  it('trims surrounding whitespace / newlines from scanner input', () => {
    const r = parseHeroQR('\n  D/B1/UUID8/PART8/000003/0000300.00/AAF/1/G/000/00  \n');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.partNo).toBe('PART8');
    expect(r.data.qty).toBe(3);
  });
});
