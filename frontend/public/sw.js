const CACHE_NAME = "thedeepcleanz-static-v1";
const API_CACHE_NAME = "thedeepcleanz-api-v1";

const STATIC_ASSETS = [
  "/",
  "/customized",
  "/my-bookings",
  "/services",
  "/login",
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching initial shell assets");
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn("Failed to pre-cache some assets during install:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            console.log("Removing outdated service worker cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event Interception
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Ignore non-GET requests and internal schemes / extensions
  if (event.request.method !== "GET" || (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith("https://fonts."))) {
    return;
  }

  // Handle Dynamic API endpoints (Network-First with Cache Fallback)
  if (requestUrl.pathname.includes("/api/catalog") || requestUrl.pathname.includes("/api/reviews") || requestUrl.pathname.includes("/api/bookings")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fetch fails, return from cache fallback
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If cache is empty and network failed, return a friendly JSON response
            return new Response(
              JSON.stringify({
                error: "Network unavailable. Serving local offline fallback.",
                categories: [],
                services: []
              }),
              {
                headers: { "Content-Type": "application/json" },
                status: 200
              }
            );
          });
        })
    );
    return;
  }

  // Handle Static Assets (Stale-While-Revalidate / Cache-First)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn("Network fetch failed for static asset:", event.request.url, err);
        });

      // Return cached response instantly if available, otherwise wait for network fetch
      return cachedResponse || fetchPromise;
    })
  );
});
