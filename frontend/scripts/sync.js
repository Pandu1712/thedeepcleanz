import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const distClientDir = path.resolve("dist/client");
const androidPublicDir = path.resolve("android/app/src/main/assets/public");

console.log("[sync.js] 1. Building Standalone Client SPA for Android & Web...");
try {
  execSync("npx vite build --config vite.spa.config.ts", { stdio: "inherit" });
} catch (e) {
  console.error("[sync.js] Vite SPA build error:", e.message);
  process.exit(1);
}

if (!fs.existsSync(distClientDir)) {
  fs.mkdirSync(distClientDir, { recursive: true });
}
if (!fs.existsSync(androidPublicDir)) {
  fs.mkdirSync(androidPublicDir, { recursive: true });
}

// 2. Copy public static assets (logos, icons, images) into dist/client
if (fs.existsSync("public")) {
  copyDirRecursive("public", distClientDir);
}

// 3. Recursive copy to android/app/src/main/assets/public
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

copyDirRecursive(distClientDir, androidPublicDir);
console.log("[sync.js] Synced all compiled assets into Android native webview bundle.");

// 4. Run Capacitor Sync
try {
  console.log("[sync.js] Running Capacitor Android sync...");
  execSync("npx -y @capacitor/cli sync android", { stdio: "inherit" });
} catch (e) {
  console.warn("[sync.js] Capacitor CLI sync note:", e.message);
}

// 5. Run Patch Script
try {
  execSync("node scripts/patch-capacitor.js", { stdio: "inherit" });
} catch (e) {
  console.warn("[sync.js] Patch note:", e.message);
}

console.log("[sync.js] Mobile assets synchronization successfully complete!");
