import fs from "fs";
const code = fs.readFileSync("scratch_live_bundle.js", "utf8");
const idx = code.indexOf("thedeepcleanerz_cart_v1");
console.log("Before cart v1 (500 chars):", code.substring(idx - 500, idx + 100));
