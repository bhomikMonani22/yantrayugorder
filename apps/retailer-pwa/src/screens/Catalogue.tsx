import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { searchParts } from '../lib/catalogue';
import { useBasket, useAuth, useToast } from '../lib/state';
import { BRANDS, money, type Brand } from '../config';
import { BrandBadge, EmptyState, Spinner } from '../components/ui';
import type { Part } from '../lib/types';

const PAGE = 60;

function PartRow({ part, onAdd }: { part: Part; onAdd: (p: Part) => void }) {
  return (
    <div className="flex min-h-[64px] items-center gap-3 rounded-card bg-white px-4 py-3 shadow-soft">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <BrandBadge brand={part.brand} />
          <span className="truncate font-mono text-sm font-semibold text-ink">{part.part_no}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-inkSoft">{part.description}</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">
          {money(part.mrp)} {part.moq > 1 && <span className="text-inkSoft">· MOQ {part.moq}</span>}
        </p>
      </div>
      <button
        onClick={() => onAdd(part)}
        aria-label={`Add ${part.part_no}`}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sunset text-2xl leading-none text-white shadow-sunset active:scale-90 transition"
      >+</button>
    </div>
  );
}

export function Catalogue() {
  const { add } = useBasket();
  const { profile } = useAuth();
  const { toast } = useToast();
  const loc = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState('');
  const [brand, setBrand] = useState<Brand | 'ALL'>('ALL');
  const [results, setResults] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    if (loc.pathname === '/search') searchRef.current?.focus();
  }, [loc.pathname]);

  // debounced server-side search; reqId guards against out-of-order responses
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      const rows = await searchParts(q, brand, PAGE);
      if (id === reqId.current) { setResults(rows); setLoading(false); }
    }, q ? 280 : 0);
    return () => clearTimeout(t);
  }, [q, brand]);

  const onAdd = useCallback((p: Part) => { add(p, p.moq); toast(`Added ${p.part_no}`); }, [add, toast]);

  return (
    <div className="screen pb-[120px]">
      <div className="sticky top-0 z-30 bg-bg/95 px-4 pb-3 pt-safe backdrop-blur">
        <div className="pt-2">
          <p className="font-display text-2xl text-ink">
            Hi, <span className="italic">{profile?.shop_name?.split(' ')[0] ?? 'there'}</span>
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 shadow-soft">
          <svg className="h-5 w-5 text-inkSoft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2" strokeLinecap="round"/></svg>
          <input
            ref={searchRef}
            className="h-12 flex-1 bg-transparent text-ink placeholder:text-inkSoft focus:outline-none"
            placeholder="Search part no. or name"
            value={q}
            autoCapitalize="characters"
            onChange={(e) => setQ(e.target.value)}
          />
          {q && <button className="text-inkSoft" onClick={() => setQ('')} aria-label="clear">✕</button>}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
          {(['ALL', ...BRANDS] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`min-h-[36px] shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                brand === b ? 'bg-charcoal text-white' : 'bg-white text-inkSoft shadow-soft'
              }`}
            >{b === 'ALL' ? 'All' : b}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 px-4 pt-3">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : results.length === 0 ? (
          <EmptyState icon="🔍" title="No parts found"
            sub={q ? 'Try a different search.' : `No ${brand !== 'ALL' ? brand + ' ' : ''}parts.`} />
        ) : (
          <>
            {results.map((p) => <PartRow key={p.id} part={p} onAdd={onAdd} />)}
            {results.length === PAGE && (
              <p className="px-2 pt-2 text-center text-xs text-inkSoft">
                Showing first {PAGE} matches — refine your search to narrow down.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
