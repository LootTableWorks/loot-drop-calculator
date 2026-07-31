import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const registry = require("./world-foundry/storefront-registry.js");
const router = require("./world-foundry/storefront-router.js");
const directory = path.join(root, "gullwatch-harbor");
const html = fs.readFileSync(path.join(directory, "index.html"), "utf8");
const css = fs.readFileSync(path.join(directory, "styles.css"), "utf8");
const readme = fs.readFileSync(path.join(directory, "README.md"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(directory, "MANIFEST.json"), "utf8"));
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");

let checks = 0;
function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

check(manifest.product_id === "gullwatch-harbor-product-funnel", "Product ID drift");
check(manifest.version === "1.0.0", "Manifest version drift");
check(manifest.status === "approved_for_deployment", "Deployment approval missing");
check(manifest.publication_allowed === true, "Publication gate drift");
check(manifest.deployment_allowed === true, "Deployment gate drift");
check(manifest.public_release_requires_review === false, "Delegated review state drift");
check(manifest.product.title === "Gullwatch Harbor", "Product title drift");
check(manifest.product.price_usd === 2.99, "Product price drift");
check(manifest.product.pdf_pages === 61, "Full-edition page count drift");
check(manifest.product.sessions === 4, "Session count drift");
check(manifest.product.scenes === 19, "Scene count drift");
check(manifest.preview.pdf_pages === 12, "PDF preview page count drift");
check(manifest.preview.complete_sessions_included === 0, "Preview must not include a complete session");
check(manifest.preview.opening_scenes_included === 1, "Preview opening-scene boundary drift");
check(manifest.verified_public_storefronts.length === 0, "Unverified public store recorded");
check(manifest.pending_storefronts.length === 7, "Pending channel count drift");
check(manifest.draft_storefront_urls_exposed === 0, "Draft storefront exposure drift");
check(manifest.checkout_links_exposed === 0, "Checkout exposure drift");
check(readme.includes(`Status: \`${manifest.status}\``), "README status drift");

const expectedFiles = [
  "README.md",
  "assets/gullwatch-harbor-cover-v1.jpg",
  "downloads/Gullwatch-Harbor-Sample-v1.epub",
  "downloads/Gullwatch-Harbor-Sample-v1.pdf",
  "index.html",
  "robots.txt",
  "styles.css"
];
check(
  JSON.stringify(manifest.files.map((entry) => entry.path)) === JSON.stringify(expectedFiles),
  "Manifest inventory drift"
);
for (const entry of manifest.files) {
  const target = path.join(directory, entry.path);
  check(fs.existsSync(target), `${entry.path}: missing`);
  const bytes = fs.readFileSync(target);
  check(bytes.length === entry.bytes, `${entry.path}: byte count drift`);
  check(sha256(bytes) === entry.sha256, `${entry.path}: hash drift`);
}

const samplePdf = fs.readFileSync(
  path.join(directory, "downloads", "Gullwatch-Harbor-Sample-v1.pdf")
);
const sampleEpub = fs.readFileSync(
  path.join(directory, "downloads", "Gullwatch-Harbor-Sample-v1.epub")
);
const cover = fs.readFileSync(
  path.join(directory, "assets", "gullwatch-harbor-cover-v1.jpg")
);
check(
  sha256(samplePdf) === "025d8efca2d5427845c29bebbc42f2824bbfe9280157bc4f1626523aea33fa4c",
  "PDF sample source binding drift"
);
check(
  sha256(sampleEpub) === "13e234dfffe7d6677e89fe823c442ba5e4031f1c739918b202239d07c386bed9",
  "EPUB sample source binding drift"
);
check(
  sha256(cover) === "8206ab77b3915504435eadb68a8f397827aa518a4a8db82eb6a5d24ef66988a9",
  "Cover source binding drift"
);

for (const text of [
  "<h1 id=\"hero-title\">Gullwatch Harbor</h1>",
  "61</strong> pages",
  "4</strong> linked sessions",
  "19</strong> playable scenes",
  "3-6</strong> players",
  "Read the 12-page PDF sample",
  "Download EPUB sample",
  "Retail release in progress",
  "No draft checkout links are exposed",
  "Transparent AI-assisted text and visual-production disclosure",
  "data-offer-id=\"gullwatch_harbor\" hidden"
]) {
  check(html.includes(text), `Required product-page text missing: ${text}`);
}

