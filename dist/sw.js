const CACHE_NAME = 'land-ledger-offline-cache-v1';
const STATIC_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg'
];

// On installation, fetch and cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] Pre-caching critical application shell...');
      // Allow individual asset failures without breaking the entire installation
      return Promise.allSettled(
        STATIC_SHELL.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`[PWA SW] Failed to cache initial resource: ${url}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PWA SW] Clearing old out-of-date cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercept requests and serve from cache first, then download in background
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Skip external APIs, Chrome extensions, non-GET requests, or server API routes
  if (
    req.method !== 'GET' || 
    req.url.includes('/api/') || 
    !req.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background to update the cache (Stale-While-Revalidate)
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, networkResponse);
              });
            }
          })
          .catch(() => {
            // Silently absorb network failures when offline
          });
        
        return cachedResponse;
      }

      // Fetch from network and store in cache for next load
      return fetch(req)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
          
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an HTML page, serve the cached root
          if (req.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
    })
  );
});
