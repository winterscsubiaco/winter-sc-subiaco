const CACHE = 'wintersc-v9';
const RISORSE = ['/', '/index.html', '/diario.html', '/allenatrice.html', '/css/style.css', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(RISORSE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase')) return; // non mettere in cache le API
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
