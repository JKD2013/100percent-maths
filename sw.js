// ============================================================
// 100Percent — Service Worker
// Offline support for PWA
// ============================================================

const CACHE_NAME = '100percent-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/task.html',
  '/question.html',
  '/for-students.html',
  '/for-teachers.html',
  '/for-schools.html',
  '/about-us.html',
  '/pricing.html',
  '/contact-us.html',
  '/teacher-dashboard.html',
  '/question-bank.html',
  '/leaderboard.html',
  '/group-detail.html',
  '/create-assignment.html',
  '/assignment-progress.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/supabase-client.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/question.js',
  '/js/task.js',
  '/js/question-bank.js',
  '/js/leaderboard.js',
  '/js/group-detail.js',
  '/js/create-assignment.js',
  '/js/assignment-progress.js',
  '/manifest.json'
];

// Install - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Don't cache non-GET requests or API calls
        if (event.request.method !== 'GET' || event.request.url.includes('supabase')) {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
