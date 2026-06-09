import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/state';
import { BottomNav } from './components/BottomNav';
import { BottomSheet } from './components/ui';
import { InstallSheet } from './components/InstallSheet';
import { Login } from './screens/Login';
import { Catalogue } from './screens/Catalogue';
import { Basket } from './screens/Basket';
import { Orders } from './screens/Orders';
import { Scan } from './screens/Scan';

function Shell() {
  const [scanOpen, setScanOpen] = useState(false);
  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <Routes>
        <Route path="/" element={<Catalogue />} />
        <Route path="/search" element={<Catalogue />} />
        <Route path="/basket" element={<Basket />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <BottomNav onScan={() => setScanOpen(true)} />

      {/* Scan sheet only mounts on tap → camera request happens on a user gesture (iOS rule) */}
      <BottomSheet open={scanOpen} onClose={() => setScanOpen(false)} full>
        {scanOpen && <Scan onClose={() => setScanOpen(false)} />}
      </BottomSheet>

      <InstallSheet />
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="screen grid place-items-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink/15 border-t-sunset2" />
      </div>
    );
  }

  if (!session) return <Login />;

  return <Shell />;
}
