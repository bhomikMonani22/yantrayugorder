import { useEffect, useState } from 'react';
import { BottomSheet, Button } from './ui';
import { CONFIG } from '../config';

const KEY = 'sj_install_dismissed_v1';

// iOS Safari fires no beforeinstallprompt and has no programmatic install.
// Detect iOS + not-standalone and show a one-time how-to.
function isIosSafari() {
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit;
}
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS-only
    window.navigator.standalone === true
  );
}

export function InstallSheet() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    if (isIosSafari() && !isStandalone()) {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(KEY, '1');
    setOpen(false);
  };

  return (
    <BottomSheet open={open} onClose={dismiss}>
      <div className="px-6 pb-4 pt-5">
        <p className="font-display text-2xl text-ink">
          Add <span className="italic text-sunset">{CONFIG.shortName}</span> to your Home Screen
        </p>
        <p className="mt-2 text-sm text-inkSoft">
          Install it like an app for faster ordering and offline browsing.
        </p>
        <ol className="mt-5 space-y-3 text-sm text-ink">
          <li className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sky text-base">1</span>
            Tap the <strong>Share</strong> button
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12v7h14v-7" strokeLinecap="round"/></svg>
            in Safari.
          </li>
          <li className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-mint text-base">2</span>
            Choose <strong>“Add to Home Screen”.</strong>
          </li>
        </ol>
        <Button className="mt-6 w-full" onClick={dismiss}>Got it</Button>
      </div>
    </BottomSheet>
  );
}
