import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import type { Brand } from '../config';
import { CONFIG } from '../config';
import type { OrderStatus } from '../lib/types';

type Variant = 'sunset' | 'charcoal' | 'ghost' | 'soft';
export function Button({
  variant = 'sunset', className = '', children, ...rest
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold min-h-[40px] px-5 ' +
    'transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100';
  const styles: Record<Variant, string> = {
    sunset: 'bg-sunset text-white shadow-sunset',
    charcoal: 'bg-charcoal text-white shadow-soft',
    ghost: 'bg-transparent text-ink border border-ink/15',
    soft: 'bg-white text-ink shadow-soft',
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...rest}>{children}</button>;
}

export function BrandBadge({ brand }: { brand: Brand | string }) {
  const tint = CONFIG.brandTint[brand as Brand] ?? 'bg-ink/10';
  return (
    <span className={`inline-block rounded-full ${tint} px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-ink/80`}>
      {brand}
    </span>
  );
}

export const STATUS_TINT: Record<OrderStatus, string> = {
  placed: 'bg-gold text-ink',
  picking: 'bg-sky text-ink',
  packed: 'bg-lavender text-ink',
  invoiced: 'bg-mint text-ink',
  closed: 'bg-mint text-ink',
  cancelled: 'bg-cpink text-ink',
};
export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Placed', picking: 'Picking', packed: 'Packed',
  invoiced: 'Invoiced', closed: 'Closed', cancelled: 'Cancelled',
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TINT[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Spinner() {
  return <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/15 border-t-sunset2" />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card bg-white p-5 shadow-soft ${className}`}>{children}</div>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-inkSoft">{children}</p>;
}
