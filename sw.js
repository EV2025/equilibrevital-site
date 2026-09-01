const CACHE_VERSION = 'equilibre-vital-pwa-v1';
const OFFLINE_URL = '/offline.html';
const APP_SHELL = [
  '/application.html',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/assets/css/common-v58.min.css',
  '/assets/css/pwa-app-v1.css',
  '/assets/js/pwa-install.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];
const PRIVATE_PATHS = [
  '/member/',
  '/admin/',
  '/coach/',
  '/reservation.html',
  '/inscription.html',
  '/inscription-confirmee.html',
  '/mot-de-passe-oublie.html',
  '/nouveau-mot-de-passe.html'
];

const isPrivatePath = pathname => PRIVATE_PATHS.some(path =>
  path.endsWith('/') ? pathname.startsWith(path) : pathname === path
);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isPrivatePath(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  if (!['style', 'script', 'image', 'font'].includes(request.destination)) return;
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