for (const forbidden of [
  "loottableworks.gumroad.com/l/",
  "ko-fi.com/s/",
  "payhip.com/b/",
  "amazon.com/dp/",
  "play.google.com/store/books/details/",
  "books.apple.com/",
  "barnesandnoble.com/w/",
  "gradient(",
  "bokeh",
  "orb"
]) {
  check(!html.toLowerCase().includes(forbidden), `Forbidden HTML content: ${forbidden}`);
}
check(!css.includes("gradient("), "CSS gradient decoration is forbidden");
check(!/letter-spacing:\s*-/.test(css), "Negative letter spacing is forbidden");
check(!css.includes("border-radius: 999"), "Pill-shaped decoration is forbidden");
check(html.includes("class=\"hero-image\""), "Hero must use real product artwork");
check(html.includes('type="application/ld+json"'), "Book JSON-LD missing");
check(html.includes('"@type": "Book"'), "Book schema type missing");
check(html.includes('"numberOfPages": 61'), "Book schema page count missing");
check(
  sitemap.includes("https://loottableworks.github.io/loot-drop-calculator/gullwatch-harbor/"),
  "Root sitemap lacks product page"
);

check(registry.validateRegistry(registry.offers), "Shared storefront registry invalid");
const offer = registry.offers.gullwatch_harbor;
check(offer.priceUsd === 2.99, "Registry price drift");
check(router.priceLabel(offer.priceUsd) === "$2.99", "Router price rendering drift");
check(registry.resolvePublicStores("gullwatch_harbor").length === 0, "Pending offer exposed");
for (const storeId of manifest.pending_storefronts) {
  check(offer.stores[storeId].status === "pending", `${storeId}: pending state drift`);
  check(offer.stores[storeId].url === null, `${storeId}: draft URL exposed`);
  check(
    registry.STORE_POLICIES[storeId].approvedCanonicalUrls.length === 0,
    `${storeId}: unverified product identity is allowlisted`
  );
}

for (const [storeId, url] of Object.entries({
  amazon_kdp: "https://www.amazon.com/dp/B0GULLWATCH",
  google_play_books: "https://play.google.com/store/books/details/Gullwatch_Harbor?id=gullwatch",
  apple_books: "https://books.apple.com/us/book/gullwatch-harbor/id1234567890",
  barnes_noble: "https://www.barnesandnoble.com/w/gullwatch-harbor-loot-table-works/1140000000"
})) {
  const unapproved = JSON.parse(JSON.stringify(registry.offers));
  unapproved.gullwatch_harbor.stores[storeId] = { status: "public", url };
  assert.throws(
    () => registry.validateRegistry(unapproved),
    undefined,
    `${storeId}: in-domain but unapproved product must fail`
  );
  checks += 1;

  const future = JSON.parse(JSON.stringify(registry.offers));
  const futurePolicies = JSON.parse(JSON.stringify(registry.STORE_POLICIES));
  future.gullwatch_harbor.stores[storeId] = { status: "public", url };
  futurePolicies[storeId].approvedCanonicalUrls = [url];
  check(
    registry.validateRegistry(future, futurePolicies),
    `${storeId}: exact-allowlisted future state must validate`
  );
  const stores = registry.resolvePublicStores("gullwatch_harbor", future, futurePolicies);
  check(stores.length === 1, `${storeId}: future selector count drift`);
  const attributed = new URL(stores[0].url);
  check(attributed.searchParams.get("utm_source") === "world_foundry_hub", `${storeId}: source missing`);
  check(attributed.searchParams.get("utm_medium") === "storefront_selector", `${storeId}: medium missing`);
  check(attributed.searchParams.get("utm_campaign") === "gullwatch_harbor_book_v1", `${storeId}: campaign missing`);
  check(
    attributed.searchParams.get("utm_content") === "gullwatch_harbor_campaign_book",
    `${storeId}: content missing`
  );
  check(attributed.searchParams.get("utm_term") === storeId, `${storeId}: term missing`);
}

console.log(
  `Validated Gullwatch Harbor product funnel v1: ${checks} checks, zero checkout URLs exposed.`
);
