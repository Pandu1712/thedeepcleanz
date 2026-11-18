require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const path = require("path");

// Process level safety guards against unexpected backend crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

// Polyfill fetch using native HTTPS module to support older Node.js versions on Hostinger
const fetch = typeof globalThis.fetch === "function" ? globalThis.fetch : async (url, options = {}) => {
  const https = require("https");
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: async () => data,
          json: async () => JSON.parse(data),
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
};
const fs = require("fs");
const crypto = require("crypto");
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const db = require("./config/db");
const { sendBookingEmails } = require("./utils/mailer");
const { sendAdminWhatsAppAlert, sendTestWhatsAppAlert } = require("./utils/whatsapp");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEFAULT_ADMIN_EMAIL = "thedeepcleanerz.info@gmail.com";

// ===================== Shared helpers =====================

// All business dates/times are Indian Standard Time, regardless of the server's timezone.
function nowInIST() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value || "00";
  const hour = Number(get("hour")) % 24;
  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: hour * 60 + Number(get("minute")),
  };
}
function todayIST() {
  return nowInIST().dateStr;
}

// Returns the 10-digit Indian mobile number, or "" if the input is not a valid one.
function normalizeIndianPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  const last10 = digits.slice(-10);
  if (!/^[6-9]\d{9}$/.test(last10)) return "";
  // Only accept known prefixes (none, 0, 91) in front of the 10 digits
  const prefix = digits.slice(0, digits.length - 10);
  if (prefix && prefix !== "0" && prefix !== "91") return "";
  return last10;
}

function isValidEmail(email) {
  return /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/.test(String(email || "").trim());
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function safeParse(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

// Simple in-memory fixed-window rate limiter (single Node process deployment).
const rateBuckets = new Map();
function isRateLimited(key, limit, windowMs) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}
function rateLimit(name, limit, windowMs, keyFn) {
  return (req, res, next) => {
    const key = `${name}:${keyFn ? keyFn(req) : clientIp(req)}`;
    if (isRateLimited(key, limit, windowMs)) {
      return res.status(429).json({ error: "Too many requests. Please wait a few minutes and try again." });
    }
    next();
  };
}

// OTP store with expiry + max wrong attempts (blocks brute forcing a 6-digit code).
const OTP_MAX_ATTEMPTS = 5;
function createOtpStore() {
  const map = new Map();
  return {
    issue(key, ttlMs) {
      const otp = generateOtp();
      map.set(key, { otp, expiresAt: Date.now() + ttlMs, attempts: 0 });
      return otp;
    },
    // Returns "ok" | "missing" | "expired" | "locked" | "wrong"
    check(key, code) {
      const rec = map.get(key);
      if (!rec) return "missing";
      if (Date.now() > rec.expiresAt) {
        map.delete(key);
        return "expired";
      }
      if (rec.attempts >= OTP_MAX_ATTEMPTS) {
        map.delete(key);
        return "locked";
      }
      const a = Buffer.from(String(code || "").trim());
      const b = Buffer.from(rec.otp);
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        map.delete(key);
        return "ok";
      }
      rec.attempts += 1;
      if (rec.attempts >= OTP_MAX_ATTEMPTS) map.delete(key);
      return "wrong";
    },
    sweep() {
      const now = Date.now();
      for (const [k, v] of map) if (now > v.expiresAt) map.delete(k);
    },
  };
}
function otpErrorMessage(result) {
  switch (result) {
    case "expired":
      return "Verification code expired. Please request a new code.";
    case "locked":
      return "Too many incorrect attempts. Please request a new code.";
    case "missing":
      return "Verification session expired. Please request a new code.";
    default:
      return "Incorrect verification code.";
  }
}
function logOtpForDev(label, target, otp) {
  // Never print OTP codes in production logs.
  if (!IS_PRODUCTION) {
    console.log(`[DEV ONLY] ${label} OTP for ${target}: ${otp}`);
  } else {
    console.log(`[OTP] ${label} code issued for ${target}`);
  }
}

// Serialises booking creation/reschedule so two requests can't grab the same slot at once.
let slotLockChain = Promise.resolve();
function withSlotLock(fn) {
  const run = slotLockChain.then(fn, fn);
  slotLockChain = run.catch(() => {});
  return run;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer (memory storage, max size 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const app = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Ultra-fast Real-time Live Engine (WebSocket Server)
const wss = new WebSocketServer({ server });
const sseClients = new Set();

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === "PING") {
        ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
      }
    } catch {}
  });

  try {
    ws.send(JSON.stringify({ type: "CONNECTED", message: "Live Engine Connected", timestamp: Date.now() }));
  } catch {}
});

const wsHeartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {}
  });
}, 30000);

wss.on("close", () => {
  clearInterval(wsHeartbeatInterval);
});

// Real-time broadcast helper across both WebSockets and SSE clients
function broadcastLive(type, payload = {}) {
  // Live channels are unauthenticated: only send a minimal "something changed" signal.
  // Clients re-fetch details through authenticated APIs. Never broadcast GPS coordinates,
  // photo URLs, notes or technician IDs here.
  const safe = {};
  ["action", "bookingId", "categoryId", "serviceId"].forEach((k) => {
    if (payload && payload[k] !== undefined) safe[k] = payload[k];
  });
  const dataStr = JSON.stringify({ type, data: safe, timestamp: Date.now() });

  // 1. Broadcast to all active WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(dataStr);
      } catch (err) {
        console.warn("WebSocket broadcast error:", err.message);
      }
    }
  });

  // 2. Broadcast to all active SSE clients
  sseClients.forEach((res) => {
    try {
      res.write(`data: ${dataStr}\n\n`);
    } catch {
      sseClients.delete(res);
    }
  });
}

const ALLOWED_ORIGINS = [
  "https://thedeepcleanerz.in",
  "http://thedeepcleanerz.in",
  "https://www.thedeepcleanerz.in",
  "http://www.thedeepcleanerz.in",
];

function isTrustedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch (e) {
    return false;
  }
  const host = parsed.hostname;
  if (parsed.protocol === "capacitor:" || parsed.protocol === "ionic:") return host === "localhost";
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  // Exact hostname checks only (substring checks let "localhost.evil.com" through)
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
  );
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isTrusted = !origin || isTrustedOrigin(origin);

  if (origin && isTrusted) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  } else if (!origin) {
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// Resolve the active static public directory (supports both local and Hostinger production layouts)
const candidatePublicDirs = [
  path.join(__dirname, "../public"),
  path.join(process.cwd(), "backend", "public"),
  path.join(process.cwd(), "public"),
  path.join(__dirname, "../../backend/public"),
  path.join(__dirname, "../../frontend/dist/client"),
];

const resolvedPublicDir = candidatePublicDirs.find((dir) =>
  fs.existsSync(path.join(dir, "index.html"))
) || path.join(__dirname, "../public");

console.log("[server.js] Resolved static public directory:", resolvedPublicDir);

// Dedicated Service Worker route: Ensure sw.js is NEVER cached and always served with latest version
app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  for (const dir of candidatePublicDirs) {
    const swFile = path.join(dir, "sw.js");
    if (fs.existsSync(swFile)) {
      return res.sendFile(swFile);
    }
  }
  res.status(404).send("// sw.js not found");
});

// Dedicated Web App Manifest route
app.get(["/manifest.json", "/manifest.webmanifest"], (req, res) => {
  res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  for (const dir of candidatePublicDirs) {
    const mfFile = path.join(dir, "manifest.json");
    if (fs.existsSync(mfFile)) {
      return res.sendFile(mfFile);
    }
  }
  res.status(404).send("{}");
});

// Smart Stylesheet Fallback:
// If an incoming request asks for /assets/styles-*.css and the exact hash is not on disk (e.g. after a rebuild),
// seamlessly serve the active compiled styles-*.css file so clients NEVER experience unstyled HTML or 404s!
app.get("/assets/styles-*.css", (req, res, next) => {
  for (const dir of candidatePublicDirs) {
    const assetsDir = path.join(dir, "assets");
    const exactFile = path.join(assetsDir, path.basename(req.path));
    if (fs.existsSync(exactFile)) return res.sendFile(exactFile);
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      const cssFile = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));
      if (cssFile) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.sendFile(path.join(assetsDir, cssFile));
      }
    }
  }
  next();
});

// Smart JS Chunk Fallback:
// If an incoming request asks for /assets/index-*.js or /assets/checkout-*.js with a previous hash,
// seamlessly serve the active compiled file so the user NEVER gets a 503 or blank white screen!
app.get("/assets/index-*.js", (req, res, next) => {
  for (const dir of candidatePublicDirs) {
    const assetsDir = path.join(dir, "assets");
    const exactFile = path.join(assetsDir, path.basename(req.path));
    if (fs.existsSync(exactFile)) return res.sendFile(exactFile);
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      const jsFile = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
      if (jsFile) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.sendFile(path.join(assetsDir, jsFile));
      }
    }
  }
  next();
});

app.get("/assets/checkout-*.js", (req, res, next) => {
  for (const dir of candidatePublicDirs) {
    const assetsDir = path.join(dir, "assets");
    const exactFile = path.join(assetsDir, path.basename(req.path));
    if (fs.existsSync(exactFile)) return res.sendFile(exactFile);
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      const jsFile = files.find((f) => f.startsWith("checkout-") && f.endsWith(".js"));
      if (jsFile) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.sendFile(path.join(assetsDir, jsFile));
      }
    }
  }
  next();
});

// Serve static assets from candidate directories
candidatePublicDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    app.use(express.static(dir, {
      maxAge: "1d",
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html") || filePath.endsWith("sw.js") || filePath.endsWith("manifest.json")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (filePath.includes("/assets/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }));
  }
});

// Google Search Console Ownership Verification Route
app.get(["/google639a710a1902b697.html", "/google639a710a1902b697"], (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send("google-site-verification: google639a710a1902b697.html");
});

