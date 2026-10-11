import fs from "fs";
const code = fs.readFileSync("scratch_live_bundle.js", "utf8");
const idx = code.indexOf("/checkout");
console.log("/checkout found at:", idx);
if (idx !== -1) {
  console.log("Context around /checkout:", code.substring(Math.max(0, idx - 200), idx + 400));
}
// Find "Choose Service Schedule"
const idx2 = code.indexOf("Choose Service Schedule");
console.log("Choose Service Schedule found at:", idx2);
if (idx2 !== -1) {
  console.log("Context around Choose Service Schedule:", code.substring(Math.max(0, idx2 - 500), idx2 + 500));
}
