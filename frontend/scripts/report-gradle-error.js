import fs from "node:fs";

const logPaths = ["gradle_build.log", "frontend/android/gradle_build.log"];
let logText = "";

for (const p of logPaths) {
  if (fs.existsSync(p)) {
    logText = fs.readFileSync(p, "utf8");
    break;
  }
}

if (!logText) {
  console.log("[report-gradle-error] No gradle log found.");
  process.exit(0);
}

// Find failure point
let idx = logText.indexOf("FAILURE: Build failed");
if (idx === -1) idx = logText.indexOf("What went wrong:");
if (idx === -1) idx = logText.indexOf("ERROR:");
if (idx === -1) idx = logText.indexOf("Task failed with an exception");

let errorSnippet = "";
if (idx !== -1) {
  errorSnippet = logText.slice(Math.max(0, idx - 100), idx + 2500);
} else {
  errorSnippet = logText.slice(-2500);
}

console.log("==================== GRADLE ERROR REPORT ====================");
console.log(errorSnippet);
console.log("=============================================================");

// Format as GitHub Action Error Annotation
const encoded = errorSnippet
  .replaceAll("%", "%25")
  .replaceAll("\r", "%0D")
  .replaceAll("\n", "%0A");

console.log(`::error title=Gradle Build Failure::${encoded}`);
