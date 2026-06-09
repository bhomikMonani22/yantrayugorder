import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Login } from './screens/Login';
import { Board } from './screens/Board';
import { Dashboard } from './screens/Dashboard';
import { AdminCatalogue } from './screens/AdminCatalogue';
import { Button } from './components/ui';
import { CONFIG } from './config';

function NavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink to={to} end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          isActive ? 'bg-charcoal text-white' : 'text-inkSoft hover:bg-white'
        }`}>
      {icon}{label}
    </NavLink>
  );
}

function Sidebar() {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-ink/5 bg-bg px-4 py-6">
      <div className="px-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-inkSoft">{CONFIG.tagline}</p>
        <p className="mt-1 font-display text-2xl leading-tight text-ink">
          <span className="text-sunset">{CONFIG.businessName}</span>
        </p>
      </div>
      <nav className="mt-8 space-y-1.5">
        <NavItem to="/" label="Live orders"
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>} />
        <NavItem to="/dashboard" label="Dashboard"
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round"/></svg>} />
        {isAdmin && (
          <NavItem to="/catalogue" label="Catalogue"
            icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round"/></svg>} />
        )}
      </nav>
      <div className="mt-auto px-1">
        <p className="px-3 text-xs text-ink">{profile?.shop_name}</p>
        <p className="px-3 text-[11px] capitalize text-inkSoft">{profile?.role}</p>
        <button onClick={signOut} className="mt-3 px-3 text-sm font-semibold text-inkSoft hover:text-ink">Sign out</button>
        <p className="mt-4 px-3 text-[10px] text-inkSoft/60">{CONFIG.developedBy}</p>
      </div>
    </aside>
  );
}

export default function App() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-bg">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink/15 border-t-sunset2" /></div>;
  }
  if (!session) return <Login />;

  // Warehouse desk is staff-only
  if (profile && profile.role === 'retailer') {
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-8 text-center">
        <div>
          <p className="font-display text-3xl text-ink">Staff access only</p>
          <p className="mt-2 text-inkSoft">This account is a retailer. Use the ordering app instead.</p>
          <Button variant="soft" className="mt-6" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/catalogue" element={<AdminCatalogue />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
