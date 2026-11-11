/* Service worker: simpan semua berkas supaya permainan bisa dibuka tanpa internet. */
const CACHE = 'sweet-saga-v2';
const FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/levels.js',
  './js/art.js',
  './js/game.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(FILES.map(f => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        // simpan berkas sendiri yang berhasil diambil
        if (res.ok && new URL(e.request.url).origin === location.origin){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

