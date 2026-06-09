import {
  createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile, Part, BasketLine } from './types';

// ── Auth ────────────────────────────────────────────────────────────
interface AuthCtx {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('sj_profiles').select('*').eq('id', uid).maybeSingle();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) await loadProfile(s.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Basket ──────────────────────────────────────────────────────────
const BASKET_KEY = 'sj_basket_v1';

interface BasketCtx {
  lines: BasketLine[];
  count: number;
  total: number;
  add: (part: Part, qty?: number) => void;
  setQty: (partId: string, qty: number) => void;
  remove: (partId: string) => void;
  clear: () => void;
}
const BasketContext = createContext<BasketCtx>({} as BasketCtx);
export const useBasket = () => useContext(BasketContext);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BasketLine[]>(() => {
    try {
      const raw = localStorage.getItem(BASKET_KEY);
      return raw ? (JSON.parse(raw) as BasketLine[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(BASKET_KEY, JSON.stringify(lines)); } catch { /* ignore */ }
  }, [lines]);

  const add = useCallback((part: Part, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.part.id === part.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...prev, { part, qty: Math.max(1, qty) }];
    });
  }, []);

  const setQty = useCallback((partId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.part.id !== partId)
        : prev.map((l) => (l.part.id === partId ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((partId: string) => {
    setLines((prev) => prev.filter((l) => l.part.id !== partId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.part.mrp, 0);

  return (
    <BasketContext.Provider value={{ lines, count, total, add, setQty, remove, clear }}>
      {children}
    </BasketContext.Provider>
  );
}

// ── Toast ───────────────────────────────────────────────────────────
type ToastKind = 'success' | 'warn' | 'error';
interface ToastItem { id: number; kind: ToastKind; msg: string }
interface ToastCtx { toast: (msg: string, kind?: ToastKind) => void }
const ToastContext = createContext<ToastCtx>({} as ToastCtx);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((msg: string, kind: ToastKind = 'success') => {
    const id = ++idRef.current;
    setItems((p) => [...p, { id, kind, msg }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 2600);
  }, []);

  const tint: Record<ToastKind, string> = {
    success: 'bg-mint text-ink',
    warn: 'bg-gold text-ink',
    error: 'bg-cpink text-ink',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4"
           style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        {items.map((t) => (
          <div key={t.id}
               className={`animate-fade rounded-tile px-4 py-3 text-sm font-medium shadow-lift ${tint[t.kind]}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
