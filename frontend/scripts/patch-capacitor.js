import fs from "node:fs";
import path from "node:path";

const versionMap = [
  ["8.13.0", "8.8.1"],
  ["'1.2.0'", "'1.0.1'"],
  ["'1.17.0'", "'1.15.0'"],
  ["'1.11.0'", "'1.9.3'"],
  ["'1.7.1'", "'1.7.0'"],
  ["'1.3.0'", "'1.2.0'"],
  ["'1.8.9'", "'1.8.5'"],
  ["'1.14.0'", "'1.12.1'"],
  ["'3.7.0'", "'3.6.1'"],
  ["'14.0.1'", "'10.1.1'"],
];

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;
    for (const [target, replacement] of versionMap) {
      if (content.includes(target)) {
        content = content.replaceAll(target, replacement);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`[patch-capacitor] Patched versions in: ${filePath}`);
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
    console.warn(`[patch-capacitor] Error scanning ${dir}:`, e.message);
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

// Scan directories
scanDir(path.resolve("node_modules/@capacitor"));
scanDir(path.resolve("android"));
