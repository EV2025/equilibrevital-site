const SHELL_CACHE = 'pssr-shell-v83';
const SHELL_ASSETS = [
  '/manifest.webmanifest',
  '/assets/css/common-v58.min.css',
  '/assets/css/member-app-v83.css',
  '/assets/js/auth-comfort.js',
  '/assets/js/member.js',
  '/wp-content/uploads/2025/09/equilibre-vital-logo-transparent.png'
];
const PRIVATE_PATHS = ['/member/','/admin/','/coach/','/reservation.html','/inscription.html','/inscription-confirmee.html','/mot-de-passe-oublie.html','/nouveau-mot-de-passe.html'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => Promise.allSettled(SHELL_ASSETS.map(asset => cache.add(asset)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== SHELL_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (PRIVATE_PATHS.some(path => url.pathname.startsWith(path) || url.pathname === path)){
    event.respondWith(fetch(request));
    return;
  }
  if (!['style','script','image','font'].includes(request.destination)) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(SHELL_CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
