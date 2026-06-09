import { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
import { searchParts, upsertPart, importParts } from '../lib/data';
import { useAuth, useToast } from '../lib/auth';
import { Button, BrandBadge, Spinner, SectionLabel } from '../components/ui';
import { BRANDS, money, type Brand } from '../config';
import type { Part } from '../lib/types';

const SIZE = 50;
const blank = (): Partial<Part> => ({ part_no: '', description: '', brand: 'HERO', mrp: 0, moq: 1, bin_location: '' });

export function AdminCatalogue() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin';

  const [q, setQ] = useState('');
  const [brand, setBrand] = useState<Brand | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<Part> | null>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { rows, total } = await searchParts(q, brand, page, SIZE);
    setRows(rows); setTotal(total); setLoading(false);
  }, [q, brand, page]);

  useEffect(() => {
    const t = setTimeout(load, q ? 280 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  useEffect(() => { setPage(0); }, [q, brand]);

  const save = async () => {
    if (!edit || !profile) return;
    if (!edit.part_no?.trim()) return toast('Part number required', 'warn');
    const { error } = await upsertPart({
      ...edit,
      distributor_id: profile.distributor_id,
      part_no: edit.part_no!.trim(),
      brand: (edit.brand as Brand) ?? 'HERO',
      bin_location: edit.bin_location?.toString().trim() || null,
    } as any);
    if (error) return toast(error.message, 'error');
    toast('Saved');
    setEdit(null); void load();
  };

  const onCsv = (file: File) => {
    if (!profile) return;
    setImporting(true);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (res) => {
        const { inserted, skipped } = await importParts(res.data as any[], profile.distributor_id);
        setImporting(false);
        toast(`Imported ${inserted} parts${skipped ? `, skipped ${skipped}` : ''}`);
        void load();
      },
      error: () => { setImporting(false); toast('CSV parse failed', 'error'); },
    });
  };

  const pages = Math.ceil(total / SIZE);
  const input = 'w-full rounded-2xl border border-ink/10 bg-white px-4 py-2.5 focus:border-sunset2 focus:outline-none';

  return (
    <div className="px-8 py-7">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Catalogue</h1>
          <p className="text-sm text-inkSoft">{total.toLocaleString('en-IN')} parts</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <label className="inline-flex min-h-[40px] cursor-pointer items-center rounded-full bg-white px-5 text-sm font-semibold text-ink shadow-soft">
              {importing ? 'Importing…' : 'Import CSV'}
              <input type="file" accept=".csv" className="hidden" disabled={importing}
                onChange={(e) => e.target.files?.[0] && onCsv(e.target.files[0])} />
            </label>
            <Button onClick={() => setEdit(blank())}>+ Add part</Button>
          </div>
        )}
      </div>

      <div className="mb-4 flex gap-3">
        <input className={`${input} max-w-md`} placeholder="Search part no. or name"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={input.replace('w-full', 'w-40')} value={brand}
          onChange={(e) => setBrand(e.target.value as Brand | 'ALL')}>
          <option value="ALL">All brands</option>
          {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-card bg-white shadow-soft">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-left text-[11px] uppercase tracking-wide text-inkSoft">
                <th className="px-5 py-3">Part no.</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3 text-right">MRP</th>
                <th className="px-5 py-3">Bin</th>
                {isAdmin && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-bg/60">
                  <td className="px-5 py-3 font-mono font-semibold">{p.part_no}</td>
                  <td className="px-5 py-3 text-inkSoft">{p.description}</td>
                  <td className="px-5 py-3"><BrandBadge brand={p.brand} /></td>
                  <td className="px-5 py-3 text-right font-semibold">{money(p.mrp)}</td>
                  <td className="px-5 py-3 text-inkSoft">{p.bin_location ?? '—'}</td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      <button className="text-sm font-semibold text-sunset2" onClick={() => setEdit(p)}>Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button variant="soft" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-sm text-inkSoft">Page {page + 1} of {pages}</span>
          <Button variant="soft" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* add/edit modal */}
      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-charcoal2/40" onClick={() => setEdit(null)} />
          <div className="relative z-10 w-full max-w-md rounded-card bg-bg p-6 shadow-lift">
            <p className="mb-4 font-display text-2xl text-ink">{edit.id ? 'Edit part' : 'Add part'}</p>
            <div className="space-y-3">
              <div>
                <SectionLabel>Part number</SectionLabel>
                <input className={`${input} mt-1`} value={edit.part_no ?? ''} disabled={!!edit.id}
                  onChange={(e) => setEdit({ ...edit, part_no: e.target.value })} />
              </div>
              <div>
                <SectionLabel>Description</SectionLabel>
                <input className={`${input} mt-1`} value={edit.description ?? ''}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <SectionLabel>Brand</SectionLabel>
                  <select className={`${input} mt-1`} value={edit.brand ?? 'HERO'}
                    onChange={(e) => setEdit({ ...edit, brand: e.target.value as Brand })}>
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <SectionLabel>MRP</SectionLabel>
                  <input type="number" className={`${input} mt-1`} value={edit.mrp ?? 0}
                    onChange={(e) => setEdit({ ...edit, mrp: Number(e.target.value) })} />
                </div>
                <div>
                  <SectionLabel>MOQ</SectionLabel>
                  <input type="number" className={`${input} mt-1`} value={edit.moq ?? 1}
                    onChange={(e) => setEdit({ ...edit, moq: parseInt(e.target.value) || 1 })} />
                </div>
                <div>
                  <SectionLabel>Bin</SectionLabel>
                  <input className={`${input} mt-1`} value={edit.bin_location ?? ''}
                    onChange={(e) => setEdit({ ...edit, bin_location: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="soft" className="flex-1" onClick={() => setEdit(null)}>Cancel</Button>
              <Button className="flex-1" onClick={save}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
