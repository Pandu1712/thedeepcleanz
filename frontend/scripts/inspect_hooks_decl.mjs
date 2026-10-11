import fs from "fs";
const code = fs.readFileSync("scratch_live_bundle.js", "utf8");
const idx = code.indexOf("Choose Service Schedule");
const snippet = code.substring(idx - 25000, idx - 17000);
console.log("Hooks / state declaration snippet:", snippet);
