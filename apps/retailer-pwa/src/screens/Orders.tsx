import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/state';
import { EmptyState, Spinner } from '../components/ui';
import { money } from '../config';
import type { Order, OrderStatus } from '../lib/types';

const STATUS_TINT: Record<OrderStatus, string> = {
  placed: 'bg-gold text-ink',
  picking: 'bg-sky text-ink',
  packed: 'bg-lavender text-ink',
  invoiced: 'bg-mint text-ink',
  closed: 'bg-mint text-ink',
  cancelled: 'bg-cpink text-ink',
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Placed', picking: 'Picking', packed: 'Packed',
  invoiced: 'Invoiced', closed: 'Completed', cancelled: 'Cancelled',
};
const STEPS: OrderStatus[] = ['placed', 'picking', 'packed', 'invoiced', 'closed'];

interface Item { id: string; part_no: string; description: string; qty: number; line_total: number }

function StatusBar({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') return null;
  const idx = STEPS.indexOf(status);
  return (
    <div className="mt-3 flex gap-1.5">
      {STEPS.map((s, i) => (
        <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-sunset2' : 'bg-ink/10'}`} />
      ))}
    </div>
  );
}

export function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Record<string, Item[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('sj_orders').select('*').order('placed_at', { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    if (!profile) return;
    const channel = supabase
      .channel('my-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sj_orders', filter: `retailer_id=eq.${profile.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setOrders((p) => [payload.new as Order, ...p]);
          else if (payload.eventType === 'UPDATE')
            setOrders((p) => p.map((o) => (o.id === (payload.new as Order).id ? (payload.new as Order) : o)));
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [profile, load]);

  const toggle = async (id: string) => {
    if (open === id) { setOpen(null); return; }
    setOpen(id);
    if (!items[id]) {
      const { data } = await supabase.from('sj_order_items').select('*').eq('order_id', id);
      setItems((p) => ({ ...p, [id]: (data as Item[]) ?? [] }));
    }
  };

  return (
    <div className="screen pb-[120px]">
      <div className="px-4 pt-safe"><p className="pt-2 font-display text-3xl text-ink">My orders</p></div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders yet" sub="Your placed orders show their live status here." />
      ) : (
        <div className="space-y-2.5 px-4 pt-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-card bg-white p-4 shadow-soft" onClick={() => toggle(o.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{money(o.total_value)}</p>
                  <p className="text-xs text-inkSoft">
                    {new Date(o.placed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TINT[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <StatusBar status={o.status} />
              {o.invoice_no && <p className="mt-2 text-xs text-inkSoft">Invoice: {o.invoice_no}</p>}

              {open === o.id && (
                <div className="mt-3 space-y-1.5 border-t border-ink/5 pt-3">
                  {(items[o.id] ?? []).map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-sm">
                      <span className="min-w-0 truncate">
                        <span className="font-mono font-semibold">{it.part_no}</span>
                        <span className="text-inkSoft"> ×{it.qty}</span>
                      </span>
                      <span className="shrink-0 text-inkSoft">{money(it.line_total)}</span>
                    </div>
                  ))}
                  {!items[o.id] && <div className="flex justify-center py-2"><Spinner /></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
