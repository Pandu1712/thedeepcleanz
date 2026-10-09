/**
 * TheDeep CleanerZ - Unified High-Performance Service Worker (v8)
 *
 * Architecture:
 * 1. HTML Documents: Network-First navigation. Never treated as static assets.
 *    Never throws "TypeError: Failed to fetch". Returns clean offline fallback page when offline.
 * 2. Static CSS & JS Bundles (/assets/*): Pass through directly to browser native HTTP cache.
 * 3. Sensitive Checkout, Payment & Auth APIs: Never intercepted, never cached.
 *    Explicit pass-through for /checkout, /api/bookings, /api/razorpay, /api/auth, /api/locations, /api/admin, /api/technician.
 * 4. Safe Non-GET bypass: POST, PUT, DELETE, PATCH, OPTIONS are NEVER touched.
 * 5. Public GET APIs: Network-first with safe timeout (3s) and cached fallback.
 * 6. Auto-purges all legacy caches (thedeepcleanz-static-v1, thedeepcleanz-api-v1, thedeepcleanz-api-v6, etc.) on activate.
 */

const CACHE_NAME = "thedeepcleanz-v8";

// Install: Skip waiting immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Message listener for skipWaiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

// Activate: Purge ALL previous caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log("[SW] Purging outdated cache:", key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper for network fetch with safe timeout
function fetchWithTimeout(request, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("SW Fetch Timeout")), timeoutMs);
    fetch(request)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Fetch event
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only intercept GET requests
  if (req.method !== "GET") {
    return;
  }

  // 2. Never intercept external domains except Cloudinary CDN
  const isSameOrigin = url.origin === self.location.origin;
  const isCloudinary = url.hostname.includes("res.cloudinary.com");
  if (!isSameOrigin && !isCloudinary) {
    return;
  }

  // 3. STRICT BYPASS: Never intercept or cache sensitive checkout, auth, payment, admin, or location endpoints
  const bypassPaths = [
    "/checkout",
    "/api/bookings",
    "/api/razorpay",
    "/api/auth",
    "/api/locations",
    "/api/admin",
    "/api/technician",
  ];
  if (bypassPaths.some((p) => url.pathname.startsWith(p))) {
    return; // Pass through directly to browser network
  }

  // 4. BYPASS CSS & JS Bundles: Let browser HTTP cache handle hashed assets for zero FOUC
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    return;
  }

  // 5. Navigation Requests (HTML Pages like /, /services, /customized):
  // Network-First with safe offline HTML fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Offline | TheDeep CleanerZ</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #F8FAF9; color: #002A22; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { background: #fff; border: 1px solid #e2e8f0; padding: 32px; border-radius: 24px; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    h1 { margin: 0 0 8px; font-size: 20px; font-weight: 800; }
    p { color: #64748b; font-size: 14px; margin: 0 0 20px; }
    button { background: #007A48; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h1>You are Offline</h1>
    <p>Please check your internet connection to continue browsing TheDeep CleanerZ.</p>
    <button onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>`,
          {
            headers: { "Content-Type": "text/html; charset=utf-8" },
            status: 503,
          }
        );
      })
    );
    return;
  }

  // 6. Public Cacheable APIs (Catalog, Services, Reviews, Transformations, Coupons)
  const isCacheableApi =
    url.pathname.startsWith("/api/catalog") ||
    url.pathname.startsWith("/api/customized-services") ||
    url.pathname.startsWith("/api/transformations") ||
    url.pathname.startsWith("/api/coupons") ||
    url.pathname.startsWith("/api/reviews");

  if (isCacheableApi) {
    event.respondWith(
      fetchWithTimeout(req, 3000)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ offline: true, error: "Network unavailable" }),
            {
              headers: { "Content-Type": "application/json" },
              status: 200,
            }
          );
        })
    );
    return;
  }

  // 7. Media & CDN Images: Cache-first with network fallback
  if (isCloudinary || url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico)$/i)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return res;
          })
          .catch(() => {
            return new Response("", { status: 408 });
          });
      })
    );
    return;
  }
});
