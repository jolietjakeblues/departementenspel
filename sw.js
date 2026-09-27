// Eenvoudige offline-cache: onderweg in Frankrijk is er niet altijd bereik.
// Verhoog de versie bij elke wijziging aan de bestanden hieronder.
const CACHE = 'departementenspel-v5';
const BESTANDEN = [
  './', 'index.html', 'handleiding.html', 'style.css', 'data.js', 'game.js', 'kentekens.js', 'app.js',
  'departements.geojson', 'manifest.webmanifest', 'icon.svg'
];

self.addEventListener('install', e => {
  // Niet meteen activeren: de app toont een balk "Nieuwe versie beschikbaar".
  // cache: 'reload' haalt de bestanden vers op, niet uit de browsercache.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BESTANDEN.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
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
