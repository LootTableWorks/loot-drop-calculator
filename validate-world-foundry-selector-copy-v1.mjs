import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const index = read("choose-world-foundry-module/index.html");
const script = read("choose-world-foundry-module/app.js");
const paidAssetBoundary =
  "Structured item data, 100 mapped inventory icons, four sprite sheets, and offline workflow tools. No maps, audio, hosted service, or rules-specific stat blocks.";

const checks = [
  [index.includes(paidAssetBoundary), "Fallback paid-asset boundary changed"],
  [script.includes(paidAssetBoundary), "Dynamic paid-asset boundary changed"],
  [!index.includes("No icons, sprites"), "Fallback copy contradicts asset proof"],
  [!script.includes("No icons, sprites"), "Dynamic copy contradicts asset proof"],
  [index.includes("<strong>100</strong> mapped icons"), "Fallback icon proof changed"],
  [script.includes('["100", "mapped icons"]'), "Dynamic icon proof changed"],
  [script.includes("../buy/?offer=item"), "Item checkout route changed"],
];

for (const [passed, message] of checks) {
  if (!passed) throw new Error(message);
}

console.log(
  `World Foundry selector copy passed ${checks.length} asset-proof and checkout-route checks.`,
);
