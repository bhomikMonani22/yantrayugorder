// ── White-label config ──────────────────────────────────────────────
// Re-deploying for another distributor = edit THIS file + the matching
// `distributors` row in Supabase. Nothing else is brand-specific.

export const BRANDS = ['HERO', 'HONDA', 'SUZUKI', 'TVS'] as const;
export type Brand = (typeof BRANDS)[number];

export const CONFIG = {
  businessName: 'Shrinath Ji Enterprises',
  shortName: 'Shrinath Ji',
  tagline: 'Retailer Ordering Platform',
  brands: BRANDS,
  currency: '₹',
  // brand chip tints (Soft Tech functional pastels)
  brandTint: {
    HERO: 'bg-gold',
    HONDA: 'bg-sky',
    SUZUKI: 'bg-mint',
    TVS: 'bg-cpink',
  } as Record<Brand, string>,
} as const;

export const money = (n: number) =>
  CONFIG.currency + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
