/* Fluent Path service worker: caches the whole site so it runs with no connection.
   It only ever serves files from this site; nothing is fetched from anywhere else. */
var CACHE = 'fluent-path-v1';
var FILES = ['./', 'index.html', 'styles.css', 'icon.svg', 'manifest.webmanifest',
  'data/en.js', 'data/es.js', 'data/fr.js', 'data/de.js', 'data/it.js', 'data/pt.js', 'data/notes.js',
  'js/engine.js', 'js/app.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf('fluent-path-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Network first so updates arrive when online; cache when offline.
  e.respondWith(fetch(e.request).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (hit) { return hit || caches.match('index.html'); });
  }));
});
