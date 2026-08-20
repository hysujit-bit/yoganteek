const CACHE_NAME = 'yoganteek-ops-v2';
const PRECACHE_ASSETS = [
  '/favicon.png',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// Install — precache only stable assets (NOT index.html)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean ALL old caches on new deploy
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
//   - API calls: network only (no cache)
//   - index.html: network first (ensures fresh HTML after deploy)
//   - JS/CSS bundles: cache first (they are hashed, so new = new filename)
//   - Other assets: cache first, network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API calls — network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    return;
  }

  // index.html — network first (critical: prevents stale HTML after deploy)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Hashed assets (/assets/index-*.js, /assets/index-*.css) — cache first
  // These filenames change on each build, so cached = current version
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Everything else (images, fonts, etc.) — cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
