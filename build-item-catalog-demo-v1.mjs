import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.join(root, "item-catalog-demo");
const manifestPath = path.join(demoRoot, "MANIFEST.json");

function fileRecord(absolutePath) {
  const bytes = fs.readFileSync(absolutePath);
  return {
    path: path.relative(demoRoot, absolutePath).replaceAll("\\", "/"),
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
}

function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collect(absolutePath);
      }
      if (absolutePath === manifestPath) {
        return [];
      }
      return [fileRecord(absolutePath)];
    })
    .sort((left, right) => left.path.localeCompare(right.path));
}

const index = fs.readFileSync(path.join(demoRoot, "index.html"));
const launchpad = fs.readFileSync(path.join(demoRoot, "START-HERE.html"));
if (!index.equals(launchpad)) {
  throw new Error("Hosted index must remain byte-identical to START-HERE.html");
}

const items = JSON.parse(fs.readFileSync(path.join(demoRoot, "items.json"), "utf8"));
if (items.length !== 100 || new Set(items.map((item) => item.id)).size !== 100) {
  throw new Error("Hosted demo must contain 100 unique item IDs");
}

const archivePath = path.join(
  demoRoot,
  "downloads",
  "world-foundry-item-catalog-demo-v2-rc3.zip",
);
const archive = fs.readFileSync(archivePath);
const archiveSha256 = crypto.createHash("sha256").update(archive).digest("hex");
if (
  archive.length !== 1334983 ||
  archiveSha256 !==
    "27658cc2be956148aa626996a0238a02758b7379e79d50cdffbe08444f0c97be"
) {
  throw new Error("Hosted demo archive drift");
}

const manifest = {
  schema_version: "1.0.0",
  product: "World Foundry Item Catalog free demo",
  version: "2.0.0-rc3",
  canonical_url:
    "https://loottableworks.github.io/loot-drop-calculator/item-catalog-demo/",
  publication_allowed: true,
  item_count: 100,
  unique_item_ids: 100,
  family_count: new Set(items.map((item) => item.family_id)).size,
  biome_count: new Set(items.map((item) => item.biome)).size,
  category_count: new Set(items.map((item) => item.category)).size,
  tier_count: new Set(items.map((item) => item.tier)).size,
  paid_upgrade_price_usd: 3,
  paid_upgrade_campaign: "paid_catalog_feature_v1",
  archive: {
    path: "downloads/world-foundry-item-catalog-demo-v2-rc3.zip",
    bytes: archive.length,
    sha256: archiveSha256,
  },
  files: collect(demoRoot),
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Built hosted Item Catalog demo manifest with ${manifest.files.length} files.`,
);
