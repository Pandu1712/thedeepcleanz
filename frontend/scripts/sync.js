import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const distClientDir = path.resolve("dist/client");
const androidPublicDir = path.resolve("android/app/src/main/assets/public");

if (!fs.existsSync(distClientDir)) {
  fs.mkdirSync(distClientDir, { recursive: true });
}
if (!fs.existsSync(androidPublicDir)) {
  fs.mkdirSync(androidPublicDir, { recursive: true });
}

// 1. Find the compiled CSS and JS entry assets in dist/client/assets
const assetsDir = path.join(distClientDir, "assets");
let cssFiles = [];
let jsFiles = [];

if (fs.existsSync(assetsDir)) {
  const allAssets = fs.readdirSync(assetsDir);
  cssFiles = allAssets.filter((f) => f.endsWith(".css"));
  jsFiles = allAssets.filter((f) => f.endsWith(".js") && f.startsWith("index-"));
  // Fallback to any js if index- is not found
  if (jsFiles.length === 0) {
    jsFiles = allAssets.filter((f) => f.endsWith(".js"));
  }
}

// 2. Generate a fully hydrated index.html for SPA / Static Web / Mobile App
let indexTemplate = "";
if (fs.existsSync("index.html")) {
  indexTemplate = fs.readFileSync("index.html", "utf8");
} else {
  indexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>TheDeep CleanerZ — Premium Deep Cleaning & Sanitization Services</title>
  <link rel="icon" type="image/png" href="/logos/logo.png" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&family=Urbanist:wght@300;400;500;600;700;800&family=Epilogue:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
</head>
<body class="bg-background text-foreground antialiased selection:bg-emerald-500/20">
  <div id="root"></div>
</body>
</html>`;
}

// Remove raw development script if present
indexTemplate = indexTemplate.replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/g, "");

// Inject CSS link tags
let cssTags = cssFiles.map((f) => `  <link rel="stylesheet" href="/assets/${f}" />`).join("\n");

// Inject JS script tags
let jsTags = jsFiles.map((f) => `  <script type="module" src="/assets/${f}"></script>`).join("\n");

let finalHtml = indexTemplate;
if (cssTags && !finalHtml.includes(cssFiles[0])) {
  finalHtml = finalHtml.replace("</head>", `${cssTags}\n</head>`);
}
if (jsTags) {
  finalHtml = finalHtml.replace("</body>", `${jsTags}\n</body>`);
}

// Write to dist/client/index.html
fs.writeFileSync(path.join(distClientDir, "index.html"), finalHtml, "utf8");
console.log("[sync.js] Generated production index.html with assets:", { cssFiles, jsFiles });

// 3. Copy public static assets (logos, icons, images) into dist/client
if (fs.existsSync("public")) {
  copyDirRecursive("public", distClientDir);
}

// 4. Recursive copy to android/app/src/main/assets/public
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
console.log("[sync.js] Synced all assets to Android webview asset bundle.");

// 5. Run Capacitor Sync
try {
  console.log("[sync.js] Running Capacitor Android sync...");
  execSync("npx -y @capacitor/cli sync android", { stdio: "inherit" });
} catch (e) {
  console.warn("[sync.js] Capacitor CLI sync warning:", e.message);
}

// 6. Run Patch Script
try {
  execSync("node scripts/patch-capacitor.js", { stdio: "inherit" });
} catch (e) {
  console.warn("[sync.js] Patch error:", e.message);
}
