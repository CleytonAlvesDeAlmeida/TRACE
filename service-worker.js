const CACHE_NAME = "trace-cache-v1";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/assets/icon-512.png",
  "/assets/icon-192.png"
];

// INSTALAÇÃO
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// ATIVAÇÃO
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => k !== CACHE_NAME && caches.delete(k))
      )
    )
  );

  self.clients.claim();
});

// FETCH → fallback offline
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html"))
    );
  }
});