// Search Engine robots.txt Route
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /technician
Disallow: /technician/*
Disallow: /api/*

# Host & Sitemap Specifications
Host: https://thedeepcleanerz.in
Sitemap: https://thedeepcleanerz.in/sitemap.xml
`);
});

// Dynamic XML Sitemap for Search Engines (Google, Bing, Yahoo)
app.get("/sitemap.xml", async (req, res) => {
  try {
    const domain = "https://thedeepcleanerz.in";
    const today = new Date().toISOString().split("T")[0];

    // Core static URLs
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${domain}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${domain}/logos/logo.png</image:loc>
      <image:title>TheDeep CleanerZ — Premium Deep Cleaning Services</image:title>
    </image:image>
  </url>
  <url>
    <loc>${domain}/services</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/customized</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;

    // Query categories from database
    try {
      const categories = await db.getCategories();
      if (categories && Array.isArray(categories)) {
        for (const cat of categories) {
          xml += `
  <url>
    <loc>${domain}/services?category=${encodeURIComponent(cat.id)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`;
        }
      }
    } catch (catErr) {
      console.warn("Sitemap: failed to load dynamic categories:", catErr.message);
    }

    // Query services from database
    try {
      const services = await db.getServices();
      if (services && Array.isArray(services)) {
        for (const s of services) {
          xml += `
  <url>
    <loc>${domain}/service-detail?id=${encodeURIComponent(s.id)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    ${s.image ? `<image:image><image:loc>${s.image.startsWith("http") ? s.image : domain + s.image}</image:loc><image:title>${(s.title || "").replace(/[<>&'"]/g, "")}</image:title></image:image>` : ""}
  </url>`;
        }
      }
    } catch (svcErr) {
      console.warn("Sitemap: failed to load dynamic services:", svcErr.message);
    }

    xml += `\n</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(xml);
  } catch (err) {
    console.error("Failed to generate dynamic sitemap.xml:", err);
    res.status(500).send("Error generating sitemap");
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
// Silence express-session MemoryStore warning in dev mode
const sessionStore = new session.MemoryStore();
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 },
  }),
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = {
    success: req.flash("success"),
    error: req.flash("error"),
  };
  next();
});

// Never fall back to a secret that is written in the source code: anyone could forge admin tokens.
// If SESSION_SECRET is missing we generate a random one (tokens then reset on every restart).
const JWT_SECRET = (() => {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16 && s !== "change-this-to-a-long-random-string") return s;
  console.warn(
    "⚠️  SESSION_SECRET is missing/weak. Using a random secret; all logins will reset on restart. Set a long random SESSION_SECRET in backend/.env.",
  );
  return crypto.randomBytes(48).toString("hex");
})();

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
  return `${header}.${data}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, data, signature] = parts;
  try {
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  } else if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
});

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized: Administrator access required." });
}

function requireStaffOrAdmin(req, res, next) {
  if (req.user && (req.user.role === "admin" || req.user.role === "technician")) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized: Staff or administrator access required." });
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  return res.status(401).json({ error: "Unauthorized: Login required." });
}
const authenticate = requireAuth;



// ===== Live Real-Time Server-Sent Events Endpoint =====
app.get("/api/live-events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering
  res.flushHeaders?.();

  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "SSE Live Connected", timestamp: Date.now() })}\n\n`);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

// ===== Public JSON API (for the frontend to consume) =====
app.get("/api/catalog", async (req, res) => {
  try {
    // Ultra-fresh headers: Never cache stale prices in browser or CDN
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    const categories = await db.getCategories();
    const services = await db.getServices();
    res.json({ categories, services });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/seed-db", requireAdmin, async (req, res) => {
  try {
    await db.initDb();
    const categories = await db.getCategories();
    const services = await db.getServices();
    res.json({
      success: true,
      message: "Database checked and catalog initialized successfully.",
      catalog: {
        categoriesCount: categories.length,
        servicesCount: services.length,
      },
    });
  } catch (err) {
    console.error("Database seed error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to initialize catalog database.",
    });
  }
});

// ===================== Razorpay helpers =====================
const MAX_ONLINE_PAYMENT = 500000; // ₹5 lakh safety cap per order
const razorpayOrders = new Map(); // orderId -> { amount (₹), createdAt }

function razorpayAuthHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(String(signature));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Amount (in ₹) of a Razorpay order created by this server. The signature proves that this
// exact order was paid, so the order amount is the amount actually charged.
async function getRazorpayOrderAmount(orderId) {
  const cached = razorpayOrders.get(orderId);
  if (cached) return cached.amount;
  const auth = razorpayAuthHeader();
  if (!auth) throw new Error("Razorpay keys not configured on server");
  const rzpRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: { Authorization: auth },
  });
  if (!rzpRes.ok) throw new Error(`Could not verify payment order (${rzpRes.status})`);
  const data = await rzpRes.json();
  return Math.round(Number(data.amount) / 100);
}

// Verifies {orderId, paymentId, signature}; returns { paymentId, orderId, amount } or throws.
async function verifyRazorpayPayment({ orderId, paymentId, signature }) {
  if (!paymentId || !orderId || !signature) {
    const e = new Error("Incomplete payment details. Please contact support with your payment ID.");
    e.status = 400;
    throw e;
  }
  if (!process.env.RAZORPAY_KEY_SECRET) {
    const e = new Error("Payment verification is not configured on the server.");
    e.status = 500;
    throw e;
  }
  if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
    const e = new Error("Payment verification failed: Invalid payment transaction signature.");
    e.status = 400;
    throw e;
  }
  const amount = await getRazorpayOrderAmount(orderId);
  return { paymentId, orderId, amount };
}

async function refundRazorpayPayment(paymentId, amountRupees, notes = {}) {
  const amt = Math.round(Number(amountRupees) || 0);
  if (!paymentId || amt <= 0) return { ok: false, error: "Nothing to refund" };
  if (String(paymentId).startsWith("OFFLINE-")) return { ok: false, error: "Offline payment" };
  const auth = razorpayAuthHeader();
  if (!auth) return { ok: false, error: "Razorpay keys not configured" };
  try {
    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({ amount: amt * 100, speed: "normal", notes }),
    });
    const data = await rzpRes.json().catch(() => ({}));
    if (rzpRes.ok) {
      console.log(`[Refund] ₹${amt} refunded on ${paymentId}. Refund ID: ${data.id}`);
      return { ok: true, id: data.id };
    }
    console.error(`[Refund] Razorpay error for ${paymentId}:`, data);
    return { ok: false, error: data?.error?.description || `Razorpay error ${rzpRes.status}` };
  } catch (err) {
    console.error(`[Refund] Failed for ${paymentId}:`, err.message);
    return { ok: false, error: err.message };
  }
}

app.post("/api/payment/order", rateLimit("payorder", 30, 10 * 60 * 1000), async (req, res) => {
  try {
    const amount = Math.round(Number(req.body?.amount));
    if (!Number.isFinite(amount) || amount < 1 || amount > MAX_ONLINE_PAYMENT) {
      return res.status(400).json({ error: "Invalid or missing amount" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const auth = razorpayAuthHeader();
    if (!auth) {
      return res.status(500).json({ error: "Razorpay keys not configured on server" });
    }

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({
        amount: amount * 100, // paise
        currency: "INR",
        receipt: `rcpt_${nanoid(8)}`,
      }),
    });

    if (!rzpRes.ok) {
      const errorText = await rzpRes.text();
      throw new Error(`Razorpay API responded with error: ${errorText}`);
    }

    const orderData = await rzpRes.json();
    razorpayOrders.set(orderData.id, { amount, createdAt: Date.now() });
    res.json({
      orderId: orderData.id,
      amount: orderData.amount,
      keyId,
    });
  } catch (err) {
    console.error("Error generating Razorpay Order:", err.message);
    res.status(500).json({ error: "Could not start payment. Please try again." });
  }
});

// Server-side Razorpay signature verification
app.post("/api/payment/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ ok: false, error: "Missing required payment verification parameters." });
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ ok: false, error: "Payment verification credentials not configured on server." });
    }
    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ ok: false, error: "Payment verification failed: Invalid transaction signature." });
    }
    res.json({ ok: true, verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
  } catch (err) {
    console.error("Payment verification error:", err.message);
    res.status(500).json({ ok: false, error: "Payment verification failed." });
  }
});

// Time slot normalization helper (supports 12-hour "10:00 AM", "02:00 PM" and 24-hour "10:00", "14:00")
function normalizeTimeSlot(t) {
  if (!t) return "";
  let str = String(t).trim().toUpperCase();
  // Ranges like "10:00 AM - 12:00 PM" -> start time
  str = str.split(" - ")[0].trim();
  const match12 = str.match(/^0?(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const min = match12[2];
    const period = match12[3];
    if (period === "AM" && hour === 12) hour = 0;
    if (period === "PM" && hour < 12) hour += 12;
    return `${String(hour).padStart(2, "0")}:${min}`;
  }
  const match24 = str.match(/^0?(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    let hour = parseInt(match24[1], 10);
    const min = match24[2];
    return `${String(hour).padStart(2, "0")}:${min}`;
  }
  return str;
}

// Absolute timestamp (ms) of a booking slot, interpreted in IST. NaN if unparseable.
function slotTimestampIST(dateStr, timeStr) {
  const norm = normalizeTimeSlot(timeStr || "10:00");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || "")) || !/^\d{2}:\d{2}$/.test(norm)) return NaN;
  return new Date(`${dateStr}T${norm}:00+05:30`).getTime();
}

function isSlotInPastBackend(slotStr, dateStr, bufferMinutes = 15) {
  if (!slotStr || !dateStr) return false;
  const { dateStr: todayFormatted, minutes } = nowInIST();

  if (dateStr < todayFormatted) return true;
  if (dateStr > todayFormatted) return false;

  const norm = normalizeTimeSlot(slotStr);
  const [slotH, slotM] = norm.split(":").map(Number);
  if (isNaN(slotH) || isNaN(slotM)) return false;

  return slotH * 60 + slotM <= minutes + bufferMinutes;
}

function cleanHolidayReason(blocked) {
  return blocked.reason && !/^admin\s*blocked/i.test(blocked.reason) && !/^blocked/i.test(blocked.reason)
    ? blocked.reason
    : "Holiday";
}

// Returns an error string if the date/time cannot be booked, else null.
async function validateScheduleSlot(date, time, { ignoreBookingId = null, allowBlocked = false } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) || !time) {
    return "Please choose a valid service date and time slot.";
  }
  const todayStr = todayIST();
  if (date < todayStr) {
    return "Selected booking date cannot be in the past. Please choose today or a future date.";
  }
  if (!allowBlocked) {
    const blocked = await db.isDateBlocked(date);
    if (blocked) {
      const reason = cleanHolidayReason(blocked);
      return date === todayStr
        ? `Today is a Holiday (${reason}). Bookings are unavailable today. Please choose an upcoming available date.`
        : `Selected date (${date}) is a Holiday (${reason}). Please choose another date.`;
    }
  }
  if (isSlotInPastBackend(time, date, 0)) {
    return `Selected time slot (${time} on ${date}) has already passed. Please choose an upcoming time slot or a future date.`;
  }
  const normTime = normalizeTimeSlot(time);
  const allBookings = await db.getBookings();
  const conflict = (allBookings || []).find((b) => {
    if (ignoreBookingId && b.id === ignoreBookingId) return false;
    if (b.jobStatus === "Cancelled") return false;
    const s = b.schedule || {};
    return s.date === date && normalizeTimeSlot(s.time) === normTime;
  });
  if (conflict) {
    return `The slot (${time} on ${date}) is already booked by another customer. Only 1 booking is allowed per slot. Please choose another time slot.`;
  }
  return null;
}

// ===================== Server-side pricing =====================
function slugifyName(s) {
  return String(s || "").toLowerCase().trim().replace(/\s+/g, "-");
}

// Minimum (catalog) price of a cart item. The website may add a travel surcharge on top,
// so client prices are accepted only if they are >= this floor.
function resolveItemFloor(item, catalogEntries) {
  const id = String(item?.id || "");
  let best = null;
  for (const s of catalogEntries) {
    if (!s || !s.id) continue;
    if (id === s.id || id.startsWith(`${s.id}-`)) {
      if (!best || String(s.id).length > String(best.id).length) best = s;
    }
  }
  if (!best) return { known: false, floor: 0, paymentType: "custom_quote" };
  const paymentType = best.paymentType || "full";
  if (paymentType === "custom_quote") return { known: true, floor: 0, paymentType };

  const plans = Array.isArray(best.plans) ? best.plans.filter(Boolean) : [];
  const positive = [Number(best.price) || 0, ...plans.map((p) => Number(p.price) || 0)].filter((p) => p > 0);
  const cheapest = positive.length ? Math.min(...positive) : 0;
  const suffix = id === best.id ? "" : id.slice(String(best.id).length + 1);

  let floor;
  if (suffix) {
    const plan = plans.find(
      (p) =>
        p.name === suffix ||
        slugifyName(p.name) === slugifyName(suffix) ||
        String(p.name).toLowerCase() === suffix.toLowerCase(),
    );
    floor = plan ? Number(plan.price) || 0 : cheapest;
  } else {
    floor = Number(best.price) || cheapest;
  }
  return { known: true, floor, paymentType };
}

async function priceCart(items) {
  const [services, customized] = await Promise.all([db.getServices(), db.getCustomizedServices()]);
  const catalogEntries = [...(services || []), ...(customized || [])];
  let subtotal = 0;
  let allPayLater = true;
  const lines = [];
  for (const it of items) {
    const qty = Math.floor(Number(it?.qty) || 1);
    if (qty < 1 || qty > 50) {
      const e = new Error("Invalid quantity in cart.");
      e.status = 400;
      throw e;
    }
    const { floor, paymentType } = resolveItemFloor(it, catalogEntries);
    const clientPrice = Number(it?.price);
    if (Number.isFinite(clientPrice) && clientPrice < floor) {
      const e = new Error(
        `The price of "${String(it?.title || "a service").slice(0, 80)}" has been updated. Please remove it from your cart and add it again.`,
      );
      e.status = 409;
      throw e;
    }
    const unitPrice = Number.isFinite(clientPrice) ? Math.max(clientPrice, floor) : floor;
    subtotal += unitPrice * qty;
    if (!(paymentType === "custom_quote" || paymentType === "free_advance" || unitPrice === 0)) {
      allPayLater = false;
    }
    lines.push({
      id: String(it?.id || "").slice(0, 200),
      title: String(it?.title || "Cleaning Service").slice(0, 200),
      price: unitPrice,
      qty,
      img: typeof it?.img === "string" ? it.img.slice(0, 1000) : undefined,
      plan: it?.plan ? String(it.plan).slice(0, 100) : undefined,
    });
  }
  return { subtotal: Math.round(subtotal), allPayLater, lines };
}

function paymentStatusFor(total, paid) {
  if (paid <= 0) return null;
  if (paid >= total) return "Paid In Full";
  return `Paid Advance (₹${paid}) - Remaining: ₹${Math.max(0, total - paid)}`;
}

// Fetch occupied/booked time slots for a given date (to enforce 1 booking per slot)
app.get("/api/bookings/booked-slots", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.json({ date: "", bookedSlots: [], normalizedSlots: [] });
    }
    const allBookings = await db.getBookings();
    const bookedSlots = (allBookings || [])
      .filter((b) => b.jobStatus !== "Cancelled" && b.schedule && b.schedule.date === date && b.schedule.time)
      .map((b) => b.schedule.time);

    res.json({
      date,
      bookedSlots,
      normalizedSlots: bookedSlots.map((t) => normalizeTimeSlot(t)),
    });
  } catch (err) {
    console.error("Error fetching booked slots:", err);
    res.status(500).json({ error: "Could not load booked slots." });
  }
});

app.post("/api/bookings", rateLimit("booking", 20, 10 * 60 * 1000), async (req, res) => {
  const body = req.body || {};
  const isAdmin = !!(req.user && req.user.role === "admin");
  const paymentId = body.paymentId || body.razorpayPaymentId || null;
  let verifiedPayment = null;

  // If the customer was already charged but the booking can't be saved, refund automatically.
  const reject = async (status, message) => {
    if (verifiedPayment) {
      const r = await refundRazorpayPayment(verifiedPayment.paymentId, verifiedPayment.amount, {
        reason: "booking_rejected",
      });
      const suffix = r.ok
        ? ` Your payment of ₹${verifiedPayment.amount} has been refunded automatically (it reaches your account in 5-7 working days).`
        : ` Please contact support with payment ID ${verifiedPayment.paymentId} for a refund.`;
      console.error(`[Booking] Rejected after payment ${verifiedPayment.paymentId}: ${message} (refund ok=${r.ok})`);
      return res.status(status).json({ error: message + suffix, refunded: r.ok });
    }
    return res.status(status).json({ error: message });
  };

  try {
    // 0. Reject forged payment details immediately (cheap, no database needed)
    const hasPaymentFields = !!(paymentId || body.razorpayOrderId || body.razorpaySignature);
    if (!isAdmin && hasPaymentFields && !verifyRazorpaySignature(body.razorpayOrderId, paymentId, body.razorpaySignature)) {
      return res.status(400).json({ error: "Payment verification failed: Invalid payment transaction signature." });
    }

    // 1. Idempotency: if this payment was already recorded, return that booking
    //    (a retry after a network error must not be rejected as a "slot conflict").
    if (paymentId && !isAdmin) {
      const existing = await db.findBookingByPaymentId(paymentId);
      if (existing) return res.json({ ok: true, booking: existing, duplicate: true });
    }

    // 2. Verify online payment before anything else (so later failures can be refunded).
    if (!isAdmin && (paymentId || body.razorpayOrderId || body.razorpaySignature)) {
      try {
        verifiedPayment = await verifyRazorpayPayment({
          orderId: body.razorpayOrderId,
          paymentId,
          signature: body.razorpaySignature,
        });
      } catch (e) {
        return res.status(e.status || 500).json({ error: e.message });
      }
    }

    return await withSlotLock(async () => {
      // 3. Customer details
      const customer = safeParse(body.customer, {}) || {};
      const name = String(customer.name || "").trim();
      if (name.length < 2 || name.length > 80) {
        return reject(400, "Customer name must be between 2 and 80 characters.");
      }
      const phone = normalizeIndianPhone(customer.phone);
      if (!phone) {
        return reject(400, "A valid 10-digit Indian mobile number is required.");
      }
      let email = String(customer.email || "").trim().toLowerCase();
      if (email && !isValidEmail(email)) {
        return reject(400, "Please enter a valid email address.");
      }

      // 4. Items
      const rawItems = safeParse(body.items, []);
      if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 30) {
        return reject(400, "At least one cleaning service item is required.");
      }

      // 5. Schedule (IST), holidays, past slots, double booking
      const schedule = safeParse(body.schedule, {}) || {};
      const date = String(schedule.date || "");
      const time = String(schedule.time || "");
      const slotError = await validateScheduleSlot(date, time, {
        allowBlocked: isAdmin && !!body.overrideBlockedDate,
      });
      if (slotError) return reject(400, slotError);

      // 6. Pricing
      let lines;
      let subtotal;
      let allPayLater;
      if (isAdmin) {
        // Admin offline bookings: admin sets the price manually
        lines = rawItems.map((it) => ({
          id: String(it?.id || "").slice(0, 200),
          title: String(it?.title || "Cleaning Service").slice(0, 200),
          price: Math.max(0, Number(it?.price) || 0),
          qty: Math.max(1, Math.floor(Number(it?.qty) || 1)),
          plan: it?.plan ? String(it.plan).slice(0, 100) : undefined,
        }));
        subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
        allPayLater = subtotal === 0;
      } else {
        try {
          ({ lines, subtotal, allPayLater } = await priceCart(rawItems));
        } catch (e) {
          return reject(e.status || 400, e.message);
        }
      }

      // 7. Coupon (validated on the server, once per customer)
      let couponCode = null;
      let discount = 0;
      if (body.coupon && String(body.coupon).trim()) {
        couponCode = String(body.coupon).trim().toUpperCase();
        try {
          const c = await db.validateCoupon(couponCode, subtotal);
          discount = Math.min(Number(c.discount) || 0, subtotal);
        } catch (e) {
          return reject(400, e.message);
        }
        if (!isAdmin) {
          const all = await db.getBookings();
          const usedBefore = (all || []).some(
            (b) =>
              b.jobStatus !== "Cancelled" &&
              String(b.coupon || "").toUpperCase() === couponCode &&
              normalizeIndianPhone(b.customer?.phone) === phone,
          );
          if (usedBefore) {
            return reject(400, `Coupon ${couponCode} has already been used on this mobile number.`);
          }
        }
      } else if (isAdmin) {
        discount = Math.max(0, Number(body.discount) || 0);
      }

      // 8. Wallet credit (deducted atomically on the server, only for the logged-in customer)
      const walletRequested = Math.max(0, Math.floor(Number(body.walletUsed) || 0));
      let walletUserId = null;
      if (walletRequested > 0) {
        if (!req.user || req.user.role !== "user" || !req.user.id) {
          return reject(401, "Please log in to use wallet credit.");
        }
        const u = await db.getUserById(req.user.id);
        if (!u || (Number(u.wallet_balance) || 0) < walletRequested) {
          return reject(400, "Your wallet balance has changed. Please reopen checkout and try again.");
        }
        walletUserId = u.id;
      }

      // 9. Total: the client may add a platform fee / travel charge, but never pay less
      const minTotal = Math.max(0, subtotal - discount - walletRequested);
      const clientTotal = Math.round(Number(body.total));
      if (!isAdmin && (!Number.isFinite(clientTotal) || clientTotal < minTotal)) {
        return reject(409, "Your cart total is out of date. Please refresh the page and try again.");
      }
      const total = isAdmin
        ? Math.max(0, Math.round(Number(body.total) || subtotal - discount))
        : clientTotal;

      // 10. Payment status is decided by the server, never trusted from the browser
      let paymentStatus;
      let amountPaid = 0;
      let storedPaymentId = null;
      if (isAdmin) {
        paymentStatus = String(body.paymentStatus || "Pending").slice(0, 100);
        storedPaymentId = paymentId ? String(paymentId).slice(0, 255) : null;
      } else if (verifiedPayment) {
        amountPaid = verifiedPayment.amount;
        paymentStatus = paymentStatusFor(total, amountPaid);
        storedPaymentId = verifiedPayment.paymentId;
      } else {
        paymentStatus = allPayLater || total === 0 ? "Free Advance (Pay after Service)" : "Pending Deposit (COD)";
      }

      // 11. Link to the logged-in customer (never trust a userId from the body)
      let userId = null;
      if (req.user && req.user.role === "user") userId = req.user.id;
      else if (isAdmin && body.userId) userId = String(body.userId);
      if (!userId) {
        const existingUser = await db.getUserByPhone(phone);
        if (existingUser) userId = existingUser.id;
      }
      if (!email || email.endsWith("@thedeepcleanerz.com")) {
        const owner = userId ? await db.getUserById(userId) : null;
        if (owner && owner.email && !owner.email.endsWith("@thedeepcleanerz.com")) email = owner.email;
      }

      if (walletUserId) {
        const ok = await db.deductWalletAtomic(walletUserId, walletRequested);
        if (!ok) return reject(400, "Your wallet balance has changed. Please reopen checkout and try again.");
      }

      const cleanCustomer = {
        name,
        phone,
        email: email || `${phone}@thedeepcleanerz.com`,
        address: String(customer.address || "").slice(0, 500),
        landmark: String(customer.landmark || "").slice(0, 200),
        city: String(customer.city || "Guntur").slice(0, 100),
        pincode: String(customer.pincode || "").replace(/\D/g, "").slice(0, 6),
        gpsCoords: customer.gpsCoords ? String(customer.gpsCoords).slice(0, 100) : "",
        mapsLink: customer.mapsLink ? String(customer.mapsLink).slice(0, 500) : "",
        houseType: customer.houseType ? String(customer.houseType).slice(0, 100) : undefined,
        houseSize: customer.houseSize ? String(customer.houseSize).slice(0, 100) : undefined,
        avoidCalling: !!customer.avoidCalling,
        bookingSource: isAdmin && customer.bookingSource ? String(customer.bookingSource).slice(0, 100) : undefined,
      };

      const booking = {
        id: nanoid(10),
        createdAt: new Date().toISOString(),
        customer: cleanCustomer,
        schedule: { date, time },
        notes: String(body.notes || "").slice(0, 2000),
        coupon: couponCode,
        discount: discount + walletRequested,
        total,
        items: lines,
        paymentStatus,
        paymentId: storedPaymentId,
        userId,
        amountPaid,
      };

      try {
        await db.addBooking(booking);
      } catch (insertErr) {
        if (walletUserId) await db.creditWalletAtomic(walletUserId, walletRequested).catch(() => {});
        throw insertErr;
      }

      if (isAdmin && body.technicianId) {
        try {
          await db.updateBookingTechnician(booking.id, body.technicianId);
        } catch (tErr) {
          console.warn("Could not set technicianId during booking creation:", tErr.message);
        }
      }

      sendBookingEmails(booking).catch((err) =>
        console.error("[Mailer] Booking confirmation emails failed to send:", err),
      );
      sendAdminWhatsAppAlert(booking).catch((err) =>
        console.error("[WhatsApp] Booking WhatsApp alert failed to send:", err),
      );
      broadcastLive("BOOKINGS_UPDATED", { bookingId: booking.id, action: "create" });
      return res.json({ ok: true, booking });
    });
  } catch (err) {
    console.error("Booking creation error:", err);
    return reject(500, "Could not save your booking. Please try again.");
  }
});

app.post("/api/whatsapp/test", requireAdmin, async (req, res) => {
  try {
    const { phone, apiKey } = req.body;
    const result = await sendTestWhatsAppAlert(phone, apiKey);
    res.json(result);
  } catch (err) {
    console.error("[WhatsApp Test Error]:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/locations", rateLimit("locations", 30, 10 * 60 * 1000), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: "Latitude and longitude are required." });
    }
    // Only attach a user id that comes from a verified token
    const userId = req.user && req.user.role === "user" ? req.user.id : null;
    await db.saveVisitorLocation({ userId, latitude: lat, longitude: lng });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error saving visitor location:", err);
    res.status(500).json({ error: "Could not save location." });
  }
});

// ===== Referral code helpers =====
async function generateUniqueReferralCode(name) {
  const cleanName = String(name || "").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "USER";
  for (let i = 0; i < 10; i++) {
    const code = `CLEAN-${cleanName}${crypto.randomInt(1000, 10000)}`;
    if (!(await db.isReferralCodeTaken(code))) return code;
  }
  return `CLEAN-${cleanName}${nanoid(6).toUpperCase()}`;
}

function parseAddresses(value) {
  const parsed = safeParse(value, []);
  return Array.isArray(parsed) ? parsed : [];
}

function publicUser(user, roleOverride) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: roleOverride || "user",
    referralCode: user.referral_code || user.referralCode || null,
    walletBalance: Number(user.wallet_balance || user.walletBalance || 0),
    addresses: parseAddresses(user.addresses),
  };
}

function isDefaultAdminEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return e === DEFAULT_ADMIN_EMAIL || e === "admin@thedeepcleanerz.com" || e === "admin";
}

// ===== User Authentication Endpoints =====
app.post("/api/auth/register", rateLimit("register", 10, 60 * 60 * 1000), async (req, res) => {
  try {
    const { name, phone, email, password, referralCode } = req.body || {};
    const cleanName = String(name || "").trim();
    const cleanPhone = normalizeIndianPhone(phone);
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanName || !phone || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({ error: "Please enter your full name." });
    }
    if (!cleanPhone) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    if (await db.getUserByEmail(cleanEmail)) {
      return res.status(400).json({ error: "User with this email already registered." });
    }
    if (await db.getUserByPhone(cleanPhone)) {
      return res.status(400).json({ error: "User with this phone number already registered." });
    }

    const hashedPassword = bcrypt.hashSync(String(password), 10);
    const userRefCode = await generateUniqueReferralCode(cleanName);
    const userId = "usr_" + nanoid(10);

    await db.createUser({
      id: userId,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      password: hashedPassword,
      referral_code: userRefCode,
      wallet_balance: 0,
    });

    // Referral: remember who referred this user. Both rewards are credited only after the
    // new user's first COMPLETED booking, so fake sign-ups can't farm wallet credit.
    let referralApplied = false;
    if (referralCode && String(referralCode).trim()) {
      try {
        const sysSettings = await db.getSettings();
        const refEnabled = sysSettings.referral_enabled !== "0";
        const referrer = await db.getUserByReferralCode(String(referralCode).trim());
        const selfReferral =
          referrer &&
          (normalizeIndianPhone(referrer.phone) === cleanPhone ||
            String(referrer.email || "").toLowerCase() === cleanEmail);
        if (referrer && refEnabled && !selfReferral) {
          await db.setUserReferredBy(userId, referrer.id);
          referralApplied = true;
        }
      } catch (refErr) {
        console.warn("Referral link failed:", refErr.message);
      }
    }

    const token = signToken({ id: userId, role: "user", email: cleanEmail, phone: cleanPhone, name: cleanName });

    res.json({
      ok: true,
      token,
      referralApplied,
      message: referralApplied
        ? "Registration successful! Referral bonus will be added after your first completed service."
        : "Registration successful!",
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: "user",
        referralCode: userRefCode,
        walletBalance: 0,
        addresses: [],
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

const forgotPasswordOtps = createOtpStore();

// 1. Send Password Recovery OTP
app.post(
  "/api/auth/forgot-password/send-otp",
  rateLimit("forgot-ip", 10, 60 * 60 * 1000),
  rateLimit("forgot-email", 3, 15 * 60 * 1000, (req) => String(req.body?.email || "").trim().toLowerCase()),
  async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }
      const normEmail = String(email).trim().toLowerCase();
      const genericResponse = {
        ok: true,
        message: "If an account exists for this email, a password reset code has been sent.",
      };

      const user = await db.getUserByEmail(normEmail).catch(() => null);
      // Generic response either way (does not reveal which emails are registered)
      if (!user || !user.email || user.email.endsWith("@thedeepcleanerz.com")) {
        return res.json(genericResponse);
      }

      const otp = forgotPasswordOtps.issue(normEmail, 10 * 60 * 1000);
      logOtpForDev("Forgot password", normEmail, otp);
      try {
        await require("./utils/mailer").sendForgotPasswordOtpEmail(user.email, otp);
      } catch (mailErr) {
        console.warn("[Forgot Password OTP] Mailer warning:", mailErr.message);
      }
      return res.json(genericResponse);
    } catch (err) {
      console.error("Forgot password send-otp error:", err);
      return res.status(500).json({ error: "Could not send reset code." });
    }
  },
);

// 2. Verify OTP & Reset Password
app.post("/api/auth/forgot-password/reset", rateLimit("forgot-reset", 20, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP, and new password are required." });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    const normEmail = String(email).trim().toLowerCase();
    const result = forgotPasswordOtps.check(normEmail, otp);
    if (result !== "ok") {
      return res.status(400).json({ error: otpErrorMessage(result) });
    }

    const user = await db.getUserByEmail(normEmail);
    if (!user) {
      return res.status(400).json({ error: "Account not found." });
    }
    const updated = await db.updateUserPassword(user.id, bcrypt.hashSync(String(newPassword), 10));
    if (!updated) {
      return res.status(500).json({ error: "Could not update password. Please try again." });
    }
    return res.json({ ok: true, message: "Password updated successfully! Please login." });
  } catch (err) {
    console.error("Forgot password reset error:", err);
    return res.status(500).json({ error: "Could not reset password. Please try again." });
  }
});

// 3. Change Password (Inside Profile - Logged In)
app.post("/api/auth/change-password", requireAuth, rateLimit("change-pw", 10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }
    if (req.body.userId && req.body.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only change your own password." });
    }

    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // OTP-created accounts have no password yet; they may set one without the old password.
    if (user.password) {
      let valid = false;
      try {
        valid = bcrypt.compareSync(String(currentPassword || ""), user.password);
      } catch (e) {
        valid = false;
      }
      if (!valid) {
        return res.status(400).json({ error: "Incorrect current password." });
      }
    }

    await db.updateUserPassword(user.id, bcrypt.hashSync(String(newPassword), 10));
    return res.json({ ok: true, message: "Password changed successfully!" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "Could not change password." });
  }
});

const adminOtps = createOtpStore();

async function issueAdminOtp(targetEmail, phone) {
  const otp = adminOtps.issue(targetEmail, 10 * 60 * 1000);
  logOtpForDev("Admin login", targetEmail, otp);
  let emailSent = false;
  try {
    const mailRes = await require("./utils/mailer").sendAdminOtpEmail(targetEmail, otp);
    emailSent = !!(mailRes && mailRes.success);
  } catch (mailErr) {
    console.warn("[Admin OTP] Mailer error:", mailErr.message);
  }
  try {
    await require("./utils/whatsapp").sendAdminOtpWhatsApp(otp, phone || process.env.ADMIN_WHATSAPP_PHONE);
  } catch (waErr) {}
  return emailSent;
}

// Resolves an admin login identifier to { email, user } if it belongs to an administrator.
async function resolveAdminIdentity(identifier) {
  const norm = String(identifier || "").trim().toLowerCase();
  const email = norm === "admin" ? DEFAULT_ADMIN_EMAIL : norm;
  const user = await db.getUserByEmail(email).catch(() => null);
  if ((user && user.role === "admin") || isDefaultAdminEmail(email)) {
    return { email, user };
  }
  return null;
}

app.post(
  "/api/auth/login",
  rateLimit("login-ip", 30, 15 * 60 * 1000),
  rateLimit("login-id", 10, 15 * 60 * 1000, (req) => String(req.body?.emailOrPhone || "").trim().toLowerCase()),
  async (req, res) => {
    try {
      const { emailOrPhone, password } = req.body || {};
      if (!emailOrPhone || !password) {
        return res.status(400).json({ error: "Email/phone and password are required." });
      }

      const ident = String(emailOrPhone).trim();
      const normIdent = ident.toLowerCase();

      let user = null;
      try {
        if (normIdent === "admin") {
          user = await db.getUserByEmail(DEFAULT_ADMIN_EMAIL);
        } else if (ident.includes("@")) {
          user = await db.getUserByEmail(normIdent);
        } else {
          user = await db.getUserByPhone(ident);
        }
      } catch (dbErr) {
        console.warn("[Auth Login] DB lookup warning:", dbErr.message);
      }

      // Bootstrap admin (no admin row in DB yet): only via the bcrypt hash configured in .env
      if (!user && isDefaultAdminEmail(normIdent) && process.env.ADMIN_PASSWORD_HASH) {
        let ok = false;
        try {
          ok = bcrypt.compareSync(String(password), process.env.ADMIN_PASSWORD_HASH);
        } catch (e) {
          ok = false;
        }
        if (ok) {
          user = {
            id: "admin-root",
            name: "Administrator",
            email: DEFAULT_ADMIN_EMAIL,
            phone: process.env.ADMIN_WHATSAPP_PHONE || "",
            role: "admin",
            __bootstrapVerified: true,
          };
        }
      }

      if (user) {
        let valid = !!user.__bootstrapVerified;
        if (!valid && user.password) {
          try {
            valid = bcrypt.compareSync(String(password), user.password);
          } catch (bErr) {
            valid = false;
          }
        }

        if (valid) {
          const isAdmin = user.role === "admin" || isDefaultAdminEmail(user.email);
          if (isAdmin) {
            const targetEmail = String(user.email || DEFAULT_ADMIN_EMAIL).toLowerCase();

            if (process.env.ADMIN_REQUIRE_OTP === "false") {
              const adminUser = {
                id: user.id || "admin-root",
                name: user.name || "Administrator",
                email: targetEmail,
                phone: user.phone || "",
                role: "admin",
              };
              return res.json({ ok: true, token: signToken(adminUser), requiresOtp: false, role: "admin", user: adminUser });
            }

            const emailSent = await issueAdminOtp(targetEmail, user.phone);
            return res.json({
              ok: true,
              requiresOtp: true,
              email: targetEmail,
              role: "admin",
              emailSent,
              message: emailSent
                ? "Verification code sent to your email."
                : "Verification code generated. Please check your email inbox.",
            });
          }

          // Regular user login success
          if (!user.referral_code) {
            try {
              user.referral_code = await generateUniqueReferralCode(user.name);
              await db.query("UPDATE users SET referral_code = ? WHERE id = ?", [user.referral_code, user.id]);
            } catch (e) {}
          }
          const token = signToken({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: "user" });
          return res.json({ ok: true, token, role: "user", user: publicUser(user, "user") });
        }
      }

      // Technician/Staff login fallback
      let technician = null;
      try {
        technician = ident.includes("@")
          ? await db.getTechnicianByEmail(normIdent)
          : await db.getTechnicianByPhone(ident);
      } catch (tDbErr) {
        console.warn("[Auth Login] Technician DB lookup warning:", tDbErr.message);
      }

      if (technician && technician.password) {
        let validTech = false;
        try {
          validTech = bcrypt.compareSync(String(password), technician.password);
        } catch (bErr) {
          validTech = false;
        }
        if (validTech) {
          if (String(technician.status || "Active").toLowerCase() === "inactive") {
            return res.status(403).json({ error: "Your staff account is inactive. Please contact the admin." });
          }
          const techUser = {
            id: technician.id,
            name: technician.name,
            email: technician.email,
            phone: technician.phone,
            specialty: technician.specialty,
            status: technician.status,
            role: "technician",
          };
          const token = signToken({
            id: technician.id,
            name: technician.name,
            email: technician.email,
            phone: technician.phone,
            role: "technician",
          });
          return res.json({ ok: true, token, role: "technician", user: techUser });
        }
      }

      return res.status(400).json({ error: "Invalid credentials." });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  },
);

// Send / resend admin OTP (email OTP login for administrators)
app.post(
  "/api/auth/admin-otp/send",
  rateLimit("admin-otp-ip", 10, 15 * 60 * 1000),
  rateLimit("admin-otp-email", 3, 10 * 60 * 1000, (req) => String(req.body?.email || "").trim().toLowerCase()),
  async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }
      const identity = await resolveAdminIdentity(email);
      if (!identity) {
        return res.status(403).json({ error: "Unauthorized email." });
      }
      const emailSent = await issueAdminOtp(identity.email, identity.user?.phone);
      res.json({
        ok: true,
        emailSent,
        message: emailSent
          ? "Verification code sent to your email."
          : "Verification code generated. Please check your email inbox.",
      });
    } catch (err) {
      console.error("Send OTP error:", err);
      res.status(500).json({ error: "Could not send verification code." });
    }
  },
);

// Verify Admin OTP Endpoint (no master codes: only the code that was emailed is accepted)
app.post("/api/auth/admin-otp/verify", rateLimit("admin-otp-verify", 20, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and verification code are required." });
    }
    const identity = await resolveAdminIdentity(email);
    if (!identity) {
      return res.status(400).json({ error: "Incorrect verification code. Please check your email inbox." });
    }
    const result = adminOtps.check(identity.email, otp);
    if (result !== "ok") {
      return res.status(400).json({
        error: result === "wrong" ? "Incorrect verification code. Please check your email inbox." : otpErrorMessage(result),
      });
    }

    const adminUser = {
      id: identity.user ? identity.user.id : "admin-root",
      name: identity.user ? identity.user.name : "Administrator",
      email: identity.email,
      role: "admin",
    };
    res.json({ ok: true, token: signToken(adminUser), role: "admin", user: adminUser });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Could not verify code." });
  }
});

const mobileOtps = createOtpStore();

// Verifies a Firebase phone-auth ID token via Google's Identity Toolkit and returns the
// verified 10-digit phone, or "" if invalid / not configured.
// The Firebase Web API key is public (it ships in the website bundle). Prefer backend .env,
// otherwise fall back to the frontend's .env so phone login works without extra setup.
const FIREBASE_WEB_API_KEY = (() => {
  if (process.env.FIREBASE_API_KEY) return process.env.FIREBASE_API_KEY;
  if (process.env.VITE_FIREBASE_API_KEY) return process.env.VITE_FIREBASE_API_KEY;
  for (const p of [path.join(__dirname, "..", "..", "frontend", ".env"), path.join(process.cwd(), "frontend", ".env")]) {
    try {
      const m = fs.readFileSync(p, "utf8").match(/^\s*VITE_FIREBASE_API_KEY\s*=\s*["']?([^"'\r\n]+)/m);
      if (m && m[1] && m[1] !== "YOUR_API_KEY") return m[1].trim();
    } catch (e) {}
  }
  console.warn("⚠️  FIREBASE_API_KEY not set: Firebase SMS logins cannot be verified. Add it to backend/.env.");
  return "";
})();

async function verifyFirebasePhoneToken(idToken) {
  const apiKey = FIREBASE_WEB_API_KEY;
  if (!apiKey || !idToken) return "";
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!r.ok) return "";
    const data = await r.json();
    const phoneNumber = data?.users?.[0]?.phoneNumber || "";
    return normalizeIndianPhone(phoneNumber);
  } catch (e) {
    console.warn("Firebase token verification failed:", e.message);
    return "";
  }
}

// Send Mobile OTP Endpoint during booking checkout
app.post(
  "/api/auth/mobile-otp/send",
  rateLimit("mobile-otp-ip", 10, 15 * 60 * 1000),
  rateLimit("mobile-otp-phone", 3, 10 * 60 * 1000, (req) => normalizeIndianPhone(req.body?.phone) || "invalid"),
  async (req, res) => {
    try {
      const { phone, email } = req.body || {};
      if (!phone) {
        return res.status(400).json({ error: "Mobile number is required." });
      }
      const cleanPhone = normalizeIndianPhone(phone);
      if (!cleanPhone) {
        return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
      }

      const otp = mobileOtps.issue(cleanPhone, 5 * 60 * 1000);
      let smsSent = false;
      let viaProvider = "none";

      // 1. Fast2SMS
      const fast2smsKey = process.env.FAST2SMS_API_KEY;
      if (fast2smsKey) {
        try {
          const smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
            method: "POST",
            headers: { authorization: fast2smsKey, "Content-Type": "application/json" },
            body: JSON.stringify({ route: "otp", variables_values: otp, numbers: cleanPhone }),
          });
          const data = await smsRes.json().catch(() => null);
          if (smsRes.ok && data?.return === true) {
            smsSent = true;
            viaProvider = "Fast2SMS";
          }
        } catch (err) {
          console.error("Fast2SMS API failed:", err.message);
        }
      }

      // 2. Twilio
      if (!smsSent && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
          const twilio = require("twilio");
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.messages.create({
            body: `Your TheDeep CleanerZ verification code is: ${otp}`,
            from: process.env.TWILIO_FROM_NUMBER,
            to: `+91${cleanPhone}`,
          });
          smsSent = true;
          viaProvider = "Twilio";
        } catch (err) {
          console.error("Twilio API failed:", err.message);
        }
      }

      // 3. Email fallback. To prevent account takeover, the code is emailed ONLY to:
      //    - the real email already registered on this phone's account, or
      //    - the typed email, if this phone has no account and no previous bookings.
      if (!smsSent) {
        logOtpForDev("Mobile", cleanPhone, otp);
        let fallbackEmail = "";
        const existingUser = await db.getUserByPhone(cleanPhone).catch(() => null);
        if (existingUser) {
          if (existingUser.email && !existingUser.email.endsWith("@thedeepcleanerz.com")) {
            fallbackEmail = existingUser.email;
          }
        } else if (email && isValidEmail(email)) {
          const all = await db.getBookings().catch(() => []);
          const phoneHasHistory = (all || []).some((b) => normalizeIndianPhone(b.customer?.phone) === cleanPhone);
          if (!phoneHasHistory) fallbackEmail = String(email).trim().toLowerCase();
        }
        if (fallbackEmail) {
          try {
            await require("./utils/mailer").sendMobileOtpEmail(fallbackEmail, otp, cleanPhone);
            viaProvider = "email";
          } catch (err) {
            console.error("Fallback Email failed:", err.message);
          }
        }
      }

      return res.json({
        ok: true,
        smsSent,
        viaProvider,
        message: smsSent
          ? `Verification code sent to +91 ${cleanPhone} via ${viaProvider}.`
          : viaProvider === "email"
            ? "Verification code sent to your registered email address."
            : `Verification code generated for +91 ${cleanPhone}. Please verify.`,
      });
    } catch (err) {
      console.error("Send Mobile OTP error:", err);
      res.status(500).json({ error: "Could not send verification code." });
    }
  },
);

// Verify Mobile OTP (or a Firebase phone-auth ID token) and log the customer in
app.post("/api/auth/mobile-otp/verify", rateLimit("mobile-otp-verify", 30, 15 * 60 * 1000), async (req, res) => {
  try {
    const { phone, otp, firebaseIdToken, name, email, address, landmark, city, pincode, gpsCoords, mapsLink } =
      req.body || {};
    const cleanPhone = normalizeIndianPhone(phone);
    if (!cleanPhone || (!otp && !firebaseIdToken)) {
      return res.status(400).json({ error: "Mobile number and verification code are required." });
    }

    if (firebaseIdToken) {
      const verifiedPhone = await verifyFirebasePhoneToken(firebaseIdToken);
      if (!verifiedPhone || verifiedPhone !== cleanPhone) {
        return res.status(400).json({ error: "Phone verification failed. Please request a new code." });
      }
    } else {
      const result = mobileOtps.check(cleanPhone, otp);
      if (result !== "ok") {
        return res.status(400).json({
          error: result === "wrong" ? "Incorrect verification code. Please check your inputs." : otpErrorMessage(result),
        });
      }
    }

    let user = await db.getUserByPhone(cleanPhone);
    const providedName = String(name || "").trim().slice(0, 80);
    const providedEmail = String(email || "").trim().toLowerCase();
    const usableEmail =
      providedEmail && isValidEmail(providedEmail) && !providedEmail.endsWith("@thedeepcleanerz.com")
        ? providedEmail
        : "";

    const buildAddress = (isDefault) => ({
      id: `addr-${Date.now()}`,
      type: "Home",
      address: String(address).trim().slice(0, 500),
      landmark: landmark ? String(landmark).trim().slice(0, 200) : "",
      city: city ? String(city).trim().slice(0, 100) : "Guntur",
      pincode: pincode ? String(pincode).replace(/\D/g, "").slice(0, 6) : "",
      gpsCoords: gpsCoords ? String(gpsCoords).slice(0, 100) : "",
      mapsLink: mapsLink ? String(mapsLink).slice(0, 500) : "",
      isDefault,
    });

    if (user) {
      const updates = {};
      if (providedName && (!user.name || user.name === "Customer")) {
        updates.name = providedName;
      }
      // Only fill in a missing email; the email must not belong to another account
      if (usableEmail && (!user.email || user.email.endsWith("@thedeepcleanerz.com"))) {
        const owner = await db.getUserByEmail(usableEmail);
        if (!owner) updates.email = usableEmail;
      }
      if (Object.keys(updates).length > 0) {
        try {
          await db.updateUserProfile(user.id, updates);
          Object.assign(user, updates); // only after the DB write succeeded
        } catch (uErr) {
          console.warn("Could not update user profile fields:", uErr.message);
        }
      }

      if (address && String(address).trim()) {
        const currentAddresses = parseAddresses(user.addresses);
        const exists = currentAddresses.some(
          (a) => a.address && a.address.trim().toLowerCase() === String(address).trim().toLowerCase(),
        );
        if (!exists) {
          currentAddresses.push(buildAddress(currentAddresses.length === 0));
          try {
            await db.updateUserAddresses(user.id, currentAddresses);
            user.addresses = currentAddresses;
          } catch (aErr) {
            console.warn("Could not save address to user:", aErr.message);
          }
        }
      }
    } else {
      const userId = "usr_" + nanoid(10);
      const userName = providedName || "Customer";
      let userEmail = `${cleanPhone}@thedeepcleanerz.com`;
      if (usableEmail && !(await db.getUserByEmail(usableEmail))) userEmail = usableEmail;
      const userRefCode = await generateUniqueReferralCode(userName);

      await db.createUser({
        id: userId,
        name: userName,
        phone: cleanPhone,
        email: userEmail,
        password: "",
        referral_code: userRefCode,
        wallet_balance: 0,
      });
      user = await db.getUserById(userId);
      if (!user) throw new Error("Account creation failed");
      if (address && String(address).trim()) {
        const initialAddresses = [buildAddress(true)];
        await db.updateUserAddresses(userId, initialAddresses);
        user.addresses = initialAddresses;
      }
    }

    // A phone OTP never grants admin rights; administrators must use the admin login.
    const token = signToken({ id: user.id, name: user.name, phone: user.phone, email: user.email, role: "user" });
    res.json({ ok: true, token, user: publicUser(user, "user") });
  } catch (err) {
    console.error("Verify Mobile OTP error:", err);
    res.status(500).json({ error: "Could not verify your mobile number. Please try again." });
  }
});

// Profile Lookup by Phone (Protected)
app.get("/api/auth/profile-by-phone", authenticate, async (req, res) => {
  try {
    const cleanPhone = normalizeIndianPhone(req.query.phone);
    if (!cleanPhone) return res.status(400).json({ error: "Phone number is required." });

    const isStaff = req.user.role === "admin" || req.user.role === "technician";
    if (!isStaff && normalizeIndianPhone(req.user.phone) !== cleanPhone) {
      return res.status(403).json({ error: "Forbidden: You cannot access other users' profiles." });
    }

    const user = await db.getUserByPhone(cleanPhone);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    return res.json({ ok: true, user: publicUser(user, user.role === "admin" ? "admin" : "user") });
  } catch (err) {
    res.status(500).json({ error: "Could not load profile." });
  }
});

const adminRegOtps = createOtpStore();

// Fetch all administrators
app.get("/api/auth/admins", requireAdmin, async (req, res) => {
  try {
    const admins = await db.getAdmins();
    res.json(admins);
  } catch (err) {
    console.error("Fetch admins error:", err);
    res.status(500).json({ error: "Could not load administrators." });
  }
});

// Trigger OTP for administrator registration or email change
app.post(
  "/api/auth/admin-settings/otp/send",
  requireAdmin,
  rateLimit("admin-settings-otp", 5, 10 * 60 * 1000, (req) => String(req.body?.email || "").trim().toLowerCase()),
  async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: "A valid email is required." });
      }
      const normEmail = String(email).trim().toLowerCase();
      const otp = adminRegOtps.issue(normEmail, 10 * 60 * 1000);
      logOtpForDev("Admin settings", normEmail, otp);

      let emailSent = false;
      try {
        const mailRes = await require("./utils/mailer").sendAdminOtpEmail(normEmail, otp);
        emailSent = !!(mailRes && mailRes.success);
      } catch (mailErr) {
        console.warn("[Admin Settings OTP] Mailer warning:", mailErr.message);
      }

      res.json({
        ok: true,
        emailSent,
        message: emailSent
          ? "Verification code sent to your email."
          : "Verification code generated. Please check your email inbox.",
      });
    } catch (err) {
      console.error("Admin Settings Send OTP error:", err);
      res.status(500).json({ error: "Could not send verification code." });
    }
  },
);

// Register new admin account
app.post("/api/auth/admin-settings/register", requireAdmin, async (req, res) => {
  try {
    const { name, phone, email, password, otp } = req.body || {};
    if (!name || !phone || !email || !password || !otp) {
      return res.status(400).json({ error: "All fields and verification code are required." });
    }
    const normEmail = String(email).trim().toLowerCase();
    const cleanPhone = normalizeIndianPhone(phone);
    if (!isValidEmail(normEmail)) return res.status(400).json({ error: "Please enter a valid email." });
    if (!cleanPhone) return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Admin password must be at least 8 characters." });
    }
    const result = adminRegOtps.check(normEmail, otp);
    if (result !== "ok") {
      return res.status(400).json({ error: otpErrorMessage(result) });
    }
    if (await db.getUserByEmail(normEmail)) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const newAdmin = await db.createAdmin({
      name: String(name).trim(),
      phone: cleanPhone,
      email: normEmail,
      password: bcrypt.hashSync(String(password), 10),
    });
    res.json({ ok: true, admin: newAdmin });
  } catch (err) {
    console.error("Register admin error:", err);
    res.status(500).json({ error: "Could not register administrator." });
  }
});

// Update administrator details
app.post("/api/auth/admin-settings/update", requireAdmin, async (req, res) => {
  try {
    const { currentEmail, newEmail, name, phone, password, otp } = req.body || {};
    if (!currentEmail || !name || !phone || !newEmail) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const normCurrent = String(currentEmail).trim().toLowerCase();
    const normNew = String(newEmail).trim().toLowerCase();
    if (!isValidEmail(normNew)) return res.status(400).json({ error: "Please enter a valid email." });

    const target = await db.getUserByEmail(normCurrent);
    if (!target || target.role !== "admin") {
      return res.status(404).json({ error: "Administrator not found." });
    }

    if (normNew !== normCurrent) {
      if (!otp) {
        return res.status(400).json({ error: "Verification OTP is required to change email." });
      }
      const result = adminRegOtps.check(normNew, otp);
      if (result !== "ok") {
        return res.status(400).json({ error: otpErrorMessage(result) });
      }
      if (await db.getUserByEmail(normNew)) {
        return res.status(400).json({ error: "Another account already uses this email." });
      }
    }

    let hashedPassword;
    if (password && String(password).trim()) {
      if (String(password).length < 8) {
        return res.status(400).json({ error: "Admin password must be at least 8 characters." });
      }
      hashedPassword = bcrypt.hashSync(String(password), 10);
    }

    const updated = await db.updateAdmin(target.email, {
      name: String(name).trim(),
      phone: normalizeIndianPhone(phone) || String(phone).trim(),
      email: normNew,
      password: hashedPassword,
    });
    res.json({ ok: true, admin: updated });
  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ error: "Could not update administrator." });
  }
});

// Delete administrator account
app.post("/api/auth/admin-settings/delete", requireAdmin, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const normEmail = String(email).trim().toLowerCase();
    if (normEmail === String(req.user.email || "").toLowerCase()) {
      return res.status(400).json({ error: "You cannot delete your own administrator account." });
    }
    const admins = await db.getAdmins();
    if ((admins || []).length <= 1) {
      return res.status(400).json({ error: "At least one administrator account must remain." });
    }
    await db.deleteAdmin(normEmail);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ error: "Could not delete administrator." });
  }
});

// Image Upload Endpoint (via Cloudinary)
app.post(
  "/api/upload",
  requireStaffOrAdmin,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Image file is too heavy! Maximum size allowed is 5MB.",
          });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "thedeepcleanerz" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });

      const result = await uploadPromise;
      res.json({ ok: true, url: result.secure_url });
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      res.status(500).json({ error: "Image upload failed: " + err.message });
    }
  },
);

// ===================== Ownership helpers =====================
function bookingBelongsToUser(booking, user) {
  if (!booking || !user || user.role !== "user") return false;
  if (booking.userId && booking.userId === user.id) return true;
  const userPhone = normalizeIndianPhone(user.phone);
  return !!userPhone && normalizeIndianPhone(booking.customer?.phone) === userPhone;
}

function isAssignedTechnician(booking, user) {
  return !!(booking && user && user.role === "technician" && booking.technicianId && booking.technicianId === user.id);
}

// Admin may act on any technician id; a technician only on their own id.
function requireSelfTechnicianOrAdmin(req, res, next) {
  if (req.user && (req.user.role === "admin" || (req.user.role === "technician" && req.user.id === req.params.id))) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: You can only access your own staff account." });
}

function stripTechnicianSecrets(t) {
  if (!t) return t;
  const { password, ...rest } = t;
  return rest;
}

const FINAL_STATUSES = ["Completed", "Cancelled"];
// Customers cannot cancel/reschedule once work has begun
const CUSTOMER_LOCKED_STATUSES = ["Completed", "Cancelled", "Started", "Ongoing", "Arrived"];

// Amount actually paid online for a booking (₹). Uses stored amounts; falls back to parsing
// the status text for bookings created before amounts were stored.
function paidOnlineAmount(booking) {
  const stored = (Number(booking.amountPaid) || 0) + (Number(booking.balancePaid) || 0);
  if (stored > 0) return stored;
  if (!booking.paymentId || String(booking.paymentId).startsWith("OFFLINE-")) return 0;
  const status = String(booking.paymentStatus || "");
  if (/paid in full|full amount/i.test(status)) return Number(booking.total) || 0;
  const m = status.match(/\(₹\s*(\d+)\)/);
  if (m) return parseInt(m[1], 10);
  return 0;
}

// Cancellation policy: free cancellation up to 12h before the slot; after that 10% of the
// paid amount is deducted per hour, up to 100%.
function computeCancellationRefund(booking) {
  const paid = paidOnlineAmount(booking);
  const slotTs = slotTimestampIST(booking.schedule?.date, booking.schedule?.time);
  const diffHours = Number.isFinite(slotTs) ? (slotTs - Date.now()) / 3600000 : 0;
  let penaltyPercent = 0;
  if (diffHours < 12) {
    penaltyPercent = Math.min(100, Math.max(0, Math.round((12 - diffHours) * 10)));
  }
  const refundAmount = Math.max(0, Math.round(paid * (1 - penaltyPercent / 100)));
  return { paid, penaltyPercent, refundAmount, diffHours };
}

// Splits the refund across the balance payment and the advance payment.
async function issueBookingRefund(booking, refundAmount) {
  let remaining = refundAmount;
  let allOk = true;
  const balancePaid = Number(booking.balancePaid) || 0;
  if (remaining > 0 && booking.balancePaymentId && balancePaid > 0) {
    const part = Math.min(remaining, balancePaid);
    const r = await refundRazorpayPayment(booking.balancePaymentId, part, { bookingId: booking.id });
    if (r.ok) remaining -= part;
    else allOk = false;
  }
  if (remaining > 0 && booking.paymentId) {
    const r = await refundRazorpayPayment(booking.paymentId, remaining, { bookingId: booking.id });
    if (r.ok) remaining = 0;
    else allOk = false;
  }
  return { ok: allOk && remaining === 0, refunded: refundAmount - remaining };
}

async function cancelBookingWithRefund(booking, { cancelledBy, note }) {
  const { penaltyPercent, refundAmount, paid } = computeCancellationRefund(booking);
  const statusNote =
    note ||
    `Cancelled by ${cancelledBy}. ${paid > 0 ? `Penalty: ${penaltyPercent}%, Refund: ₹${refundAmount}` : "No online payment"}`;
  const pendingStatus = refundAmount > 0 ? `Refund Processing (₹${refundAmount})` : "Cancelled (No Refund)";

  // Mark cancelled first (atomic, once). A second cancel request gets false and no refund.
  const marked = await db.markBookingCancelled(booking.id, {
    statusNote: String(statusNote).slice(0, 1000),
    paymentStatus: pendingStatus,
    refundAmount,
  });
  if (!marked) return { alreadyCancelled: true };

  let finalStatus = pendingStatus;
  if (refundAmount > 0) {
    const r = await issueBookingRefund(booking, refundAmount);
    finalStatus = r.ok
      ? `Refund Initiated (₹${refundAmount})`
      : `Refund Pending - Manual (₹${refundAmount})`;
    await db.updateBookingPayment(booking.id, finalStatus, booking.paymentId || null);
  }
  broadcastLive("BOOKINGS_UPDATED", { bookingId: booking.id, action: "status_update" });
  return { alreadyCancelled: false, refundAmount, penaltyPercent, paymentStatus: finalStatus };
}

// Pays referral rewards after the referred customer's first completed booking.
async function rewardReferralIfDue(userId) {
  if (!userId) return;
  try {
    const settings = await db.getSettings();
    if (settings.referral_enabled === "0") return;
    const referrerId = await db.claimReferralReward(userId);
    if (!referrerId) return;
    const reward = Math.max(0, parseInt(settings.referral_reward_amount || "200", 10) || 0);
    await db.creditWalletAtomic(referrerId, reward);
    await db.creditWalletAtomic(userId, Math.round(reward / 2));
    console.log(`[Referral] Rewarded ${referrerId} ₹${reward} and ${userId} ₹${Math.round(reward / 2)}`);
  } catch (e) {
    console.warn("[Referral] Reward failed:", e.message);
  }
}

// ===================== Customer booking endpoints =====================
app.get("/api/user/bookings", authenticate, async (req, res) => {
  try {
    const role = req.user.role;
    const allBookings = (await db.getBookings()) || [];

    if (role === "admin") {
      const queryPhone = normalizeIndianPhone(req.query.phone);
      const queryUserId = req.query.userId ? String(req.query.userId) : null;
      if (!queryPhone && !queryUserId) return res.json(allBookings);
      return res.json(
        allBookings.filter(
          (b) =>
            (queryUserId && b.userId === queryUserId) ||
            (queryPhone && normalizeIndianPhone(b.customer?.phone) === queryPhone),
        ),
      );
    }
    if (role === "technician") {
      return res.json(allBookings.filter((b) => b.technicianId === req.user.id));
    }
    // Customer: only bookings linked to their account or their exact (verified) phone number
    return res.json(allBookings.filter((b) => bookingBelongsToUser(b, req.user)));
  } catch (err) {
    res.status(500).json({ error: "Could not load bookings." });
  }
});

app.post("/api/user/bookings/:id/cancel", requireAuth, async (req, res) => {
  try {
    const booking = await db.getBookingById(req.params.id);
    if (!booking || !bookingBelongsToUser(booking, req.user)) {
      return res.status(404).json({ error: "Booking not found." });
    }
    if (CUSTOMER_LOCKED_STATUSES.includes(booking.jobStatus)) {
      return res.status(400).json({
        error:
          booking.jobStatus === "Cancelled"
            ? "This booking is already cancelled."
            : "This booking can no longer be cancelled. Please contact support.",
      });
    }
    const result = await cancelBookingWithRefund(booking, { cancelledBy: "customer" });
    if (result.alreadyCancelled) {
      return res.status(400).json({ error: "This booking is already cancelled." });
    }
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("Customer cancel error:", err);
    res.status(500).json({ error: "Could not cancel booking. Please try again." });
  }
});

app.put("/api/user/bookings/:id/reschedule", requireAuth, async (req, res) => {
  try {
    const { date, time } = req.body || {};
    const booking = await db.getBookingById(req.params.id);
    if (!booking || !bookingBelongsToUser(booking, req.user)) {
      return res.status(404).json({ error: "Booking not found." });
    }
    if (CUSTOMER_LOCKED_STATUSES.includes(booking.jobStatus)) {
      return res.status(400).json({ error: "This booking can no longer be rescheduled." });
    }
    const result = await withSlotLock(async () => {
      const slotError = await validateScheduleSlot(date, time, { ignoreBookingId: booking.id });
      if (slotError) return { error: slotError };
      await db.rescheduleBooking(booking.id, date, time, "Client");
      return { ok: true };
    });
    if (result.error) return res.status(400).json({ error: result.error });
    broadcastLive("BOOKINGS_UPDATED", { bookingId: booking.id, action: "reschedule" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Customer reschedule error:", err);
    res.status(500).json({ error: "Could not reschedule booking. Please try again." });
  }
});

app.post("/api/user/bookings/:id/pay-balance", requireAuth, async (req, res) => {
  let verified = null;
  try {
    const booking = await db.getBookingById(req.params.id);
    if (!booking || !bookingBelongsToUser(booking, req.user)) {
      return res.status(404).json({ error: "Booking not found." });
    }
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
    if (booking.balancePaymentId && booking.balancePaymentId === razorpayPaymentId) {
      return res.json({ ok: true, paymentStatus: booking.paymentStatus, duplicate: true });
    }
    try {
      verified = await verifyRazorpayPayment({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });
    } catch (e) {
      return res.status(e.status || 500).json({ error: e.message });
    }

    if (booking.jobStatus === "Cancelled") {
      const r = await refundRazorpayPayment(verified.paymentId, verified.amount, { reason: "booking_cancelled" });
      return res.status(400).json({
        error: `This booking is cancelled. ${r.ok ? "Your payment has been refunded automatically." : "Please contact support for a refund."}`,
      });
    }

    const total = Number(booking.total) || 0;
    const alreadyPaid = paidOnlineAmount(booking);
    const paidNow = verified.amount;
    const totalPaid = alreadyPaid + paidNow;
    const paymentStatus = paymentStatusFor(total, totalPaid) || "Pending";
    // The original advance (amountPaid) stays recorded so refunds can be split correctly
    if (!(Number(booking.amountPaid) > 0) && alreadyPaid > 0) {
      await db.query("UPDATE bookings SET amountPaid = ? WHERE id = ?", [alreadyPaid, booking.id]);
    }
    await db.recordBalancePayment(booking.id, {
      paymentStatus,
      balancePaymentId: verified.paymentId,
      balancePaid: (Number(booking.balancePaid) || 0) + paidNow,
    });
    broadcastLive("BOOKINGS_UPDATED", { bookingId: booking.id, action: "payment" });
    res.json({ ok: true, paymentStatus });
  } catch (err) {
    console.error("Pay balance error:", err);
    res.status(500).json({
      error: verified
        ? `Payment received (ID ${verified.paymentId}) but the booking could not be updated. Our team will fix it - please contact support.`
        : "Could not record payment.",
    });
  }
});

// ===================== Staff / admin booking endpoints =====================
app.get("/api/bookings", requireStaffOrAdmin, async (req, res) => {
  try {
    const bookings = (await db.getBookings()) || [];
    if (req.user.role === "technician") {
      return res.json(bookings.filter((b) => b.technicianId === req.user.id));
    }
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Could not load bookings." });
  }
});

app.get("/api/users", requireAdmin, async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users || []);
  } catch (err) {
    res.status(500).json({ error: "Could not load users." });
  }
});

app.put("/api/users/:id/wallet", requireAdmin, async (req, res) => {
  try {
    const amount = Math.round(Number(req.body?.amount));
    if (!Number.isFinite(amount) || amount < 0 || amount > 1000000) {
      return res.status(400).json({ error: "Valid wallet amount is required." });
    }
    await db.updateUserWallet(req.params.id, amount);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not update wallet." });
  }
});

// Update user addresses API
app.put("/api/users/:id/addresses", requireAuth, async (req, res) => {
  try {
    const { addresses } = req.body || {};
    if (!addresses || !Array.isArray(addresses) || addresses.length > 20) {
      return res.status(400).json({ error: "Addresses array is required." });
    }
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Cannot edit addresses for other users." });
    }
    const clean = addresses
      .filter((a) => a && typeof a === "object")
      .map((a) => ({
        id: String(a.id || `addr-${Date.now()}`).slice(0, 60),
        type: String(a.type || "Home").slice(0, 30),
        address: String(a.address || "").slice(0, 500),
        landmark: String(a.landmark || "").slice(0, 200),
        city: String(a.city || "").slice(0, 100),
        pincode: String(a.pincode || "").replace(/\D/g, "").slice(0, 6),
        gpsCoords: a.gpsCoords ? String(a.gpsCoords).slice(0, 100) : "",
        mapsLink: a.mapsLink ? String(a.mapsLink).slice(0, 500) : "",
        isDefault: !!a.isDefault,
      }));
    await db.updateUserAddresses(req.params.id, clean);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not save addresses." });
  }
});

app.delete("/api/bookings/:id", requireAdmin, async (req, res) => {
  try {
    await db.deleteBooking(req.params.id);
    broadcastLive("BOOKINGS_UPDATED", { bookingId: req.params.id, action: "delete" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete booking." });
  }
});

// ===== Coupons Endpoints =====
app.get("/api/coupons", requireAdmin, async (req, res) => {
  try {
    const coupons = await db.getCoupons();
    res.json(coupons || []);
  } catch (err) {
    res.status(500).json({ error: "Could not load coupons." });
  }
});

// Public list of currently usable coupons (for showing offers at checkout)
app.get("/api/coupons/active", async (req, res) => {
  try {
    const today = todayIST();
    const list = ((await db.getCoupons()) || [])
      .filter((c) => Number(c.isActive) === 1 && String(c.expiryDate) >= today)
      .map((c) => ({
        code: c.code,
        discount: Number(c.discount) || 0,
        minAmount: Number(c.minAmount) || 0,
        expiryDate: c.expiryDate,
        isActive: 1,
      }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Could not load offers." });
  }
});

function validateCouponInput(body, { requireCode }) {
  const code = String(body.code || "").trim().toUpperCase();
  const discount = Math.round(Number(body.discount));
  const minAmount = Math.round(Number(body.minAmount) || 0);
  const expiryDate = String(body.expiryDate || "");
  if (requireCode && !/^[A-Z0-9_-]{3,30}$/.test(code)) return { error: "Coupon code must be 3-30 letters/numbers." };
  if (!Number.isFinite(discount) || discount <= 0) return { error: "Discount must be a positive amount." };
  if (minAmount < 0) return { error: "Minimum amount cannot be negative." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) return { error: "Expiry date must be YYYY-MM-DD." };
  return { code, discount, minAmount, expiryDate, isActive: body.isActive !== false && body.isActive !== 0 };
}

app.post("/api/coupons", requireAdmin, async (req, res) => {
  try {
    const v = validateCouponInput(req.body || {}, { requireCode: true });
    if (v.error) return res.status(400).json({ error: v.error });
    const coupon = await db.addCoupon(v);
    broadcastLive("CATALOG_UPDATED", { action: "coupon_update" });
    res.json({ ok: true, coupon });
  } catch (err) {
    const dup = /duplicate/i.test(err.message || "");
    res.status(dup ? 400 : 500).json({ error: dup ? "A coupon with this code already exists." : "Could not create coupon." });
  }
});

app.put("/api/coupons/:code", requireAdmin, async (req, res) => {
  try {
    const v = validateCouponInput(req.body || {}, { requireCode: false });
    if (v.error) return res.status(400).json({ error: v.error });
    const coupon = await db.updateCoupon(String(req.params.code).toUpperCase(), v);
    broadcastLive("CATALOG_UPDATED", { action: "coupon_update" });
    res.json({ ok: true, coupon });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.status ? err.message : "Could not update coupon." });
  }
});

app.delete("/api/coupons/:code", requireAdmin, async (req, res) => {
  try {
    await db.deleteCoupon(String(req.params.code).toUpperCase());
    broadcastLive("CATALOG_UPDATED", { action: "coupon_update" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete coupon." });
  }
});

app.post("/api/coupons/validate", rateLimit("coupon-validate", 30, 10 * 60 * 1000), async (req, res) => {
  try {
    const { code, total } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: "Coupon code is required." });
    }
    const result = await db.validateCoupon(String(code), Number(total) || 0);
    res.json({ ok: true, coupon: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Manual payment status change (offline/cash collection) - admin only
app.put("/api/bookings/:id/payment", requireAdmin, async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body || {};
    if (!paymentStatus) return res.status(400).json({ error: "Payment status is required." });
    const booking = await db.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    await db.updateBookingPayment(
      req.params.id,
      String(paymentStatus).slice(0, 100),
      paymentId !== undefined ? paymentId || null : booking.paymentId || null,
    );
    broadcastLive("BOOKINGS_UPDATED", { bookingId: req.params.id, action: "payment" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not update payment." });
  }
});

// ===== Technicians Endpoints =====
app.get("/api/technicians", requireStaffOrAdmin, async (req, res) => {
  try {
    const technicians = ((await db.getTechnicians()) || []).map(stripTechnicianSecrets);
    if (req.user.role === "technician") {
      return res.json(technicians.filter((t) => t.id === req.user.id));
    }
    res.json(technicians);
  } catch (err) {
    res.status(500).json({ error: "Could not load technicians." });
  }
});

app.post("/api/technicians", requireAdmin, async (req, res) => {
  try {
    const { name, phone, email, specialty, status, password } = req.body || {};
    const cleanPhone = normalizeIndianPhone(phone);
    if (!name || !cleanPhone) {
      return res.status(400).json({ error: "Name and a valid 10-digit phone number are required." });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email." });
    }
    if (password && String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    const id = `tech_${nanoid(8)}`;
    const technician = await db.addTechnician({
      id,
      name: String(name).trim(),
      phone: cleanPhone,
      email: email ? String(email).trim().toLowerCase() : null,
      specialty,
      status,
      password,
    });
    broadcastLive("BOOKINGS_UPDATED", { action: "technician_update" });
    res.json({ ok: true, technician: stripTechnicianSecrets(technician) });
  } catch (err) {
    const dup = /duplicate/i.test(err.message || "");
    res.status(dup ? 400 : 500).json({
      error: dup ? "A technician with this phone or email already exists." : "Could not create technician.",
    });
  }
});

app.put("/api/technicians/:id", requireSelfTechnicianOrAdmin, async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const { name, phone, email, specialty, status, password } = req.body || {};
    const patch = {};
    if (name !== undefined) patch.name = String(name).trim();
    if (phone !== undefined) {
      const cleanPhone = normalizeIndianPhone(phone);
      if (!cleanPhone) return res.status(400).json({ error: "Please enter a valid 10-digit phone number." });
      patch.phone = cleanPhone;
    }
    if (specialty !== undefined) patch.specialty = specialty;
    // Only admins may change email, status (active/inactive) or reset passwords
    if (isAdmin) {
      if (email !== undefined) {
        if (email && !isValidEmail(email)) return res.status(400).json({ error: "Please enter a valid email." });
        patch.email = email ? String(email).trim().toLowerCase() : null;
      }
      if (status !== undefined) patch.status = status;
      if (password) {
        if (String(password).length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters." });
        }
        patch.password = password;
      }
    }
    const technician = await db.updateTechnician(req.params.id, patch);
    broadcastLive("BOOKINGS_UPDATED", { action: "technician_update" });
    res.json({ ok: true, technician: stripTechnicianSecrets(technician) });
  } catch (err) {
    const dup = /duplicate/i.test(err.message || "");
    res.status(dup ? 400 : 500).json({
      error: dup ? "Another technician already uses this phone or email." : err.message || "Could not update technician.",
    });
  }
});

app.get("/api/technicians/:id/bookings", requireStaffOrAdmin, requireSelfTechnicianOrAdmin, async (req, res) => {
  try {
    const bookings = await db.getTechnicianBookings(req.params.id);
    res.json(bookings || []);
  } catch (err) {
    res.status(500).json({ error: "Could not load bookings." });
  }
});

// Broadcast Open Leads for Technicians (First-Come-First-Serve Job Claiming)
app.get("/api/technicians/:id/available-jobs", requireStaffOrAdmin, requireSelfTechnicianOrAdmin, async (req, res) => {
  try {
    const jobs = await db.getAvailableBookings();
    res.json(jobs || []);
  } catch (err) {
    res.status(500).json({ error: "Could not load available jobs." });
  }
});

app.post("/api/technicians/:id/claim-booking", requireStaffOrAdmin, requireSelfTechnicianOrAdmin, async (req, res) => {
  try {
    const { bookingId } = req.body || {};
    const technicianId = req.params.id;
    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required to claim job." });
    }

    const technician = await db.getTechnicianById(technicianId);
    if (!technician) {
      return res.status(404).json({ error: "Technician profile not found." });
    }
    if (String(technician.status || "Active").toLowerCase() === "inactive") {
      return res.status(403).json({ error: "Inactive staff accounts cannot claim jobs." });
    }
    const booking = await db.getBookingById(bookingId);
    if (!booking || FINAL_STATUSES.includes(booking.jobStatus)) {
      return res.status(409).json({ ok: false, error: "This job is no longer available." });
    }

    const claimed = await db.claimBooking(bookingId, technicianId);
    if (!claimed) {
      return res.status(409).json({
        ok: false,
        error: "This cleaning lead has already been claimed by another staff member or assigned by admin.",
      });
    }

    broadcastLive("BOOKINGS_UPDATED", { bookingId, action: "claim_job" });
    res.json({
      ok: true,
      message: `Job #${bookingId} successfully claimed by ${technician.name}!`,
      bookingId,
      technicianId,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not claim job." });
  }
});

app.delete("/api/technicians/:id", requireAdmin, async (req, res) => {
  try {
    // Release the technician's open jobs so they go back to the open leads pool
    await db.query(
      "UPDATE bookings SET technicianId = NULL WHERE technicianId = ? AND (jobStatus IS NULL OR jobStatus NOT IN ('Completed','Cancelled'))",
      [req.params.id],
    );
    await db.deleteTechnician(req.params.id);
    broadcastLive("BOOKINGS_UPDATED", { action: "technician_delete" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete technician." });
  }
});

app.put("/api/technicians/:id/location", requireStaffOrAdmin, requireSelfTechnicianOrAdmin, async (req, res) => {
  try {
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: "Latitude (lat) and Longitude (lng) are required." });
    }
    await db.updateTechnicianLocation(req.params.id, lat, lng);
    // No coordinates in the public broadcast; customers fetch their own technician's location
    broadcastLive("BOOKINGS_UPDATED", { action: "technician_location" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not update location." });
  }
});

app.put("/api/bookings/:id/technician", requireAdmin, async (req, res) => {
  try {
    const { technicianId } = req.body || {};
    if (technicianId) {
      const tech = await db.getTechnicianById(technicianId);
      if (!tech) return res.status(404).json({ error: "Technician not found." });
    }
    await db.updateBookingTechnician(req.params.id, technicianId);
    broadcastLive("BOOKINGS_UPDATED", { bookingId: req.params.id, action: "assign_technician" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not assign technician." });
  }
});

app.put("/api/bookings/:id/job-status", requireStaffOrAdmin, async (req, res) => {
  try {
    const { jobStatus, statusNote } = req.body || {};
    if (!jobStatus || String(jobStatus).length > 50) {
      return res.status(400).json({ error: "Job status is required." });
    }
    const booking = await db.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found." });

    const isAdmin = req.user.role === "admin";
    if (!isAdmin) {
      if (!isAssignedTechnician(booking, req.user)) {
        return res.status(403).json({ error: "You can only update jobs assigned to you." });
      }
      if (jobStatus === "Cancelled") {
        return res.status(403).json({ error: "Only the admin can cancel a booking." });
      }
      if (FINAL_STATUSES.includes(booking.jobStatus)) {
        return res.status(400).json({ error: `This job is already ${booking.jobStatus}.` });
      }
    }

    if (jobStatus === "Cancelled") {
      // Refund (once) according to the cancellation policy
      const result = await cancelBookingWithRefund(booking, {
        cancelledBy: "admin",
        note: statusNote ? String(statusNote).slice(0, 1000) : null,
      });
      if (result.alreadyCancelled) {
        return res.status(400).json({ error: "This booking is already cancelled." });
      }
      return res.json({ ok: true, ...result });
    }

    await db.updateBookingJobStatus(req.params.id, String(jobStatus), statusNote ? String(statusNote).slice(0, 1000) : null);
    if (jobStatus === "Completed" && booking.jobStatus !== "Completed") {
      rewardReferralIfDue(booking.userId);
    }
    broadcastLive("BOOKINGS_UPDATED", { bookingId: req.params.id, action: "status_update" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Job status update error:", err);
    res.status(500).json({ error: "Could not update job status." });
  }
});

app.put("/api/bookings/:id/media", requireStaffOrAdmin, async (req, res) => {
  try {
    const { beforeImage, afterImage } = req.body || {};
    const booking = await db.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (req.user.role !== "admin" && !isAssignedTechnician(booking, req.user)) {
      return res.status(403).json({ error: "You can only upload photos for jobs assigned to you." });
    }
    const validUrl = (u) => u === undefined || u === null || u === "" || /^https:\/\/[^\s"'<>]+$/.test(String(u));
    if (!validUrl(beforeImage) || !validUrl(afterImage)) {
      return res.status(400).json({ error: "Invalid image URL." });
    }
    await db.updateBookingMedia(req.params.id, { beforeImage, afterImage });
    broadcastLive("BOOKINGS_UPDATED", { bookingId: req.params.id, action: "media_update" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not save photos." });
  }
});

app.get("/api/bookings/reschedule-logs", requireAdmin, async (req, res) => {
  try {
    const logs = await db.getAllRescheduleLogs();
    res.json(logs || []);
  } catch (err) {
    res.status(500).json({ error: "Could not load reschedule logs." });
  }
});

app.put("/api/bookings/:id/reschedule", requireStaffOrAdmin, async (req, res) => {
  try {
    const { date, time } = req.body || {};
    if (!date || !time) {
      return res.status(400).json({ error: "Date and Time are required." });
    }
    const booking = await db.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && !isAssignedTechnician(booking, req.user)) {
      return res.status(403).json({ error: "You can only reschedule jobs assigned to you." });
    }
    if (FINAL_STATUSES.includes(booking.jobStatus)) {
      return res.status(400).json({ error: `A ${booking.jobStatus.toLowerCase()} booking cannot be rescheduled.` });
    }

    const rescheduledBy = isAdmin ? "Admin" : `Technician: ${req.user.name || req.user.id}`;
    const result = await withSlotLock(async () => {
      const slotError = await validateScheduleSlot(date, time, { ignoreBookingId: booking.id });
      if (slotError) return { error: slotError };
      await db.rescheduleBooking(booking.id, date, time, rescheduledBy);
      return { ok: true };
    });
    if (result.error) return res.status(400).json({ error: result.error });
    broadcastLive("BOOKINGS_UPDATED", { bookingId: booking.id, action: "reschedule" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not reschedule booking." });
  }
});

// ===================== Catalog admin (categories / services / customized) =====================

// Turns database errors into messages an admin can act on (instead of "server failed").
function adminErrorResponse(res, err, fallback) {
  const msg = String(err?.message || "");
  console.error(`[Admin] ${fallback}:`, msg);
  if (err?.status) return res.status(err.status).json({ error: msg || fallback });
  if (/ER_DUP_ENTRY|Duplicate entry/i.test(msg)) {
    return res.status(400).json({ error: "An item with this ID/code already exists." });
  }
  if (/ER_NO_REFERENCED_ROW|foreign key constraint fails/i.test(msg)) {
    return res.status(400).json({ error: "The selected category no longer exists. Please refresh and choose another." });
  }
  if (/ER_DATA_TOO_LONG|Data too long/i.test(msg)) {
    return res.status(400).json({ error: "One of the fields is too long. Please shorten it and try again." });
  }
  if (/ECONNREFUSED|PROTOCOL_CONNECTION_LOST|ETIMEDOUT|ER_CON_COUNT/i.test(msg)) {
    return res.status(503).json({ error: "Database is temporarily unavailable. Please try again in a moment." });
  }
  return res.status(500).json({ error: `${fallback}. Please try again.` });
}

function parseIncludes(value) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parsePlans(value) {
  if (value === undefined) return undefined;
  const list = Array.isArray(value) ? value : safeParse(value, []);
  if (!Array.isArray(list)) return [];
  return list
    .filter((p) => p && typeof p === "object")
    .map((p) => ({
      ...p,
      name: String(p.name || "Standard").slice(0, 120),
      price: Math.max(0, Math.round(Number(p.price) || 0)),
    }));
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${nanoid(4)}`;
}

app.post("/api/categories", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Category title is required." });
    if (body.parentId) {
      const cats = await db.getCategories();
      if (!cats.some((c) => c.id === body.parentId)) {
        return res.status(400).json({ error: "Parent category not found. Please refresh." });
      }
    }
    const newCat = {
      id: body.id && /^[\w-]{1,100}$/.test(body.id) ? body.id : newId("cat"),
      title,
      tagline: body.tagline || "",
      emoji: body.emoji || "✨",
      image: body.image || null,
      parentId: body.parentId || null,
      includes: parseIncludes(body.includes) || [],
      paymentType: body.paymentType || "fixed",
    };
    const created = await db.addCategory(newCat);
    broadcastLive("CATALOG_UPDATED", { action: "category_create", categoryId: created.id });
    res.json({ ok: true, category: created });
  } catch (err) {
    adminErrorResponse(res, err, "Could not create category");
  }
});

app.put("/api/categories/:id", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    // Only fields that were actually sent are changed (partial updates never wipe data)
    const patch = {};
    ["title", "tagline", "emoji", "image", "paymentType"].forEach((k) => {
      if (body[k] !== undefined) patch[k] = body[k];
    });
    if (body.parentId !== undefined) patch.parentId = body.parentId || null;
    if (body.includes !== undefined) patch.includes = parseIncludes(body.includes);
    patch.cascadeToServices = body.cascadeToServices !== false;
    if (patch.title !== undefined && !String(patch.title).trim()) {
      return res.status(400).json({ error: "Category title cannot be empty." });
    }
    const c = await db.updateCategory(req.params.id, patch);
    broadcastLive("CATALOG_UPDATED", { action: "category_update", categoryId: req.params.id });
    res.json({ ok: true, category: c });
  } catch (err) {
    adminErrorResponse(res, err, "Could not update category");
  }
});

app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
  try {
    await db.deleteCategory(req.params.id);
    broadcastLive("CATALOG_UPDATED", { action: "category_delete", categoryId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    adminErrorResponse(res, err, "Could not delete category");
  }
});

app.post("/api/services", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Service title is required." });
    if (!body.categoryId) return res.status(400).json({ error: "Please choose a category for this service." });
    const cats = await db.getCategories();
    if (!cats.some((c) => c.id === body.categoryId)) {
      return res.status(400).json({ error: "The selected category no longer exists. Please refresh." });
    }
    const newSvc = {
      id: body.id && /^[\w-]{1,100}$/.test(body.id) ? body.id : newId("svc"),
      categoryId: body.categoryId,
      title,
      price: Math.max(0, Math.round(Number(body.price) || 0)),
      description: body.description || "",
      includes: parseIncludes(body.includes) || [],
      image: body.image || null,
      plans: parsePlans(body.plans) || [],
      disclaimer: body.disclaimer || null,
      requirements: body.requirements || null,
      paymentType: body.paymentType || "full",
      precautions: Array.isArray(body.precautions) ? body.precautions : [],
    };
    await db.addService(newSvc);
    broadcastLive("CATALOG_UPDATED", { action: "service_create", serviceId: newSvc.id });
    res.json({ ok: true, service: newSvc });
  } catch (err) {
    adminErrorResponse(res, err, "Could not create service");
  }
});

app.put("/api/services/:id", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const patch = {};
    ["categoryId", "title", "description", "image", "disclaimer", "requirements", "paymentType"].forEach((k) => {
      if (body[k] !== undefined) patch[k] = body[k];
    });
    if (body.price !== undefined) patch.price = Math.max(0, Math.round(Number(body.price) || 0));
    if (body.includes !== undefined) patch.includes = parseIncludes(body.includes);
    if (body.plans !== undefined) patch.plans = parsePlans(body.plans);
    if (body.precautions !== undefined) patch.precautions = Array.isArray(body.precautions) ? body.precautions : [];
    if (patch.title !== undefined && !String(patch.title).trim()) {
      return res.status(400).json({ error: "Service title cannot be empty." });
    }
    if (patch.categoryId) {
      const cats = await db.getCategories();
      if (!cats.some((c) => c.id === patch.categoryId)) {
        return res.status(400).json({ error: "The selected category no longer exists. Please refresh." });
      }
    }
    const s = await db.updateService(req.params.id, patch);
    broadcastLive("CATALOG_UPDATED", { action: "service_update", serviceId: req.params.id });
    res.json({ ok: true, service: s });
  } catch (err) {
    adminErrorResponse(res, err, "Could not update service");
  }
});

app.delete("/api/services/:id", requireAdmin, async (req, res) => {
  try {
    await db.deleteService(req.params.id);
    broadcastLive("CATALOG_UPDATED", { action: "service_delete", serviceId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    adminErrorResponse(res, err, "Could not delete service");
  }
});

// Customized Services API
app.get("/api/customized-services", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    const list = await db.getCustomizedServices();
    res.json(list || []);
  } catch (err) {
    res.status(500).json({ error: "Could not load customized services." });
  }
});

app.post("/api/customized-services", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required." });
    const payload = {
      id: body.id && /^[\w-]{1,100}$/.test(body.id) ? body.id : newId("cust"),
      title,
      price: Math.max(0, Math.round(Number(body.price) || 0)),
      image: body.image || null,
      plans: parsePlans(body.plans) || [],
      paymentType: body.paymentType || "full",
    };
    const s = await db.addCustomizedService(payload);
    broadcastLive("CATALOG_UPDATED", { action: "customized_create", serviceId: s.id });
    res.json({ ok: true, service: s });
  } catch (err) {
    adminErrorResponse(res, err, "Could not create customized service");
  }
});

app.put("/api/customized-services/:id", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const patch = {};
    ["title", "image", "paymentType"].forEach((k) => {
      if (body[k] !== undefined) patch[k] = body[k];
    });
    if (body.price !== undefined) patch.price = Math.max(0, Math.round(Number(body.price) || 0));
    if (body.plans !== undefined) patch.plans = parsePlans(body.plans);
    if (patch.title !== undefined && !String(patch.title).trim()) {
      return res.status(400).json({ error: "Title cannot be empty." });
    }
    const s = await db.updateCustomizedService(req.params.id, patch);
    broadcastLive("CATALOG_UPDATED", { action: "customized_update", serviceId: req.params.id });
    res.json({ ok: true, service: s });
  } catch (err) {
    adminErrorResponse(res, err, "Could not update customized service");
  }
});

app.delete("/api/customized-services/:id", requireAdmin, async (req, res) => {
  try {
    await db.deleteCustomizedService(req.params.id);
    broadcastLive("CATALOG_UPDATED", { action: "customized_delete", serviceId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    adminErrorResponse(res, err, "Could not delete customized service");
  }
});

// User Profile Refresh API (logged-in customer: own profile only; admin: any)
app.get("/api/user/profile", requireAuth, async (req, res) => {
  try {
    let user;
    if (req.user.role === "admin" && req.query.email) {
      user = await db.getUserByEmail(String(req.query.email));
    } else {
      if (req.user.role !== "user") return res.status(403).json({ error: "Forbidden" });
      user = await db.getUserById(req.user.id);
    }
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.referral_code) {
      user.referral_code = await generateUniqueReferralCode(user.name);
      await db.query("UPDATE users SET referral_code = ? WHERE id = ?", [user.referral_code, user.id]);
    }
    res.json(publicUser(user, "user"));
  } catch (err) {
    res.status(500).json({ error: "Could not load profile." });
  }
});

// Wallet credit is now applied atomically inside POST /api/bookings (field `walletUsed`).
// This endpoint is kept for compatibility but only lets a logged-in customer spend their own wallet.
app.post("/api/user/wallet/use", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "user") return res.status(403).json({ error: "Forbidden" });
    const amount = Math.max(0, Math.floor(Number(req.body?.amount) || 0));
    const user = await db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const deduct = Math.min(Number(user.wallet_balance) || 0, amount);
    if (deduct > 0 && !(await db.deductWalletAtomic(user.id, deduct))) {
      return res.status(409).json({ error: "Wallet balance changed. Please try again." });
    }
    const fresh = await db.getUserById(user.id);
    res.json({ ok: true, deducted: deduct, newBalance: Number(fresh?.wallet_balance) || 0 });
  } catch (err) {
    res.status(500).json({ error: "Could not use wallet credit." });
  }
});

// Admin System Settings API
// Keys that are safe to show on the public website. Everything else (e.g. WhatsApp API key)
// is only returned to a logged-in admin.
const PUBLIC_SETTING_KEYS = [
  "referral_reward_amount",
  "referral_enabled",
  "travel_rate_per_km",
  "travel_free_radius_km",
  "header_promo_text",
  "header_promo_code",
];

// Every key the admin panel can save, with validation/normalisation.
const SETTING_RULES = {
  referral_reward_amount: (v) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) && n >= 0 && n <= 100000 ? String(n) : null;
  },
  referral_enabled: (v) => (v === true || v === "1" || v === 1 || v === "true" ? "1" : "0"),
  travel_rate_per_km: (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 1000 ? String(n) : null;
  },
  travel_free_radius_km: (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 1000 ? String(n) : null;
  },
  header_promo_text: (v) => String(v ?? "").slice(0, 1000),
  header_promo_code: (v) => String(v ?? "").trim().toUpperCase().slice(0, 50),
  whatsapp_enabled: (v) => (v === true || v === "1" || v === 1 || v === "true" ? "1" : "0"),
  whatsapp_admin_phone: (v) => String(v ?? "").replace(/[^\d+]/g, "").slice(0, 20),
  whatsapp_api_key: (v) => String(v ?? "").trim().slice(0, 200),
};

app.get("/api/settings", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const settings = (await db.getSettings()) || {};
    if (req.user && req.user.role === "admin") return res.json(settings);
    const pub = {};
    PUBLIC_SETTING_KEYS.forEach((k) => {
      if (settings[k] !== undefined) pub[k] = settings[k];
    });
    res.json(pub);
  } catch (err) {
    res.status(500).json({ error: "Could not load settings." });
  }
});

const handleSaveSettings = async (req, res) => {
  try {
    const body = req.body || {};
    const saved = [];
    for (const [key, normalise] of Object.entries(SETTING_RULES)) {
      if (body[key] === undefined) continue;
      const value = normalise(body[key]);
      if (value === null) {
        return res.status(400).json({ error: `Invalid value for ${key.replace(/_/g, " ")}.` });
      }
      await db.updateSetting(key, value);
      saved.push(key);
    }
    if (saved.length === 0) {
      return res.status(400).json({ error: "No settings to save." });
    }
    const updated = await db.getSettings();
    broadcastLive("CATALOG_UPDATED", { action: "settings_update" });
    res.json({ ok: true, settings: updated });
  } catch (err) {
    console.error("Save settings error:", err);
    res.status(500).json({ error: "Could not save settings." });
  }
};

app.post("/api/settings", requireAdmin, handleSaveSettings);
app.put("/api/settings", requireAdmin, handleSaveSettings);

// Reviews API
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await db.getAllReviews();
    res.json(reviews || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reviews/:serviceId", async (req, res) => {
  try {
    const reviews = await db.getReviews(req.params.serviceId);
    res.json(reviews || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reviews", requireAuth, rateLimit("reviews", 10, 60 * 60 * 1000, (req) => req.user?.id || clientIp(req)), async (req, res) => {
  try {
    const { serviceId, comment } = req.body || {};
    const rating = Math.round(Number(req.body?.rating));
    if (!serviceId || typeof serviceId !== "string" || serviceId.length > 255) {
      return res.status(400).json({ error: "Service is required." });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5 stars." });
    }
    // Reviewer name comes from the logged-in account, not from the request body
    let userName = "Customer";
    if (req.user.role === "user") {
      const u = await db.getUserById(req.user.id);
      userName = (u && u.name) || req.user.name || "Customer";
    } else {
      userName = req.user.name || "TheDeep CleanerZ";
    }
    const payload = {
      id: `rev-${nanoid(10)}`,
      serviceId,
      userName: String(userName).slice(0, 80),
      rating,
      comment: String(comment || "").trim().slice(0, 1000),
    };
    const r = await db.addReview(payload);
    res.json({ ok: true, review: r });
  } catch (err) {
    res.status(500).json({ error: "Could not submit review." });
  }
});

// Transformations API
app.get("/api/transformations", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const list = await db.getRecentTransformations();
    res.json(list || []);
  } catch (err) {
    res.status(500).json({ error: "Could not load transformations." });
  }
});

app.post("/api/transformations", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    if (!String(body.title || "").trim()) return res.status(400).json({ error: "Title is required." });
    if (!body.beforeImage || !body.afterImage) {
      return res.status(400).json({ error: "Both before and after images are required." });
    }
    const payload = {
      id: newId("trans"),
      title: String(body.title).trim().slice(0, 255),
      location: String(body.location || "").trim().slice(0, 255),
      beforeImage: String(body.beforeImage),
      afterImage: String(body.afterImage),
    };
    const item = await db.addRecentTransformation(payload);
    broadcastLive("CATALOG_UPDATED", { action: "transformation_create" });
    res.json({ ok: true, transformation: item });
  } catch (err) {
    adminErrorResponse(res, err, "Could not add transformation");
  }
});

app.put("/api/transformations/:id", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const patch = {};
    ["title", "location", "beforeImage", "afterImage"].forEach((k) => {
      if (body[k] !== undefined && body[k] !== "") patch[k] = String(body[k]).slice(0, k.endsWith("Image") ? 5000 : 255);
    });
    const item = await db.updateRecentTransformation(req.params.id, patch);
    broadcastLive("CATALOG_UPDATED", { action: "transformation_update" });
    res.json({ ok: true, transformation: item });
  } catch (err) {
    adminErrorResponse(res, err, "Could not update transformation");
  }
});

app.delete("/api/transformations/:id", requireAdmin, async (req, res) => {
  try {
    await db.deleteRecentTransformation(req.params.id);
    broadcastLive("CATALOG_UPDATED", { action: "transformation_delete" });
    res.json({ ok: true });
  } catch (err) {
    adminErrorResponse(res, err, "Could not delete transformation");
  }
});

// ===== Blocked Dates / Holiday Management Endpoints =====
app.get("/api/blocked-dates", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const list = await db.getBlockedDates();
    res.json(list || []);
  } catch (err) {
    res.status(500).json({ error: "Could not load holidays." });
  }
});

app.post("/api/blocked-dates", requireAdmin, async (req, res) => {
  try {
    const { date, reason } = req.body || {};
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return res.status(400).json({ error: "Date is required (YYYY-MM-DD)." });
    }
    if (date < todayIST()) {
      return res.status(400).json({ error: "Cannot block a date in the past." });
    }
    await db.addBlockedDate({
      id: `blk-${Date.now()}-${nanoid(4)}`,
      date,
      reason: String(reason || "").trim().slice(0, 255),
      createdAt: new Date().toISOString(),
    });
    // Return the row that is actually stored (if the date was already blocked, the existing
    // row keeps its id; returning a new id would make "delete" silently do nothing)
    const stored = await db.isDateBlocked(date);
    broadcastLive("CATALOG_UPDATED", { action: "holiday_update" });
    res.json({ ok: true, blockedDate: stored });
  } catch (err) {
    adminErrorResponse(res, err, "Could not block date");
  }
});

app.delete("/api/blocked-dates/:id", requireAdmin, async (req, res) => {
  try {
    await db.deleteBlockedDate(req.params.id);
    broadcastLive("CATALOG_UPDATED", { action: "holiday_update" });
    res.json({ ok: true });
  } catch (err) {
    adminErrorResponse(res, err, "Could not remove holiday");
  }
});

// ===== Inquiries / Contact Us & Callback API =====
app.post("/api/inquiries", rateLimit("inquiries", 10, 60 * 60 * 1000), async (req, res) => {
  try {
    const { name, phone, service, message } = req.body || {};

    // Strict validation: Name (letters only, min 2 chars)
    if (!name || typeof name !== "string" || !/^[A-Za-z\s]{2,60}$/.test(name.trim())) {
      return res.status(400).json({
        error: "Please enter a valid full name containing letters only (min 2 characters).",
      });
    }

    // Strict validation: Phone (exactly 10 digits, starts with 6-9)
    const cleanPhone = (phone || "").replace(/\D/g, "");
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        error: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
      });
    }

    const cleanService = String(service || "General Inquiry").trim().slice(0, 200);
    const cleanMessage = String(message || "").trim().slice(0, 2000);

    const inquiryId = `INQ-${nanoid(8).toUpperCase()}`;
    const newInquiry = await db.createInquiry({
      id: inquiryId,
      name: name.trim(),
      phone: cleanPhone,
      service: cleanService,
      message: cleanMessage,
      status: "New",
      createdAt: new Date().toISOString(),
    });

    // Optionally send Admin Notification (Email & WhatsApp alert)
    try {
      const mailer = require("./utils/mailer");
      if (typeof mailer.sendAdminInquiryEmail === "function") {
        await mailer.sendAdminInquiryEmail(newInquiry);
      }
    } catch (e) {
      console.warn("Could not send admin email for inquiry:", e.message);
    }

    return res.json({
      ok: true,
      id: inquiryId,
      message: "Your inquiry has been received! Our team will contact you within 15 minutes.",
      inquiry: newInquiry,
    });
  } catch (err) {
    console.error("Error creating inquiry:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Quotation / Free Estimate endpoint (alias to inquiries)
app.post("/api/quotes", rateLimit("inquiries", 10, 60 * 60 * 1000), async (req, res) => {
  try {
    const {
      name,
      phone,
      service,
      message,
      customerName,
      customerPhone,
      serviceTitle,
      requirements,
    } = req.body;

    const finalName = (customerName || name || "").trim();
    const finalPhone = (customerPhone || phone || "").replace(/\D/g, "");
    const finalService = String(serviceTitle || service || "Custom Estimate Request").trim().slice(0, 200);
    const finalMessage = String(requirements || message || `Estimate request for ${finalService}`).trim().slice(0, 2000);

    // Strict validation: Name (letters and spaces, min 2 chars)
    if (!finalName || !/^[A-Za-z\s]{2,60}$/.test(finalName)) {
      return res.status(400).json({
        error: "Please enter a valid full name containing letters only (min 2 characters).",
      });
    }

    // Strict validation: Phone (exactly 10 digits, starts with 6-9)
    if (!finalPhone || !/^[6-9]\d{9}$/.test(finalPhone)) {
      return res.status(400).json({
        error: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
      });
    }

    const inquiryId = `EST-${nanoid(8).toUpperCase()}`;
    const newInquiry = await db.createInquiry({
      id: inquiryId,
      name: finalName,
      phone: finalPhone,
      service: finalService,
      message: finalMessage,
      status: "New",
      createdAt: new Date().toISOString(),
    });

    try {
      const mailer = require("./utils/mailer");
      if (typeof mailer.sendAdminInquiryEmail === "function") {
        await mailer.sendAdminInquiryEmail(newInquiry);
      }
    } catch (e) {
      console.warn("Could not send admin email for quote inquiry:", e.message);
    }

    return res.json({
      ok: true,
      id: inquiryId,
      message: "Quotation request submitted! Our expert will call you shortly.",
      inquiry: newInquiry,
    });
  } catch (err) {
    console.error("Error creating quote inquiry:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/inquiries", requireAdmin, async (req, res) => {
  try {
    const list = await db.getInquiries();
    return res.json(list || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.patch("/api/inquiries/:id", requireAdmin, async (req, res) => {
  try {
    // One consistent set of statuses: New / Contacted / Resolved
    const allowed = { new: "New", pending: "New", contacted: "Contacted", resolved: "Resolved" };
    const status = allowed[String(req.body?.status || "contacted").toLowerCase()];
    if (!status) return res.status(400).json({ error: "Invalid status." });
    await db.updateInquiryStatus(req.params.id, status);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/inquiries/:id", requireAdmin, async (req, res) => {
  try {
    await db.deleteInquiry(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Global API 404 & Error Handler Middleware
app.all("/api/*", (req, res) => {
  res.status(404).json({ ok: false, error: `API endpoint '${req.path}' not found` });
});

app.use((err, req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.error("API Internal Error:", err);
    if (!res.headersSent) {
      return res.status(err.status || 500).json({
        ok: false,
        error: err.message || "Internal Server Error",
      });
    }
  }
  next(err);
});

// Fallback all non-API HTML routes directly to the production Client SPA index.html
app.all("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  // Never return index.html or 503 for static asset requests that were not found
  if (
    req.path.startsWith("/assets/") ||
    req.path.endsWith(".js") ||
    req.path.endsWith(".css") ||
    req.path.endsWith(".json") ||
    req.path.endsWith(".png") ||
    req.path.endsWith(".jpg") ||
    req.path.endsWith(".svg") ||
    req.path.endsWith(".ico")
  ) {
    return res.status(404).send("Asset Not Found");
  }

  for (const dir of candidatePublicDirs) {
    const clientIndexPath = path.join(dir, "index.html");
    if (fs.existsSync(clientIndexPath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.sendFile(clientIndexPath);
    }
  }

  return res
    .status(503)
    .send(
      "Frontend is building or not loaded yet. Please refresh in a moment.",
    );
});

// Housekeeping: purge expired OTPs, rate-limit buckets and old payment orders every 5 minutes
// (these live in memory, so they must not grow forever), and keep SSE connections alive.
setInterval(() => {
  [forgotPasswordOtps, adminOtps, mobileOtps, adminRegOtps].forEach((store) => store.sweep());
  const now = Date.now();
  for (const [k, v] of rateBuckets) if (now > v.resetAt) rateBuckets.delete(k);
  for (const [k, v] of razorpayOrders) if (now - v.createdAt > 24 * 60 * 60 * 1000) razorpayOrders.delete(k);
}, 5 * 60 * 1000).unref();
setInterval(() => {
  sseClients.forEach((r) => {
    try {
      r.write(": keep-alive\n\n");
    } catch (e) {
      sseClients.delete(r);
    }
  });
}, 25000).unref();

db.initDb().then(async () => {
  server.listen(PORT, () => {
    console.log(
      `\n  TheDeep CleanerZ server running with Live Engine (WebSockets + SSE) → http://localhost:${PORT}\n`,
    );
  });
});
