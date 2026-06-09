export const BRANDS = ['HERO', 'HONDA', 'SUZUKI', 'TVS'] as const;
export type Brand = (typeof BRANDS)[number];

export const CONFIG = {
  businessName: 'Yantrayug Hero Hub',
  shortName: 'Yantrayug',
  tagline: 'Warehouse Desk',
  developedBy: 'Developed by Shreenathji Enterprises',
  brands: BRANDS,
  currency: '₹',
  brandTint: {
    HERO: 'bg-gold', HONDA: 'bg-sky', SUZUKI: 'bg-mint', TVS: 'bg-cpink',
  } as Record<Brand, string>,
} as const;

export const money = (n: number) =>
  CONFIG.currency + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
