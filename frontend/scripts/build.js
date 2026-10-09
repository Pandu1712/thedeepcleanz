import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const distClientDir = path.resolve("dist/client");
const publicDir = path.resolve("public");

console.log("\n==========================================");
console.log("  TheDeep CleanerZ — Unified Build Pipeline");
console.log("==========================================\n");

// 1. Build TanStack Start SSR & Base Assets
console.log("[1/4] Building TanStack Start SSR assets (vite build)...");
try {
  execSync("npx vite build", { stdio: "inherit" });
} catch (e) {
  console.error("[build.js] TanStack Start build failed:", e.message);
  process.exit(1);
}

// 2. Build Client SPA Bundle with explicit HTML & CSS link
console.log("\n[2/4] Building Client SPA bundle (vite.spa.config.ts)...");
try {
  execSync("npx vite build --config vite.spa.config.ts", { stdio: "inherit" });
} catch (e) {
  console.error("[build.js] Client SPA build failed:", e.message);
  process.exit(1);
}

// 3. Recursive copy public/ static assets into dist/client/
console.log("\n[3/4] Syncing static public assets into dist/client/...");
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(publicDir)) {
  copyDirRecursive(publicDir, distClientDir);
}

// 4. Verify Built Artifacts
console.log("\n[4/4] Verifying production build integrity...");
const indexHtmlPath = path.join(distClientDir, "index.html");
const assetsDir = path.join(distClientDir, "assets");

if (!fs.existsSync(indexHtmlPath)) {
  console.error("ERROR: dist/client/index.html was not generated!");
  process.exit(1);
}

const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
const cssFiles = assets.filter((f) => f.endsWith(".css"));
const jsFiles = assets.filter((f) => f.endsWith(".js"));

console.log(`✓ dist/client/index.html ready (${(fs.statSync(indexHtmlPath).size / 1024).toFixed(1)} KB)`);
console.log(`✓ CSS Bundles found (${cssFiles.length}):`, cssFiles.join(", "));
console.log(`✓ JS Chunks found (${jsFiles.length})`);
// 5. Sync into backend/public/ for production deployment
const backendPublicDir = path.resolve("../backend/public");
if (fs.existsSync(backendPublicDir)) {
  console.log("\n[5/5] Syncing compiled assets into backend/public...");
  copyDirRecursive(distClientDir, backendPublicDir);
  console.log("✓ backend/public synchronized with latest client build!");
}

console.log("\n==========================================");
console.log("  BUILD COMPLETED SUCCESSFULLY!");
console.log("==========================================\n");
