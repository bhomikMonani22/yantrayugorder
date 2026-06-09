import { type ReactNode, type ButtonHTMLAttributes, useEffect } from 'react';
import type { Brand } from '../config';
import { CONFIG } from '../config';

// ── Button (pill, 44px min) ─────────────────────────────────────────
type Variant = 'sunset' | 'charcoal' | 'ghost' | 'soft';
export function Button({
  variant = 'sunset', className = '', children, ...rest
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold ' +
    'min-h-[44px] px-6 transition active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100';
  const styles: Record<Variant, string> = {
    sunset: 'bg-sunset text-white shadow-sunset',
    charcoal: 'bg-charcoal text-white shadow-soft',
    ghost: 'bg-transparent text-ink border border-ink/10',
    soft: 'bg-white text-ink shadow-soft',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

// ── Brand badge ─────────────────────────────────────────────────────
export function BrandBadge({ brand }: { brand: Brand }) {
  return (
    <span className={`inline-block rounded-full ${CONFIG.brandTint[brand]} px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-ink/80`}>
      {brand}
    </span>
  );
}

// ── Qty stepper (44px targets, wide gap) ────────────────────────────
export function QtyStepper({
  value, onChange, min = 1,
}: { value: number; onChange: (v: number) => void; min?: number }) {
  const btn =
    'h-11 w-11 flex items-center justify-center rounded-full bg-white shadow-soft ' +
    'text-2xl leading-none text-ink active:scale-90 transition select-none';
  return (
    <div className="flex items-center gap-3">
      <button className={btn} aria-label="decrease" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="min-w-[2ch] text-center text-lg font-semibold tabular-nums">{value}</span>
      <button className={btn} aria-label="increase" onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

// ── Bottom sheet (slide up, safe-area, backdrop) ────────────────────
export function BottomSheet({
  open, onClose, children, full = false,
}: { open: boolean; onClose: () => void; children: ReactNode; full?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end animate-fade">
      <div className="absolute inset-0 bg-charcoal2/40" onClick={onClose} />
      <div
        className={`relative z-10 animate-sheetUp rounded-t-[28px] bg-bg pb-safe ${full ? 'h-[92dvh]' : 'max-h-[88dvh]'}`}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-ink/15" />
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Misc ────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/15 border-t-sunset2" />
  );
}

export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="font-display text-xl text-ink">{title}</p>
      {sub && <p className="text-sm text-inkSoft">{sub}</p>}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-inkSoft">{children}</p>
  );
}
