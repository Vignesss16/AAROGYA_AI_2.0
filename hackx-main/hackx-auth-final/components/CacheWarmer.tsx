"use client";
import { useEffect } from "react";

/**
 * CacheWarmer: Silently precaches essential pages in the browser's CacheStorage
 * while the device is online so that any subsequent navigation, refresh, or offline
 * visit loads instantly from service worker cache without showing the browser's offline screen.
 */
export default function CacheWarmer() {
  useEffect(() => {
    if (typeof window === "undefined" || !("caches" in window)) return;

    const warmCache = async () => {
      try {
        const cache = await caches.open("pages-runtimes");
        const urls = [
          "/",
          "/home",
          "/login",
          "/asha/dashboard",
          "/asha/login",
          "/asha/log-visit",
          "/records",
          "/symptoms",
          "/symptom-detail",
          "/triage",
          "/report",
          "/~offline",
        ];

        for (const url of urls) {
          try {
            const cached = await cache.match(url);
            if (!cached) {
              const res = await fetch(url, { cache: "no-store" });
              if (res.ok) {
                await cache.put(url, res);
              }
            }
          } catch {
            // Ignore individual fetch errors
          }
        }
      } catch (err) {
        console.warn("[CacheWarmer] Offline cache warming error:", err);
      }
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => warmCache());
    } else {
      setTimeout(warmCache, 2500);
    }
  }, []);

  return null;
}
