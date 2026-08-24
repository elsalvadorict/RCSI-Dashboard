'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Shows an "Install App" banner when the browser fires the
 * beforeinstallprompt event (Chrome/Edge on Android and desktop).
 * The banner lets users add the PWA to their home screen.
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode) — use a flag instead of setState
    let isInstalled = false;
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled = true;
    }

    if (isInstalled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setInstalled(true);
      setShowBanner(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner || installed) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-40 max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-xl border border-cyan-500/40 bg-card/95 backdrop-blur-xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold mb-0.5">Install RCSI Dashboard</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Add to your home screen for quick access and offline use.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm" className="h-7 text-xs gap-1">
                <Download className="h-3 w-3" /> Install
              </Button>
              <Button
                onClick={() => setShowBanner(false)}
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
