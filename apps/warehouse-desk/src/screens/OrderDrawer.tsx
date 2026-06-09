import { useEffect, useState } from 'react';
import { getOrderItems, setStatus, setInvoice, type OrderWithRetailer, type OrderItemRow } from '../lib/data';
import { Button, StatusPill, Spinner, SectionLabel, BrandBadge } from '../components/ui';
import { money } from '../config';
import { useToast } from '../lib/auth';
import type { OrderStatus } from '../lib/types';

export function OrderDrawer({
  order, onClose, onChanged,
}: { order: OrderWithRetailer; onClose: () => void; onChanged: () => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoiceNo] = useState(order.invoice_no ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    getOrderItems(order.id).then((rows) => { setItems(rows); setLoading(false); });
  }, [order.id]);

  const advance = async (status: OrderStatus) => {
    setBusy(true);
    const { error } = await setStatus(order.id, status);
    setBusy(false);
    if (error) return toast(error.message, 'error');
    toast(`Marked ${status}`);
    onChanged();
  };

  const close = async () => {
    if (!invoice.trim()) return toast('Enter an invoice number', 'warn');
    setBusy(true);
    const { error } = await setInvoice(order.id, invoice.trim());
    setBusy(false);
    if (error) return toast(error.message, 'error');
    toast('Order invoiced & closed');
    onChanged();
    onClose();
  };

  const allPicked = items.length > 0 && items.every((it) => picked[it.id]);
  const isClosed = order.status === 'closed' || order.status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-charcoal2/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-bg shadow-lift">
        {/* header */}
        <div className="flex items-start justify-between border-b border-ink/5 px-7 py-5">
          <div>
            <div className="flex items-center gap-3">
              <p className="font-display text-2xl text-ink">{order.retailer?.shop_name ?? 'Retailer'}</p>
              <StatusPill status={order.status} />
            </div>
            <p className="text-sm text-inkSoft">
              {order.retailer?.city} · {new Date(order.placed_at).toLocaleString('en-IN')}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl text-inkSoft" aria-label="close">✕</button>
        </div>

        {/* pick list */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Pick list</SectionLabel>
            <span className="text-xs text-inkSoft">{items.length} lines</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <label key={it.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 shadow-soft transition ${picked[it.id] ? 'opacity-60' : ''}`}>
                  <input type="checkbox" className="h-5 w-5 accent-[#FF5E7E]"
                    checked={!!picked[it.id]}
                    onChange={(e) => setPicked((p) => ({ ...p, [it.id]: e.target.checked }))} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <BrandBadge brand={it.brand} />
                      <span className="font-mono text-sm font-semibold">{it.part_no}</span>
                    </div>
                    <p className={`truncate text-sm text-inkSoft ${picked[it.id] ? 'line-through' : ''}`}>{it.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-lg bg-mint/60 px-2 py-0.5 text-xs font-semibold">
                      BIN {it.part?.bin_location ?? '—'}
                    </span>
                    <p className="mt-1 text-sm font-semibold">×{it.qty}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* footer: status flow + invoice closer */}
        <div className="border-t border-ink/5 bg-white px-7 py-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-inkSoft">Order total</span>
            <span className="font-display text-2xl text-sunset">{money(order.total_value)}</span>
          </div>

          {!isClosed && (
            <>
              <div className="mb-4 flex gap-2">
                <Button variant="soft" className="flex-1" disabled={busy || order.status !== 'placed'}
                  onClick={() => advance('picking')}>Start picking</Button>
                <Button variant="soft" className="flex-1" disabled={busy || !allPicked}
                  onClick={() => advance('packed')}>
                  {allPicked ? 'Mark packed' : 'Pack (check all)'}
                </Button>
              </div>
              <SectionLabel>Close with invoice</SectionLabel>
              <div className="mt-2 flex gap-2">
                <input
                  className="h-11 flex-1 rounded-full border border-ink/10 bg-white px-4 focus:border-sunset2 focus:outline-none"
                  placeholder="Invoice number (e.g. INV-2026-0042)"
                  value={invoice} onChange={(e) => setInvoiceNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && close()} />
                <Button className="px-6" disabled={busy} onClick={close}>Invoice & close</Button>
              </div>
              <p className="mt-2 text-xs text-inkSoft">Entering an invoice closes the order automatically.</p>
            </>
          )}
          {isClosed && order.invoice_no && (
            <p className="text-sm text-ink">Closed · Invoice <strong>{order.invoice_no}</strong></p>
          )}
        </div>
      </div>
    </div>
  );
}
