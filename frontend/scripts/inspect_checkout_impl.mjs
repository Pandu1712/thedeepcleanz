import fs from "fs";
const code = fs.readFileSync("scratch_live_bundle.js", "utf8");
const idx = code.indexOf("Choose Service Schedule");
// Let's find the component function beginning before this index
const start = Math.max(0, idx - 15000);
const snippet = code.substring(start, idx);
console.log("Snippet before Choose Service Schedule (last 3000 chars):", snippet.slice(-3000));
