// Service worker — מאפשר לאפליקציה לעבוד גם בלי אינטרנט.
// כשמשנים קבצים באפליקציה, מעלים את מספר הגרסה כדי שהמכשירים יקבלו את העדכון.
const VERSION = 'v2';
const CACHE = 'hsp-rewire-' + VERSION;
const FONT_CACHE = 'hsp-rewire-fonts';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // גופנים של גוגל: מהמטמון אם יש, ומתעדכנים ברקע
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(FONT_CACHE).then(async cache => {
      const cached = await cache.match(req);
      const network = fetch(req).then(res => { cache.put(req, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // הדף עצמו: קודם מהרשת (כדי לקבל עדכונים), ואם אין אינטרנט — מהמטמון
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // שאר הקבצים (אייקונים וכו'): מהמטמון, ואם אין — מהרשת
  event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});
