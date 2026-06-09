import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBasket, useAuth, useToast } from '../lib/state';
import { supabase } from '../lib/supabase';
import { Button, QtyStepper, BrandBadge, EmptyState } from '../components/ui';
import { money } from '../config';

export function Basket() {
  const { lines, setQty, remove, total, clear, count } = useBasket();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const placeOrder = async () => {
    if (!profile || lines.length === 0) return;
    setBusy(true);
    const { data: order, error } = await supabase
      .from('sj_orders')
      .insert({
        distributor_id: profile.distributor_id,
        retailer_id: profile.id,
        total_value: total,
        note: note.trim() || null,
      })
      .select()
      .single();

    if (error || !order) { toast(error?.message ?? 'Could not place order', 'error'); setBusy(false); return; }

    const items = lines.map((l) => ({
      order_id: order.id,
      // synthetic (scanned-but-not-in-catalogue) lines have no real part_id
      part_id: l.part.id.startsWith('qr:') ? null : l.part.id,
      part_no: l.part.part_no,
      description: l.part.description,
      brand: l.part.brand,
      qty: l.qty,
      mrp_at_order: l.part.mrp,
      line_total: l.qty * l.part.mrp,
    }));

    const { error: iErr } = await supabase.from('sj_order_items').insert(items);
    if (iErr) { toast(iErr.message, 'error'); setBusy(false); return; }

    clear();
    setBusy(false);
    toast('Order placed');
    navigate('/orders');
  };

  if (lines.length === 0) {
    return (
      <div className="screen pb-[120px]">
        <Header />
        <EmptyState icon="🧺" title="Your basket is empty" sub="Scan a part or search the catalogue." />
      </div>
    );
  }

  return (
    <div className="screen pb-[240px]">
      <Header />
      <div className="space-y-2.5 px-4 pt-3">
        {lines.map((l) => (
          <div key={l.part.id} className="rounded-card bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <BrandBadge brand={l.part.brand} />
                  <span className="truncate font-mono text-sm font-semibold">{l.part.part_no}</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-inkSoft">{l.part.description}</p>
              </div>
              <button className="text-inkSoft" onClick={() => remove(l.part.id)} aria-label="remove">✕</button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <QtyStepper value={l.qty} onChange={(v) => setQty(l.part.id, v)} />
              <span className="font-semibold text-ink">{money(l.qty * l.part.mrp)}</span>
            </div>
          </div>
        ))}

        <textarea
          className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-inkSoft focus:border-sunset2 focus:outline-none"
          rows={2} placeholder="Note for warehouse (optional)"
          value={note} onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* sticky checkout bar — thumb zone */}
      <div className="fixed inset-x-0 z-30 mx-auto max-w-md border-t border-ink/5 bg-bg/95 px-4 pb-3 pt-3 backdrop-blur" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm text-inkSoft">{count} item{count !== 1 ? 's' : ''}</span>
          <span className="font-display text-3xl text-sunset">{money(total)}</span>
        </div>
        <Button className="w-full" disabled={busy} onClick={placeOrder}>
          {busy ? 'Placing…' : 'Place order'}
        </Button>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="px-4 pt-safe">
      <p className="pt-2 font-display text-3xl text-ink">Basket</p>
    </div>
  );
}
