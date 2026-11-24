/* McQuiz service worker — devdocs-style offline support, opt-in data saving.
   - Resilient precache: one bad file no longer breaks install.
   - Cache-first shell: instant loads, works offline from the first visit.
   - The SW never auto-saves catalogs or set files. Offline access to sets is
     opt-in: only what the user ticks in Settings › Offline (page writes it
     into the "mcquiz-sets" cache via offPut) is served when offline. */
const VERSION = "mcquiz-v3";
const SHELL_CACHE = VERSION + "-shell";
const RUNTIME_CACHE = VERSION + "-runtime"; // static assets only (html, icons, css, js)
const SETS_CACHE = "mcquiz-sets";           // written by the page, read here as offline fallback

const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];

/* ---------------- install: precache each file independently ---------------- */
self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // allSettled: a single 404 (e.g. missing icon) must not abort the whole install
    await Promise.allSettled(SHELL.map(async url => {
      try {
        const res = await fetch(new Request(url, { cache: "reload" }));
        if (res && (res.ok || res.type === "opaque")) await cache.put(url, res);
      } catch (err) { /* skip; runtime caching will pick this file up later */ }
    }));
    await self.skipWaiting();
  })());
});

/* ---------------- activate: clean old versions ---------------- */
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, RUNTIME_CACHE, SETS_CACHE]);
    for (const k of await caches.keys()) {
      if (!keep.has(k)) await caches.delete(k);
    }
    await (await self.clients.matchAll()).forEach(c => c.postMessage({ type: "SW_UPDATED", version: VERSION }));
    await self.clients.claim();
  })());
});

/* Allow the page to force an update: controller.postMessage({type:"SKIP_WAITING"}) */
self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* ---------------- fetch ---------------- */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never touch media range requests (video/audio streaming)
  if (req.headers.get("range")) return;

  // App navigation: cache-first with offline fallback to the shell
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const hit = (await cache.match("index.html")) || (await cache.match("./"));
      const network = (async () => {
        try {
          const res = await fetch(req);
          if (res.ok) await cache.put("index.html", res.clone());
          return res;
        } catch (err) { return null; }
      })();
      if (hit) { e.waitUntil(network); return hit; }
      const fresh = await network;
      return fresh || Response.error();
    })());
    return;
  }

  const isJSON = url.pathname.endsWith(".json");

  // Set files and catalogs: the user chooses what is saved offline.
  // Network first; if offline, fall back to the page-managed mcquiz-sets cache.
  if (isJSON) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: "no-cache" }); // always check for set updates
        return res;
      } catch (err) {
        for (const name of [SETS_CACHE, RUNTIME_CACHE]) {
          const cache = await caches.open(name);
          const hit = await cache.match(req, { ignoreSearch: false, ignoreVary: true });
          if (hit) return hit;
        }
        return Response.error();
      }
    })());
    return;
  }

  // Same-origin static assets (html, icons, images): cache-first + background refresh
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const hit = await cache.match(req);
      if (hit) {
        e.waitUntil((async () => {
          try {
            const fresh = await fetch(req);
            if (fresh && fresh.ok) await cache.put(req, fresh.clone());
          } catch (err) {}
        })());
        return hit;
      }
      const res = await fetch(req);
      if (res && res.ok) { try { await cache.put(req, res.clone()); } catch (err) {} }
      return res;
    })());
    return;
  }

  // Cross-origin non-JSON (fonts, images): cache-first, but never write JSON here.
  e.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const hit = await cache.match(req, { ignoreVary: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) await cache.put(req, res.clone());
      return res;
    } catch (err) { return Response.error(); }
  })());
});


