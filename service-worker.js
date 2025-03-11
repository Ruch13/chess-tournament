const CACHE_NAME = "chess-tournament-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/index.jsx"
];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch from Cache when Offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
