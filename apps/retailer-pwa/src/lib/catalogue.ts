import { supabase } from './supabase';
import type { Part } from './types';
import type { Brand } from '../config';

// PostgREST .or() uses commas/parens as syntax — strip anything that could break it.
function sanitize(q: string) {
  return q.replace(/[,()*%]/g, ' ').trim();
}

/** Server-side catalogue search. Empty query returns a first page (browse). */
export async function searchParts(
  query: string,
  brand: Brand | 'ALL',
  limit = 60,
): Promise<Part[]> {
  let qb = supabase.from('sj_parts').select('*').eq('active', true);
  if (brand !== 'ALL') qb = qb.eq('brand', brand);
  const needle = sanitize(query);
  if (needle) qb = qb.or(`part_no.ilike.%${needle}%,description.ilike.%${needle}%`);
  qb = qb.order('part_no').limit(limit);
  const { data, error } = await qb;
  if (error) return [];
  return (data as Part[]) ?? [];
}

/** Single-part lookup by exact part number (used by the scanner). */
export async function getByPartNo(partNo: string): Promise<Part | null> {
  const { data } = await supabase
    .from('sj_parts')
    .select('*')
    .ilike('part_no', partNo.trim())
    .limit(1)
    .maybeSingle();
  return (data as Part) ?? null;
}
