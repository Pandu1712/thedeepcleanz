import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

if (!fs.existsSync("dist/client")) {
  fs.mkdirSync("dist/client", { recursive: true });
}
if (!fs.existsSync("android/app/src/main/assets/public")) {
  fs.mkdirSync("android/app/src/main/assets/public", { recursive: true });
}
if (fs.existsSync("public/index.html")) {
  fs.copyFileSync("public/index.html", "dist/client/index.html");
}

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

copyDirRecursive("dist/client", "android/app/src/main/assets/public");

try {
  console.log("Running Capacitor Android sync...");
  execSync("npx -y @capacitor/cli sync android", { stdio: "inherit" });
} catch (e) {
  console.warn("Capacitor CLI sync warning:", e.message);
}

try {
  execSync("node scripts/patch-capacitor.js", { stdio: "inherit" });
} catch (e) {
  console.warn("Patch error:", e.message);
}
