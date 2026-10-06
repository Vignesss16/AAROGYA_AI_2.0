/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
// Custom Service Worker script bundled by next-pwa into sw.js
// Handles offline navigation fallback and guarantees Chrome never displays "You're offline"

self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => {
    return Promise.all(keys.map(key => {
      if (key.includes('v3') || key.includes('-6B-A5N8KCaf10r-BY1upt') || key.includes('-DIPqPDbYZvQfzWI-6FqfQ')) {
        console.log('[SW] Deleting stale cache:', key);
        return caches.delete(key);
      }
    }));
  }).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
self.addEventListener('fetch', event => {
  // Only intercept top-level document navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // 1. Try network with short timeout (1.5s)
        const networkPromise = fetch(event.request);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 1500));
        const response = await Promise.race([networkPromise, timeoutPromise]);
        if (response && response.status === 200) {
          return response;
        }
        throw new Error('Network response not 200');
      } catch (err) {
        // 2. Network failed or timed out — device is offline
        const url = new URL(event.request.url);

        // If offline and requesting root '/', match cached root '/' first so client router evaluates auth state
        if (url.pathname === '/') {
          const rootMatch = await caches.match('/', {
            ignoreSearch: true
          });
          if (rootMatch) return rootMatch;
          const loginMatch = await caches.match('/login', {
            ignoreSearch: true
          });
          if (loginMatch) return loginMatch;
          const homeMatch = await caches.match('/home', {
            ignoreSearch: true
          });
          if (homeMatch) return homeMatch;
        }

        // Attempt A: Match the requested URL from any cache (e.g. /login, /home, /records)
        const exactMatch = await caches.match(event.request, {
          ignoreSearch: true
        });
        if (exactMatch) return exactMatch;

        // Attempt B: Match the pathname
        const pathnameMatch = await caches.match(url.pathname, {
          ignoreSearch: true
        });
        if (pathnameMatch) return pathnameMatch;

        // Attempt C: Match root /
        const rootMatch = await caches.match('/', {
          ignoreSearch: true
        });
        if (rootMatch) return rootMatch;

        // Attempt D: Match /login
        const loginMatch = await caches.match('/login', {
          ignoreSearch: true
        });
        if (loginMatch) return loginMatch;

        // Attempt E: Match /home
        const homeMatch = await caches.match('/home', {
          ignoreSearch: true
        });
        if (homeMatch) return homeMatch;

        // Attempt F: Search inside all cache storages for any valid HTML page
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          for (const key of keys) {
            if (key.url.endsWith('/') || key.url.includes('/home') || key.url.includes('/asha/dashboard')) {
              const res = await cache.match(key);
              if (res) return res;
            }
          }
        }

        // Guaranteed Emergency Fallback: Valid 200 HTML that redirects to /
        return new Response(`<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AAROGYA.AI</title><script>window.location.replace('/');</script></head><body style="background:#0d1520;color:white;font-family:sans-serif;text-align:center;padding:40px"><h2>AAROGYA.AI</h2><p>लोड हो रहा है... (Loading offline mode)</p></body></html>`, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        });
      }
    })());
  }
});
/******/ })()
;