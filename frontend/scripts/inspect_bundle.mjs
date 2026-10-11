import fs from "fs";
const code = fs.readFileSync("scratch_live_bundle.js", "utf8");
console.log("Length:", code.length);
// Check dynamic imports
const dynImports = [...code.matchAll(/import\s*\(\s*["']([^"']+)["']\s*\)/g)].map(m => m[1]);
console.log("Dynamic imports:", dynImports);
// Check static imports
const staticImports = [...code.matchAll(/from\s*["']([^"']+)["']/g)].map(m => m[1]);
console.log("Static imports (count):", staticImports.length);
console.log("First 10 static imports:", staticImports.slice(0, 10));
