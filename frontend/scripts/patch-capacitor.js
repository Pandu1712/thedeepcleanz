import fs from "node:fs";
import path from "node:path";

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;
    if (content.includes("8.13.0")) {
      content = content.replaceAll("8.13.0", "8.8.1");
      changed = true;
    }
    if (content.includes("'1.2.0'")) {
      content = content.replaceAll("'1.2.0'", "'1.0.1'");
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`[patch-capacitor] Patched: ${filePath}`);
    }
  } catch (e) {
    console.warn(`[patch-capacitor] Could not patch ${filePath}:`, e.message);
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith(".gradle")) {
        patchFile(fullPath);
      }
    }
  } catch (e) {
    console.warn(`[patch-capacitor] Error scanning directory ${dir}:`, e.message);
  }
}

// Explicit paths
const explicitFiles = [
  "node_modules/@capacitor/android/capacitor/build.gradle",
  "node_modules/@capacitor/splash-screen/android/build.gradle",
  "node_modules/@capacitor/status-bar/android/build.gradle",
  "android/capacitor-cordova-android-plugins/build.gradle",
];

for (const rel of explicitFiles) {
  patchFile(path.resolve(rel));
}

// Scan dirs
scanDir(path.resolve("node_modules/@capacitor"));
scanDir(path.resolve("android"));
