// Eenvoudige offline-cache: onderweg in Frankrijk is er niet altijd bereik.
// Verhoog de versie bij elke wijziging aan de bestanden hieronder.
const CACHE = 'departementenspel-v2';
const BESTANDEN = [
  './', 'index.html', 'style.css', 'data.js', 'game.js', 'kentekens.js', 'app.js',
  'departements.geojson', 'manifest.webmanifest', 'icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
