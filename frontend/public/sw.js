/**
 * TheDeep CleanerZ - High Performance Service Worker
 * Features:
 * - Ultra-fast Network-First for Navigation & API requests (prevents stale cached pages)
 * - Intelligent SPA Shell fallback for offline / spotty connections (eliminates 404 errors)
 * - Cache-First for static images & fonts for blazing load speeds
 * - Automatic cache purging on new deployments
 */

const CACHE_NAME = "thedeepcleanz-static-v4";
const API_CACHE_NAME = "thedeepcleanz-api-v4";

const PRECACHE_ASSETS = [
  "/",
  "/services",
  "/customized",
  "/my-bookings",
  "/login",
  "/favicon.png",
  "/logos/logo.png",
  "/manifest.json",
];

// Install: Pre-cache essential app shell assets and activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("Pre-cache warning during SW install:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Purge any old/outdated caches immediately
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

// Fetch Interception
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET requests and browser extensions
  if (req.method !== "GET" || (!url.origin.startsWith(self.location.origin) && !url.origin.includes("fonts.gstatic.com") && !url.origin.includes("fonts.googleapis.com") && !url.origin.includes("res.cloudinary.com"))) {
    return;
  }

  // 1. Navigation Requests (HTML pages): Network-First with SPA Shell Fallback (Never 404)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          // Fallback to cached home shell for client-side routing
          const shell = await caches.match("/");
          if (shell) return shell;
          return new Response("Offline - Please check your connection", { status: 503 });
        })
    );
    return;
  }

  // 2. Dynamic API Endpoints: Network-First with Cache Fallback for instant fresh data
  if (url.pathname.startsWith("/api/catalog") || url.pathname.startsWith("/api/customized-services") || url.pathname.startsWith("/api/transformations") || url.pathname.startsWith("/api/coupons") || url.pathname.startsWith("/api/reviews")) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, error: "Network unavailable" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          });
        })
    );
    return;
  }

  // 3. Vite Hashed Assets (/assets/*.js, /assets/*.css): Network-First / Stale-While-Revalidate
  if (url.pathname.includes("/assets/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. Static Images & Web Fonts: Cache-First with Background Revalidation for max speed
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf)$/) ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.hostname.includes("res.cloudinary.com")
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        }).catch(() => cached);
      })
    );
    return;
  }
});
