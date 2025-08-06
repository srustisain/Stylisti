// Service Worker for Stylisti PWA
const CACHE_NAME = 'stylisti-v13';
const urlsToCache = [
  '/app.html',
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('SW: Cache install failed:', err))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  console.log('SW: Fetching', event.request.url);
  
  // Always fetch from network first for app.html to ensure latest version
  if (event.request.url.includes('/app.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the new version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('SW: Serving from cache:', event.request.url);
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            console.log('SW: Invalid response, returning as-is:', event.request.url);
            return response;
          }
          
          // Clone the response because it's a stream
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              console.log('SW: Caching new resource:', event.request.url);
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(error => {
          console.log('SW: Fetch failed, trying cache:', event.request.url, error);
          // If fetch fails, try to serve from cache
          return caches.match(event.request);
        });
      }).catch(error => {
        console.log('SW: Cache match failed, trying app.html fallback:', event.request.url, error);
        // If all else fails, try to serve app.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/app.html');
        }
        return new Response('Network error', { status: 404 });
      });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Force refresh of app.html on activation
      return caches.open(CACHE_NAME).then(cache => {
        return cache.delete('/app.html');
      });
    })
  );
});

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New outfit uploaded!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Stylisti', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});