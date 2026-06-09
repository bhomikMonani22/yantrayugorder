import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabaseConfigured } from '../lib/supabase';
import { Button } from '../components/ui';
import { CONFIG } from '../config';

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setErr(null);
    const { error } = await signIn(email.trim(), password);
    if (error) setErr(error);
    setBusy(false);
  };

  const input =
    'w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-ink ' +
    'placeholder:text-inkSoft focus:border-sunset2 focus:outline-none';

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* left: charcoal brand panel */}
      <div className="hidden flex-col justify-between bg-charcoal p-12 text-white lg:flex">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
          {CONFIG.tagline}
        </p>
        <div>
          <h1 className="font-display text-5xl leading-tight">
            <span className="text-sunset">{CONFIG.businessName}</span>
          </h1>
          <p className="mt-4 max-w-sm text-white/60">
            Live retailer orders, pick lists with bin locations, and one-tap invoice closing.
          </p>
        </div>
        <p className="text-[11px] text-white/40">{CONFIG.developedBy}</p>
      </div>

      {/* right: form */}
      <div className="flex items-center justify-center bg-bg p-8">
        <div className="w-full max-w-sm">
          <p className="font-display text-3xl text-ink lg:hidden">{CONFIG.businessName}</p>
          {!supabaseConfigured && (
            <div className="mb-5 rounded-2xl bg-gold/60 px-4 py-3 text-sm text-ink">
              Supabase isn’t configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
            </div>
          )}
          <p className="font-display text-2xl text-ink">Warehouse sign-in</p>
          <p className="mb-6 text-sm text-inkSoft">Staff and admin access only.</p>

          <div className="space-y-3">
            <input className={input} type="email" inputMode="email" autoCapitalize="none"
              placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={input} type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
          {err && <p className="mt-3 text-sm text-sunset2">{err}</p>}
          <Button className="mt-6 w-full" disabled={busy || !email || !password} onClick={submit}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="mt-8 text-center text-xs text-inkSoft">
            Demo: warehouse@yantrayug.test · Wh@12345
          </p>
          <p className="mt-2 text-center text-[10px] text-inkSoft/70">{CONFIG.developedBy}</p>
        </div>
      </div>
    </div>
  );
}
