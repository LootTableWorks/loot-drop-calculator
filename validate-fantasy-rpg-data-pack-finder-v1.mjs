import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const pageRoot = path.join(root, "choose-world-foundry-module");
const html = fs.readFileSync(path.join(pageRoot, "index.html"), "utf8");
const css = fs.readFileSync(path.join(pageRoot, "styles.css"), "utf8");
const app = fs.readFileSync(path.join(pageRoot, "app.js"), "utf8");
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const harborAcquisition = JSON.parse(
  fs.readFileSync(path.join(root, "gullwatch-harbor-acquisition-v1.json"), "utf8"),
);
const harborManifest = JSON.parse(
  fs.readFileSync(path.join(root, "gullwatch-harbor", "MANIFEST.json"), "utf8"),
);

let checks = 0;
function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

function meta(kind, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`<meta\\s+${kind}="${escaped}"\\s+content="([^"]+)"`, "i"))?.[1] ?? null;
}

const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
check(title === "Fantasy RPG Data Packs (JSON + CSV) for Unity &amp; Godot", "Search title drift");
check(meta("name", "description")?.includes("six $3 fantasy RPG data packs"), "Commercial search description missing");
check(meta("property", "og:title")?.includes("Fantasy RPG Data Packs"), "Open Graph commercial title missing");
check(html.includes('id="selector-title">Choose production-ready fantasy RPG data without rebuilding it.'), "High-intent H1 missing");
check(html.includes("JSON and CSV"), "Visible JSON and CSV intent missing");
check(html.includes("Unity, Godot 4, TypeScript, JavaScript"), "Visible integration intent missing");
check(html.includes("Inspect 100 free records"), "Primary demo trust CTA missing");
check(html.includes('app.js?v=1.1.1'), "Finder runtime cache key drift");

const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
const graph = jsonLd.flatMap((entry) => entry["@graph"] ?? [entry]);
const catalog = graph.find((entry) => entry["@type"] === "ItemList");
check(Boolean(catalog), "Seven-offer ItemList schema missing");
check(catalog.numberOfItems === 7, "Structured product count drift");
check(catalog.itemListElement.length === 7, "Structured product list length drift");
const products = catalog.itemListElement.map((entry) => entry.item);
check(new Set(products.map((product) => product.name)).size === 7, "Structured product names are not unique");
check(products.filter((product) => product.offers.price === "3").length === 6, "Six $3 data-pack offers required");
check(products.filter((product) => product.offers.price === "2.99").length === 1, "One $2.99 campaign offer required");

check(html.includes('id="campaign-route"'), "Campaign intent branch missing");
check(html.includes("61-page PDF"), "Campaign deliverable claim missing");
check(html.includes("nineteen linked scenes"), "Campaign scene claim missing");
check(html.includes('data-offer-id="gullwatch_harbor"'), "Campaign checkout marker missing");
check(html.includes("../buy/?offer=gullwatch_harbor"), "Campaign owned checkout route missing");
check(html.includes("../gullwatch-harbor/?utm_source=data_pack_finder"), "Campaign free-sample route missing");

const offerIds = [...html.matchAll(/data-offer-id="([^"]+)"/g)].map((match) => match[1]);
for (const offerId of ["item", "merchant", "recipe", "loot", "quest", "encounter", "gullwatch_harbor"]) {
  check(offerIds.includes(offerId), `${offerId}: static offer marker missing`);
  check(html.includes(`../buy/?offer=${offerId}`), `${offerId}: owned checkout route missing`);
}
check(!html.includes("offer=bundle"), "Private bundle route exposed");
check((html.match(/<tbody>[\s\S]*?<\/tbody>/g) || [""])[0].match(/<tr>/g)?.length === 6, "Static six-pack comparison drift");
check(html.includes("commercial-use terms"), "Commercial-use terms disclosure missing");
check(html.includes("AI-assisted and human-reviewed"), "Creation disclosure missing");
check(html.includes("not visual asset, battle-map, token, audio, or rules-engine packs"), "Product boundary missing");
check(html.includes("Engine starters and specialized utilities vary by pack"), "Compatibility boundary missing");

check(css.includes(".intent-proof"), "Intent proof styling missing");
check(css.includes(".campaign-route"), "Campaign route styling missing");
check(css.includes("@media (max-width: 470px)"), "Narrow-mobile styling missing");
check(app.includes("const MODULES ="), "Interactive selector runtime missing");
check(Object.keys({ item: 1, merchant: 1, recipe: 1, loot: 1, quest: 1, encounter: 1 }).every((offer) => app.includes(`../buy/?offer=${offer}`)), "Interactive checkout routes drift");
check(app.includes('querySelectorAll(\'a[data-link-kind="marketplace-checkout"]\')'), "All static checkout routes must preserve incoming attribution");
check(app.includes("const ACQUISITION_SOURCE_CONTRACTS"), "Qualified acquisition allowlist missing");
check(app.includes('gamestruction: Object.freeze({'), "Gamestruction source contract missing");
check(app.includes('medium: "tool_directory"'), "Gamestruction medium contract missing");
check(app.includes('campaign: "ltw_data_pack_discovery_v1"'), "Gamestruction campaign contract missing");
check(app.includes('if (!Object.hasOwn(ACQUISITION_SOURCE_CONTRACTS, source)) return null;'), "Unknown acquisition sources must fail closed");
check(
  JSON.stringify(harborAcquisition.commerce_boundary.verified_public_storefronts) ===
    JSON.stringify(harborManifest.verified_public_storefronts),
  "Gullwatch public storefront manifests disagree",
);
check(
  harborAcquisition.commerce_boundary.checkout_links_exposed ===
    harborManifest.checkout_links_exposed,
  "Gullwatch checkout-link manifests disagree",
);
check(
  harborAcquisition.commerce_boundary.purchase_available_claimed === true,
  "Gullwatch acquisition packet still denies public commerce",
);
check(sitemap.includes("choose-world-foundry-module/</loc>\n    <lastmod>2026-08-04</lastmod>"), "Selector sitemap date not refreshed");

console.log(`Fantasy RPG data-pack finder v1 passed ${checks} static discovery, product, pricing, checkout, disclosure, and responsive-contract checks.`);
