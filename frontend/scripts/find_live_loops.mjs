import fs from "fs";
const code = fs.readFileSync("scratch_live_bundle.js", "utf8");

// Search for setInterval or requestAnimationFrame or recursive functions
const intervals = [...code.matchAll(/setInterval\s*\([^,]+,\s*(\d+)\)/g)].map(m => m[0]);
console.log("setInterval calls:", intervals.slice(0, 20));

// Search for while loops
const whiles = [...code.matchAll(/while\s*\([^)]+\)/g)].map(m => m[0]);
console.log("while loops:", whiles);

// Let's check Recaptcha in scratch_live_bundle.js
const recaptchas = [...code.matchAll(/recaptcha[a-zA-Z0-9_]*/gi)].map(m => m[0]);
console.log("Recaptcha mentions:", new Set(recaptchas));
