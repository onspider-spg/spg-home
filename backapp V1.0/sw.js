// Version 1.0 | 8 MAR 2026 | Siam Palette Group
const CACHE = 'spg-home-v1';
const ASSETS = [
  '/spg-home/',
  '/spg-home/css/styles.css',
  '/spg-home/js/api.js',
  '/spg-home/js/app.js',
  '/spg-home/js/screens.js',
  '/spg-home/js/screens2.js',
  '/spg-home/icon-192.png',
  '/spg-home/icon-512.png'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== CACHE).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

// Fetch — network first for API, cache first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API calls — always network
  if (url.pathname.includes('/api') || url.search.includes('action=')) return;
  // Font CDN — cache first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    })));
    return;
  }
  // Local assets — network first, fallback cache
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request)));
  }
});
