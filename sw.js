const CACHE_NAME = 'vision-ai-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Кэшируем CDN скрипты и веса модели при первом запросе
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Если это веса нейросети или CDN-скрипты, кэшируем для мгновенного повторного открытия
  if (url.includes('cdn.jsdelivr.net') || url.includes('storage.googleapis.com') || url.includes('tfhub.dev')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Для остальных файлов — cache-first с сетевым обновлением
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
