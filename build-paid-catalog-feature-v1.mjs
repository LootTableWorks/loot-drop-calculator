import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

function committedBytes(filePath) {
  return fs.readFileSync(filePath).toString("binary").replaceAll("\r\n", "\n");
}

function record(relativePath) {
  const binary = committedBytes(path.join(root, relativePath));
  const bytes = Buffer.from(binary, "binary");
  return {
    path: relativePath.replaceAll("\\", "/"),
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const freeToolsManifestPath = path.join(root, "free-rpg-tools", "MANIFEST.json");
const freeToolsManifest = JSON.parse(
  fs.readFileSync(freeToolsManifestPath, "utf8"),
);
freeToolsManifest.version = "1.5.0";
freeToolsManifest.paid_catalog_hero_destinations = 1;
freeToolsManifest.files = freeToolsManifest.files.map((entry) => {
  if (entry.path !== "index.html") {
    return entry;
  }
  const updated = record("free-rpg-tools/index.html");
  return {
    path: "index.html",
    bytes: updated.bytes,
    sha256: updated.sha256,
  };
});
writeJson(freeToolsManifestPath, freeToolsManifest);

const acquisitionPath = path.join(root, "gullwatch-harbor-acquisition-v1.json");
const acquisition = JSON.parse(fs.readFileSync(acquisitionPath, "utf8"));
const acquisitionPaths = new Set([
  "index.html",
  "free-rpg-tools/index.html",
  "free-rpg-tools/MANIFEST.json",
]);
acquisition.files = acquisition.files.map((entry) => {
  if (!acquisitionPaths.has(entry.path)) {
    return entry;
  }
  return record(entry.path);
});
writeJson(acquisitionPath, acquisition);

console.log(
  "Built paid catalog feature v1 contracts: Free RPG Tools 1.5.0 and refreshed Gullwatch acquisition file records.",
);
