import fs from "fs";
const code = fs.readFileSync("scratch_live_bundle.js", "utf8");

let pos = 0;
while (true) {
  const idx = code.indexOf("while(1)", pos);
  if (idx === -1) break;
  console.log("while(1) found at:", idx);
  console.log("Context (300 chars):", code.substring(Math.max(0, idx - 100), idx + 200));
  pos = idx + 8;
}
