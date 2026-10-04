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
        const pagesCache = await caches.open("pages-runtimes");
        const startUrlCache = await caches.open("start-url");

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
            if (navigator.onLine) {
              const res = await fetch(url, { cache: "no-store" });
              if (res.ok) {
                const blob = await res.blob();
                const headers = new Headers(res.headers);
                if (!headers.get("content-type")) {
                  headers.set("content-type", "text/html; charset=utf-8");
                }

                await pagesCache.put(
                  url,
                  new Response(blob, {
                    status: 200,
                    statusText: "OK",
                    headers,
                  })
                );

                if (url === "/") {
                  await startUrlCache.put(
                    url,
                    new Response(blob, {
                      status: 200,
                      statusText: "OK",
                      headers,
                    })
                  );
                }
              }
            }
          } catch {
            // Ignore individual fetch errors
          }
        }
        console.log("[CacheWarmer] Offline pages successfully cached locally.");
      } catch (err) {
        console.warn("[CacheWarmer] Offline cache warming error:", err);
      }
    };

    // Warm cache quickly after mount (800ms) so user experience is smooth and offline storage is filled immediately
    const timer = setTimeout(warmCache, 800);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
