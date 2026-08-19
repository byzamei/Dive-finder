// Minimal offline shell: caches the app shell so re-opening the installed
// PWA without a connection shows something useful instead of a browser
// error. Deliberately does NOT cache API/data responses — search results
// must always reflect live, sourced data, never a stale offline cache.
const SHELL_CACHE = "divefinder-shell-v1";
const SHELL_URLS = ["/", "/discover", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api")) return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached ?? caches.match("/"))
    )
  );
});
