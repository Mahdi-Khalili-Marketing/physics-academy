"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In dev, the service worker serves stale chunks after code changes —
    // unregister it and drop its caches so HMR bundles load fresh.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // PWA is progressive enhancement; app works without it.
    });
  }, []);

  return null;
}
