'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for PWA offline support.
 * Only runs in production (not during development, to avoid caching issues).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration.scope);
          })
          .catch((error) => {
            console.log('[PWA] Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
