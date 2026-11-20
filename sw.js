// Caches the app shell so the page opens offline. Translation and speech requests always go to the network.
const CACHE = "translator-v2";
const SHELL = ["./", "index.html", "app.js", "translate.js", "languages.js", "manifest.webmanifest", "icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // never cache third-party translation calls
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
