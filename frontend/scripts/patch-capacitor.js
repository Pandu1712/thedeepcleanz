import fs from "node:fs";
import path from "node:path";

const filesToPatch = [
  "node_modules/@capacitor/android/capacitor/build.gradle",
  "node_modules/@capacitor/splash-screen/android/build.gradle",
  "node_modules/@capacitor/status-bar/android/build.gradle",
];

for (const rel of filesToPatch) {
  const p = path.resolve(rel);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, "utf8");
    if (content.includes("8.13.0")) {
      content = content.replaceAll("8.13.0", "8.8.1");
      fs.writeFileSync(p, content, "utf8");
      console.log(`[patch-capacitor] Patched 8.13.0 -> 8.8.1 in ${rel}`);
    }
  }
}
