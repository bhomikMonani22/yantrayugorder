import { NavLink } from 'react-router-dom';
import { useBasket } from '../lib/state';

const iconCls = 'h-6 w-6';

function HomeIcon() {
  return (<svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}
function SearchIcon() {
  return (<svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2" strokeLinecap="round"/></svg>);
}
function BagIcon() {
  return (<svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round"/><path d="M9 8a3 3 0 0 1 6 0" strokeLinecap="round"/></svg>);
}
function OrdersIcon() {
  return (<svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round"/></svg>);
}
function ScanIcon() {
  return (<svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" strokeLinecap="round"/><path d="M4 12h16" strokeLinecap="round"/></svg>);
}

function Tab({ to, label, children }: { to: string; label: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex h-full min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 ${
          isActive ? 'text-ink' : 'text-inkSoft'
        }`
      }
    >
      {children}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}

export function BottomNav({ onScan }: { onScan: () => void }) {
  const { count } = useBasket();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div className="relative mx-auto flex h-[64px] max-w-md items-stretch bg-white/95 shadow-[0_-8px_30px_rgba(44,42,41,0.08)] backdrop-blur pb-safe">
        <Tab to="/" label="Home"><HomeIcon /></Tab>
        <Tab to="/search" label="Search"><SearchIcon /></Tab>
        <div className="w-[72px]" aria-hidden />
        <Tab to="/basket" label="Basket">
          <span className="relative">
            <BagIcon />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-sunset2 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </span>
        </Tab>
        <Tab to="/orders" label="Orders"><OrdersIcon /></Tab>

        {/* center scan FAB — thumb home position */}
        <button
          onClick={onScan}
          aria-label="Scan part QR"
          className="absolute left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-sunset text-white shadow-sunset active:scale-95 transition"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 18px)' }}
        >
          <ScanIcon />
        </button>
      </div>
    </nav>
  );
}
