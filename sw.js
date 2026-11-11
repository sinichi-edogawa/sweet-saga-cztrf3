/* Service worker.
   Tujuannya dua: permainan bisa dibuka tanpa internet, TAPI versi baru harus
   benar-benar sampai ke pemain.

   Versi sebelumnya memakai cache-first untuk semua berkas, akibatnya kode lama
   terkunci selamanya di perangkat. Sekarang:
     - kode (html/js/css/json)  -> jaringan dulu, simpanan sebagai cadangan
     - gambar/ikon              -> simpanan dulu (jarang berubah, hemat kuota)
*/
const CACHE = 'sweet-saga-v3';
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

const isCode = url =>
  /\.(html|js|css|json|webmanifest)$/i.test(url.pathname) ||
  url.pathname.endsWith('/');

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;          // font dsb. biarkan apa adanya

  const simpan = res => {
    if (res && res.ok){
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
    }
    return res;
  };

  if (isCode(url)){
    // JARINGAN DULU: selalu dapat versi terbaru selama ada sinyal.
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(simpan)
        .catch(() => caches.match(e.request, { ignoreSearch: true })
                       .then(hit => hit || caches.match('./index.html')))
    );
  } else {
    // SIMPANAN DULU untuk gambar: isinya tidak berubah-ubah.
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true })
        .then(hit => hit || fetch(e.request).then(simpan))
    );
  }
});
