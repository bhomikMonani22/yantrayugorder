import { useEffect, useState, useCallback } from 'react';
import { listOrders, getOrderById, type OrderWithRetailer } from '../lib/data';
import { supabase } from '../lib/supabase';
import { StatusPill, Spinner, Card } from '../components/ui';
import { money, timeAgo } from '../config';
import { OrderDrawer } from './OrderDrawer';
import type { Order, OrderStatus } from '../lib/types';

type Tab = 'open' | 'closed' | 'all';
const OPEN_STATUSES: OrderStatus[] = ['placed', 'picking', 'packed', 'invoiced'];

export function Board() {
  const [orders, setOrders] = useState<OrderWithRetailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('open');
  const [selected, setSelected] = useState<OrderWithRetailer | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setOrders(await listOrders());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel('warehouse-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sj_orders' }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const full = await getOrderById((payload.new as Order).id);
          if (full) {
            setOrders((p) => [full, ...p.filter((o) => o.id !== full.id)]);
            setFlash(full.id);
            setTimeout(() => setFlash((f) => (f === full.id ? null : f)), 2500);
          }
        } else if (payload.eventType === 'UPDATE') {
          const upd = payload.new as Order;
          setOrders((p) => p.map((o) => (o.id === upd.id ? { ...o, ...upd } : o)));
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  const filtered = orders.filter((o) =>
    tab === 'all' ? true : tab === 'open' ? OPEN_STATUSES.includes(o.status) : o.status === 'closed',
  );
  const openCount = orders.filter((o) => OPEN_STATUSES.includes(o.status)).length;

  return (
    <div className="px-8 py-7">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Live orders</h1>
          <p className="text-sm text-inkSoft">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-mint" /> Real-time · {openCount} open
          </p>
        </div>
        <div className="flex gap-2">
          {(['open', 'closed', 'all'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`min-h-[40px] rounded-full px-5 text-sm font-semibold capitalize transition ${
                tab === t ? 'bg-charcoal text-white' : 'bg-white text-inkSoft shadow-soft'
              }`}>{t}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Card className="text-center text-inkSoft">No {tab} orders.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <button key={o.id} onClick={() => setSelected(o)}
              className={`rounded-card bg-white p-5 text-left shadow-soft transition hover:shadow-lift ${
                flash === o.id ? 'ring-2 ring-sunset2' : ''
              }`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-ink">{o.retailer?.shop_name ?? 'Retailer'}</p>
                <StatusPill status={o.status} />
              </div>
              <p className="mt-0.5 text-xs text-inkSoft">{o.retailer?.city ?? ''}</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="font-display text-2xl text-sunset">{money(o.total_value)}</span>
                <span className="text-xs text-inkSoft">{timeAgo(o.placed_at)}</span>
              </div>
              {o.invoice_no && <p className="mt-2 text-xs text-inkSoft">Inv {o.invoice_no}</p>}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <OrderDrawer
          order={orders.find((o) => o.id === selected.id) ?? selected}
          onClose={() => setSelected(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
