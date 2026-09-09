import fs from "node:fs";
import { execSync } from "node:child_process";

if (!fs.existsSync("dist/client")) {
  fs.mkdirSync("dist/client", { recursive: true });
}
if (!fs.existsSync("android/app/src/main/assets")) {
  fs.mkdirSync("android/app/src/main/assets", { recursive: true });
}
if (fs.existsSync("public/index.html")) {
  fs.copyFileSync("public/index.html", "dist/client/index.html");
}

console.log("Assets prepared. Running Capacitor Android sync...");
execSync("npx @capacitor/cli sync android", { stdio: "inherit" });
