/**
 * TheDeep CleanerZ - Ultra-Fast Service Worker
 * Architecture:
 * - HTML Documents: Always Network-First (Never cache stale HTML with outdated CSS hashes)
 * - CSS & JS Assets: Let browser native HTTP cache handle with immutable hashes (Prevents FOUC / unstyled flash)
 * - Offline API Fallback: Cache-safe fallback for catalog/reviews
 * - Auto-purges all legacy caches on activation
 */

const API_CACHE_NAME = "thedeepcleanz-api-v5";

// Install: Activate immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Listen for skipWaiting messages from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

// Activate: Immediately purge all legacy caches to fix any stale CSS / HTML in existing user browsers
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== API_CACHE_NAME) {
            console.log("Purging old service worker cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interception
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only handle GET requests from the same origin or specific CDNs
  if (req.method !== "GET" || (!url.origin.startsWith(self.location.origin) && !url.origin.includes("res.cloudinary.com"))) {
    return;
  }

  // 2. DO NOT intercept CSS and JS assets (/assets/*.css, /assets/*.js)
  // Let browser HTTP cache handle hashed assets directly for maximum speed and zero FOUC
  if (url.pathname.startsWith("/assets/") || url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
    return;
  }

  // 3. Navigation Requests (HTML pages): Pass directly to network so user always gets the latest CSS/JS hashes
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Offline - TheDeep CleanerZ</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,-apple-system,sans-serif;background:#FBFBF9;color:#002A22;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center}div{background:#fff;border:1px solid #e2e8f0;padding:32px;border-radius:24px;max-width:400px;box-shadow:0 10px 25px rgba(0,0,0,0.05)}h1{margin:0 0 8px;font-size:20px}p{color:#64748b;font-size:14px;margin:0 0 20px}button{background:#007A48;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer}</style></head><body><div><h1>You are Offline</h1><p>Please check your internet connection to continue browsing.</p><button onclick="window.location.reload()">Retry Connection</button></div></body></html>`,
          { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 }
        );
      })
    );
    return;
  }

  // 4. API Endpoints: Network-First with safe offline JSON fallback
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
});
