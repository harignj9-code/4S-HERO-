const CACHE_NAME = 'mmc-4s-hero-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/verify.html',
  '/css/style.css',
  '/js/app.js',
  '/js/qrcode.min.js',
  '/assets/logos/mmc-logo-horizontal.jpeg',
  '/assets/logos/mmc-logo-vertical.jpeg',
  '/assets/logos/telangana-govt-logo.png',
  '/assets/logos/telangana-rising-logo.png',
  '/assets/logos/official-govt-logos.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests and bypass /api/
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback to offline or cached root
        return caches.match('/index.html');
      });
    })
  );
});
