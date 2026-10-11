import fs from "fs";
const code = fs.readFileSync("scratch_live_bundle.js", "utf8");
const idx = code.indexOf("Choose Service Schedule");
const snippet = code.substring(idx - 10000, idx - 3000);
console.log("Hooks / effects snippet:", snippet);
