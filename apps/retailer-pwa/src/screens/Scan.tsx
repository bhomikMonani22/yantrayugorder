import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { parseHeroQR, type HeroQRData } from '../lib/parseHeroQR';
import { getByPartNo } from '../lib/catalogue';
import { useBasket, useAuth, useToast } from '../lib/state';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui';
import { money } from '../config';
import type { Part } from '../lib/types';

type Phase = 'scanning' | 'result' | 'error' | 'denied';
interface ScanResult {
  data: HeroQRData;
  part: Part | null;     // matched catalogue part, or null if unknown
  alreadyScanned: boolean;
}

export function Scan({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const busyRef = useRef(false);

  const { add } = useBasket();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('scanning');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errMsg, setErrMsg] = useState('');
  const [manual, setManual] = useState('');
  const [manualOpen, setManualOpen] = useState(false);

  // ── camera lifecycle (sheet only mounts after the FAB tap = user gesture) ──
  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const scanner = new QrScanner(
        videoRef.current,
        (r) => void handleRaw(r.data),
        { preferredCamera: 'environment', highlightScanRegion: true, returnDetailedScanResult: true },
      );
      scannerRef.current = scanner;
      await scanner.start();
    } catch {
      setPhase('denied');
    }
  };

  useEffect(() => {
    void startCamera();
    return () => { scannerRef.current?.stop(); scannerRef.current?.destroy(); scannerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── core: parse → dedup → match → add ──
  const handleRaw = async (raw: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    scannerRef.current?.stop();

    const parsed = parseHeroQR(raw);
    if (!parsed.ok) {
      setErrMsg('Not a valid Hero part QR.');
      setPhase('error');
      return;
    }
    const d = parsed.data;

    // Double-scan prevention: the unique constraint on scan_log.scanned_uuid
    // is the source of truth (works across retailers, beyond RLS visibility).
    let alreadyScanned = false;
    const { error } = await supabase.from('sj_scan_log').insert({
      scanned_uuid: d.uuid,
      part_no: d.partNo,
      retailer_id: profile?.id ?? null,
    });
    if (error && error.code === '23505') alreadyScanned = true;

    const part = (await getByPartNo(d.partNo)) ?? null;
    setResult({ data: d, part, alreadyScanned });
    setPhase('result');

    if (!alreadyScanned) {
      const line: Part = part ?? syntheticPart(d);
      add(line, d.qty);
    }
  };

  const syntheticPart = (d: HeroQRData): Part => ({
    id: `qr:${d.partNo}`,
    distributor_id: '',
    part_no: d.partNo,
    description: 'Scanned — not in catalogue',
    brand: 'HERO',
    mrp: d.mrp,
    moq: d.qty,
    bin_location: null,
    active: true,
  });

  const scanNext = () => {
    busyRef.current = false;
    setResult(null);
    setErrMsg('');
    setPhase('scanning');
    void scannerRef.current?.start().catch(() => setPhase('denied'));
  };

  const submitManual = async () => {
    const v = manual.trim();
    if (!v) return;
    if (v.startsWith('D/') || (v[0] === 'D' && v.includes('/'))) {
      busyRef.current = false;
      void handleRaw(v);
      return;
    }
    const part = await getByPartNo(v);
    if (part) { add(part, part.moq); toast(`Added ${part.part_no}`); setManual(''); setManualOpen(false); }
    else toast('Part not found in catalogue', 'warn');
  };

  return (
    <div className="flex h-full flex-col px-5 pt-2">
      <div className="flex items-center justify-between py-2">
        <p className="font-display text-2xl text-ink">Scan part</p>
        <button onClick={onClose} className="h-11 w-11 text-2xl text-inkSoft" aria-label="close">✕</button>
      </div>

      {/* camera viewport */}
      {phase !== 'denied' && (
        <div className={`relative overflow-hidden rounded-card bg-charcoal2 ${phase === 'result' || phase === 'error' ? 'hidden' : ''}`}
             style={{ aspectRatio: '3 / 4' }}>
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-44 w-44 rounded-3xl border-2 border-white/80 shadow-[0_0_0_2000px_rgba(26,25,24,0.45)]" />
          </div>
          <p className="absolute inset-x-0 bottom-4 text-center text-sm text-white/85">
            Point at the Hero QR on the box
          </p>
        </div>
      )}

      {/* permission denied → manual only */}
      {phase === 'denied' && (
        <div className="rounded-card bg-cpink/50 p-5 text-center text-sm text-ink">
          Camera unavailable or blocked. Enter the part number manually below.
        </div>
      )}

      {/* invalid QR */}
      {phase === 'error' && (
        <div className="flex flex-col items-center gap-3 rounded-card bg-white p-6 text-center shadow-soft">
          <div className="text-4xl">⚠️</div>
          <p className="font-display text-xl text-ink">{errMsg}</p>
          <p className="text-sm text-inkSoft">Only Hero parts carry this QR. Use search for other brands.</p>
          <Button className="mt-2 w-full" onClick={scanNext}>Try again</Button>
        </div>
      )}

      {/* success / dedup result */}
      {phase === 'result' && result && (
        <div className="flex flex-col items-center gap-2 rounded-card bg-white p-6 text-center shadow-soft">
          <div className="animate-pop text-5xl">{result.alreadyScanned ? '🔁' : '✅'}</div>
          <p className="font-display text-xl text-ink">
            {result.alreadyScanned ? 'Already scanned' : 'Added to basket'}
          </p>
          {result.alreadyScanned && (
            <p className="text-sm text-inkSoft">This packet was scanned before — not added again.</p>
          )}
          <div className="mt-2 w-full rounded-2xl bg-bg p-4 text-left">
            <p className="font-mono text-sm font-semibold text-ink">{result.data.partNo}</p>
            <p className="text-sm text-inkSoft">
              {result.part ? result.part.description : 'Not in catalogue'}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {money(result.data.mrp)} · qty {result.data.qty}
              {result.data.isGenuine && <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-[11px]">Genuine</span>}
            </p>
          </div>
          <div className="mt-3 flex w-full gap-3">
            <Button variant="soft" className="flex-1" onClick={onClose}>Done</Button>
            <Button className="flex-1" onClick={scanNext}>Scan next</Button>
          </div>
        </div>
      )}

      {/* manual fallback — always available (primary path for non-Hero brands) */}
      <div className="mt-4">
        {!manualOpen ? (
          <button className="w-full py-3 text-sm font-semibold text-inkSoft underline"
                  onClick={() => setManualOpen(true)}>
            Enter part number manually
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              className="h-12 flex-1 rounded-full border border-ink/10 bg-white px-4 text-ink focus:border-sunset2 focus:outline-none"
              placeholder="Part no. or paste QR"
              value={manual}
              autoCapitalize="characters"
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitManual()}
            />
            <Button className="px-5" onClick={submitManual}>Add</Button>
          </div>
        )}
        <p className="pt-1 text-center text-[11px] text-inkSoft">Hero QR scans auto-fill qty & MRP</p>
      </div>
    </div>
  );
}
