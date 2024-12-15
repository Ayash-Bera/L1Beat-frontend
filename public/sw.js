const CACHE_NAME = 'l1beat-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install service worker
self.addEventListener('install', event => {
  // Immediately activate the new service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch resources
self.addEventListener('fetch', event => {
  // Only handle HTTP and HTTPS requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // For API requests, use Network First strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other requests, use Cache First strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Even if we have a cache, try to update it in the background
          fetch(event.request)
            .then(networkResponse => {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, networkResponse);
                });
            });
          return response;
        }

        return fetch(event.request)
          .then(response => {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
});

// Clean up old caches and claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim any clients immediately
      clients.claim(),
      // Set theme color
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'THEME_COLOR',
            color: '#242424'
          });
        });
      })
    ])
  );
}); 