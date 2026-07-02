const CACHE = 'polyglot-v1';
const SHELL = [
  './', './index.html', './manifest.json', './css/app.css',
  './js/srs.js', './js/speech.js', './js/tutor.js', './js/app.js',
  './js/data/languages.js',
  './js/data/courses/es.js', './js/data/courses/fr.js', './js/data/courses/de.js',
  './js/data/courses/ru.js', './js/data/courses/tr.js', './js/data/courses/ms.js',
  './js/data/courses/ur.js', './js/data/courses/arz.js', './js/data/courses/cmn.js',
  './js/data/courses/yue.js', './js/data/courses/ja.js', './js/data/courses/ko.js',
  './icon-192.png', './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // never intercept API calls
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200) return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
