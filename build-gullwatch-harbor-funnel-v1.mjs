import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

function fileRecord(base, relativePath) {
  const bytes = fs.readFileSync(path.join(base, relativePath));
  return {
    path: relativePath.replaceAll("\\", "/"),
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex")
  };
}

function writeManifest(directory, payload) {
  fs.writeFileSync(
    path.join(directory, "MANIFEST.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );
}

const worldFoundry = path.join(root, "world-foundry");
const worldFoundryFiles = [
  "README.md",
  "assets/campaign-workspace-preview-v1.png",
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "storefront-registry.js",
  "storefront-router.js",
  "styles.css"
];
writeManifest(worldFoundry, {
  product_id: "world-foundry-hub",
  version: "1.9.0",
  status: "approved_for_deployment",
  publication_allowed: true,
  deployment_allowed: true,
  public_release_requires_review: false,
  release_authority: "delegated_internal_aaa_qa",
  canonical_url: "https://loottableworks.github.io/loot-drop-calculator/world-foundry/",
  free_tool_destinations: 10,
  paid_standalone_destinations: 6,
  paid_offer_definitions: 7,
  storefront_registry_version: "2.0.0",
  public_storefronts: ["itch"],
  pending_storefronts: [
    "gumroad",
    "kofi",
    "payhip",
    "amazon_kdp",
    "google_play_books",
    "apple_books",
    "barnes_noble"
  ],
  draft_storefront_urls_exposed: 0,
  pending_storefront_controls_exposed: 0,
  external_runtime_dependencies: 0,
  files: worldFoundryFiles.map((file) => fileRecord(worldFoundry, file))
});

const product = path.join(root, "gullwatch-harbor");
const productFiles = [
  "README.md",
  "assets/gullwatch-harbor-cover-v1.jpg",
  "downloads/Gullwatch-Harbor-Sample-v1.epub",
  "downloads/Gullwatch-Harbor-Sample-v1.pdf",
  "index.html",
  "robots.txt",
  "styles.css"
];
writeManifest(product, {
  product_id: "gullwatch-harbor-product-funnel",
  version: "1.0.0",
  status: "approved_for_deployment",
  publication_allowed: true,
  deployment_allowed: true,
  public_release_requires_review: false,
  release_authority: "delegated_internal_aaa_qa",
  canonical_url: "https://loottableworks.github.io/loot-drop-calculator/gullwatch-harbor/",
  product: {
    title: "Gullwatch Harbor",
    price_usd: 2.99,
    pdf_pages: 61,
    sessions: 4,
    scenes: 19,
    players: "3-6"
  },
  preview: {
    pdf_pages: 12,
    complete_sessions_included: 0,
    opening_scenes_included: 1
  },
  verified_public_storefronts: [],
  pending_storefronts: [
    "gumroad",
    "kofi",
    "payhip",
    "amazon_kdp",
    "google_play_books",
    "apple_books",
    "barnes_noble"
  ],
  draft_storefront_urls_exposed: 0,
  checkout_links_exposed: 0,
  files: productFiles.map((file) => fileRecord(product, file))
});

console.log("Built World Foundry 1.9.0 and Gullwatch Harbor funnel 1.0.0 manifests.");
