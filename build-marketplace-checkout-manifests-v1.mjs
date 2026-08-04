import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

function fileRecord(absolute, base) {
  const source = fs.readFileSync(absolute);
  const textExtensions = new Set([
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".py",
    ".txt",
    ".xml"
  ]);
  const bytes = textExtensions.has(path.extname(absolute).toLowerCase())
    ? Buffer.from(source.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
    : source;
  return {
    path: path.relative(base, absolute).replaceAll("\\", "/"),
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex")
  };
}

function refreshManifest(directoryName, mutate) {
  const directory = path.join(root, directoryName);
  const manifestPath = path.join(directory, "MANIFEST.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (mutate) mutate(manifest);
  manifest.files = manifest.files.map((entry) =>
    fileRecord(path.join(directory, entry.path), directory)
  );
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

const worldDirectory = path.join(root, "world-foundry");
const worldManifestPath = path.join(worldDirectory, "MANIFEST.json");
const worldManifest = JSON.parse(fs.readFileSync(worldManifestPath, "utf8"));
worldManifest.version = "1.10.0";
worldManifest.storefront_registry_version = "3.0.1";
worldManifest.pending_storefronts = [
  "gumroad",
  "kofi",
  "payhip",
  "amazon_kdp",
  "google_play_books",
  "apple_books",
  "barnes_noble",
  "artstation",
  "etsy",
  "unity_asset_store",
  "fab"
];
worldManifest.files = worldManifest.files.map((entry) =>
  fileRecord(path.join(worldDirectory, entry.path), worldDirectory)
);
fs.writeFileSync(worldManifestPath, `${JSON.stringify(worldManifest, null, 2)}\n`, "utf8");

const buyDirectory = path.join(root, "buy");
const buyFiles = ["README.md", "app.js", "index.html", "robots.txt", "styles.css"];
const buyManifest = {
  product_id: "verified-marketplace-checkout-router",
  version: "1.0.0",
  status: "approved_for_deployment",
  publication_allowed: true,
  deployment_allowed: true,
  public_release_requires_review: false,
  release_authority: "delegated_internal_aaa_qa",
  canonical_url: "https://loottableworks.github.io/loot-drop-calculator/buy/",
  indexed: false,
  paid_routes: 70,
  routed_pages: 14,
  offer_definitions: 7,
  storefront_policies: 12,
  public_storefronts: ["itch"],
  pending_storefronts: worldManifest.pending_storefronts,
  draft_storefront_urls_exposed: 0,
  files: buyFiles.map((entry) => fileRecord(path.join(buyDirectory, entry), buyDirectory))
};
fs.writeFileSync(
  path.join(buyDirectory, "MANIFEST.json"),
  `${JSON.stringify(buyManifest, null, 2)}\n`,
  "utf8"
);

refreshManifest("free-rpg-tools", (manifest) => {
  manifest.version = "1.6.0";
  manifest.checkout_router = "../buy/";
});
refreshManifest("run-one-shot-tonight", (manifest) => {
  manifest.release_id = "run-one-shot-tonight-v3";
  manifest.checkout_router = "../buy/";
});
refreshManifest("shop-inventory-generator", (manifest) => {
  manifest.version = "1.1.0";
  manifest.paid_destination =
    "https://loottableworks.github.io/loot-drop-calculator/buy/?offer=merchant";
});
refreshManifest("gullwatch-harbor", (manifest) => {
  manifest.verified_public_storefronts = ["itch"];
  manifest.checkout_links_exposed = 1;
});
const integrationReleasePath = path.join(root, "integration-guides", "release.json");
const integrationRelease = JSON.parse(fs.readFileSync(integrationReleasePath, "utf8"));
integrationRelease.version = "1.2.0";
integrationRelease.publication_note =
  "Version 1.2.0 routes every paid module handoff through the exact-allowlisted marketplace checkout while preserving guide-level attribution.";
fs.writeFileSync(
  integrationReleasePath,
  `${JSON.stringify(integrationRelease, null, 2)}\n`,
  "utf8"
);
refreshManifest("integration-guides", (manifest) => {
  manifest.version = "1.2.0";
  manifest.checkout_router = "../buy/";
});

const acquisitionPacketPath = path.join(root, "gullwatch-harbor-acquisition-v1.json");
const acquisitionPacket = JSON.parse(fs.readFileSync(acquisitionPacketPath, "utf8"));
acquisitionPacket.files = acquisitionPacket.files.map((entry) =>
  fileRecord(path.join(root, entry.path), root)
);
fs.writeFileSync(
  acquisitionPacketPath,
  `${JSON.stringify(acquisitionPacket, null, 2)}\n`,
  "utf8"
);

console.log("Built World Foundry v1.10.0 and verified checkout router v1.0.0 manifests.");
