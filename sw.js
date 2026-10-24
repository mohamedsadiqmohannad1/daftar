// Offline shell for دفتر التطور. Bump VERSION when you upload a new index.html.
const VERSION = "daftar-v2";
const FOODS = "./foods.json?v=1"; // the food database; change ?v= in index.html and here when the file changes
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", FOODS];
const LIB_HOSTS = ["www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const cacheFirst = req => caches.match(req).then(hit => hit || fetch(req).then(res => {
  if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
  return res;
}));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // the food database is large and versioned: cache first
    if (url.pathname.endsWith("/foods.json")) { e.respondWith(cacheFirst(req)); return; }
    // app files: network first so updates arrive, cache when offline
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
    return;
  }
  // versioned libraries and fonts: cache first
  if (LIB_HOSTS.includes(url.hostname)) e.respondWith(cacheFirst(req));
  // database traffic is left to the database library
});
