import fs from "node:fs";
import path from "node:path";

const filesToPatch = [
  "node_modules/@capacitor/android/capacitor/build.gradle",
  "node_modules/@capacitor/splash-screen/android/build.gradle",
  "node_modules/@capacitor/status-bar/android/build.gradle",
  "android/capacitor-cordova-android-plugins/build.gradle",
];

for (const rel of filesToPatch) {
  const p = path.resolve(rel);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, "utf8");
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
      fs.writeFileSync(p, content, "utf8");
      console.log(`[patch-capacitor] Patched versions in ${rel}`);
    }
  }
}


