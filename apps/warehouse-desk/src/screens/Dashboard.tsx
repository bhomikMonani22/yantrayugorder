import { useEffect, useState } from 'react';
import { dashboardStats, type DashStats } from '../lib/data';
import { Spinner } from '../components/ui';
import { money } from '../config';

function Stat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className={`rounded-card ${tint} p-6 shadow-soft`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/60">{label}</p>
      <p className="mt-2 font-display text-4xl text-ink">{value}</p>
    </div>
  );
}

export function Dashboard() {
  const [s, setS] = useState<DashStats | null>(null);

  useEffect(() => {
    void dashboardStats().then(setS);
    const t = setInterval(() => void dashboardStats().then(setS), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-8 py-7">
      <h1 className="mb-1 font-display text-3xl text-ink">Today at a glance</h1>
      <p className="mb-6 text-sm text-inkSoft">Refreshes every 30s.</p>
      {!s ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Orders today" value={String(s.todayCount)} tint="bg-white" />
          <Stat label="Value today" value={money(s.todayValue)} tint="bg-gold/50" />
          <Stat label="Open orders" value={String(s.open)} tint="bg-sky/50" />
          <Stat label="Closed" value={String(s.closed)} tint="bg-mint/50" />
        </div>
      )}
    </div>
  );
}
