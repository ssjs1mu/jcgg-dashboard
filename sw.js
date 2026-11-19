/* Joshi's Corner dashboard - service worker for the installable app.
   LIVE DATA RULE: prices / feeds are NEVER cached here - every data request goes straight to the network.
   Pages are always fetched fresh from the site (so every repo change shows up at once); only when the phone is
   offline does it show the last copy of the page with an "offline" notice, or the offline screen. */
const V = 'jc-shell-v1';
const OFFLINE = './offline.html';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll([OFFLINE, './icons/icon-192.png'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;                       // backend, GitHub data, Yahoo, video: untouched, always live
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r, { cache: 'no-store' }).then((res) => { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); return res; })
      .catch(() => caches.match(r).then((m) => m || caches.match(OFFLINE))));
  }
});
