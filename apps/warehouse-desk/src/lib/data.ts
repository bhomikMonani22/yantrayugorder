import { supabase } from './supabase';
import type { Order, OrderStatus, Part } from './types';
import type { Brand } from '../config';

export interface OrderWithRetailer extends Order {
  retailer: { shop_name: string | null; city: string | null; contact_name: string | null } | null;
}
export interface OrderItemRow {
  id: string;
  part_no: string;
  description: string;
  brand: string;
  qty: number;
  mrp_at_order: number;
  line_total: number;
  part: { bin_location: string | null } | null;
}

const RETAILER_JOIN = '*, retailer:sj_profiles(shop_name,city,contact_name)';

export async function listOrders(): Promise<OrderWithRetailer[]> {
  const { data } = await supabase
    .from('sj_orders')
    .select(RETAILER_JOIN)
    .order('placed_at', { ascending: false })
    .limit(200);
  return (data as OrderWithRetailer[]) ?? [];
}

export async function getOrderById(id: string): Promise<OrderWithRetailer | null> {
  const { data } = await supabase.from('sj_orders').select(RETAILER_JOIN).eq('id', id).maybeSingle();
  return (data as OrderWithRetailer) ?? null;
}

export async function getOrderItems(orderId: string): Promise<OrderItemRow[]> {
  const { data } = await supabase
    .from('sj_order_items')
    .select('*, part:sj_parts(bin_location)')
    .eq('order_id', orderId)
    .order('part_no');
  return (data as OrderItemRow[]) ?? [];
}

export async function setStatus(orderId: string, status: OrderStatus) {
  return supabase.from('sj_orders').update({ status }).eq('id', orderId);
}

/** Setting invoice_no fires the DB trigger that closes the order + stamps closed_at. */
export async function setInvoice(orderId: string, invoiceNo: string) {
  return supabase.from('sj_orders').update({ invoice_no: invoiceNo }).eq('id', orderId);
}

export interface DashStats { todayCount: number; todayValue: number; open: number; closed: number }

export async function dashboardStats(): Promise<DashStats> {
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
  const iso = midnight.toISOString();

  const todayRes = await supabase
    .from('sj_orders').select('total_value', { count: 'exact' }).gte('placed_at', iso);
  const todayCount = todayRes.count ?? 0;
  const todayValue = (todayRes.data ?? []).reduce((s, r: any) => s + Number(r.total_value || 0), 0);

  const open = (await supabase.from('sj_orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['placed', 'picking', 'packed', 'invoiced'])).count ?? 0;
  const closed = (await supabase.from('sj_orders')
    .select('id', { count: 'exact', head: true }).eq('status', 'closed')).count ?? 0;

  return { todayCount, todayValue, open, closed };
}

// ── Admin catalogue ─────────────────────────────────────────────────
function sanitize(q: string) { return q.replace(/[,()*%]/g, ' ').trim(); }

export async function searchParts(query: string, brand: Brand | 'ALL', page = 0, size = 50) {
  let qb = supabase.from('sj_parts').select('*', { count: 'exact' });
  if (brand !== 'ALL') qb = qb.eq('brand', brand);
  const needle = sanitize(query);
  if (needle) qb = qb.or(`part_no.ilike.%${needle}%,description.ilike.%${needle}%`);
  qb = qb.order('part_no').range(page * size, page * size + size - 1);
  const { data, count } = await qb;
  return { rows: (data as Part[]) ?? [], total: count ?? 0 };
}

export async function upsertPart(p: Partial<Part> & { distributor_id: string; part_no: string; brand: Brand }) {
  return supabase.from('sj_parts').upsert(p, { onConflict: 'distributor_id,part_no' });
}

export async function importParts(rows: any[], distributorId: string) {
  const clean = rows
    .map((r) => ({
      distributor_id: distributorId,
      part_no: String(r.part_no ?? r.PART_NO ?? '').trim(),
      description: String(r.description ?? r.DESCRIPTION ?? '').trim(),
      brand: String(r.brand ?? r.BRAND ?? 'HERO').trim().toUpperCase(),
      mrp: Number(r.mrp ?? r.MRP ?? 0) || 0,
      moq: parseInt(String(r.moq ?? r.MOQ ?? '1'), 10) || 1,
      bin_location: (r.bin_location ?? r.BIN_LOCATION ?? '').toString().trim() || null,
    }))
    .filter((r) => r.part_no && ['HERO', 'HONDA', 'SUZUKI', 'TVS'].includes(r.brand));

  let inserted = 0;
  for (let i = 0; i < clean.length; i += 500) {
    const batch = clean.slice(i, i + 500);
    const { error } = await supabase.from('sj_parts').upsert(batch, { onConflict: 'distributor_id,part_no' });
    if (!error) inserted += batch.length;
  }
  return { inserted, skipped: rows.length - clean.length };
}
