import { useState } from 'react';
import { useAuth } from '../lib/state';
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
    'w-full rounded-2xl border border-ink/10 bg-white px-4 py-3.5 text-ink ' +
    'placeholder:text-inkSoft focus:border-sunset2 focus:outline-none';

  return (
    <div className="screen flex flex-col">
      {/* charcoal hero */}
      <div className="bg-charcoal px-6 pb-12 pt-safe text-white">
        <div className="pt-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
            {CONFIG.tagline}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight">
            <span className="text-sunset">{CONFIG.businessName}</span>
          </h1>
        </div>
      </div>

      <div className="-mt-6 flex-1 rounded-t-[28px] bg-bg px-6 pt-8">
        {!supabaseConfigured && (
          <div className="mb-5 rounded-2xl bg-gold/60 px-4 py-3 text-sm text-ink">
            Supabase isn’t configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>.
          </div>
        )}
        <p className="font-display text-2xl text-ink">Welcome back</p>
        <p className="mb-6 text-sm text-inkSoft">Sign in to place your orders.</p>

        <div className="space-y-3">
          <input
            className={input} type="email" inputMode="email" autoCapitalize="none"
            placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={input} type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>

        {err && <p className="mt-3 text-sm text-sunset2">{err}</p>}

        <Button className="mt-6 w-full" disabled={busy || !email || !password} onClick={submit}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="mt-8 text-center text-xs text-inkSoft">
          Demo: retailer1@shrinathji.test · Retail@12345
        </p>
        <p className="mt-2 text-center text-[10px] tracking-wide text-inkSoft/70">
          {CONFIG.developedBy}
        </p>
      </div>
    </div>
  );
}
