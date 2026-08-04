import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const registry = require("./world-foundry/storefront-registry.js");
const checkout = require("./buy/app.js");
const buyHtml = fs.readFileSync(path.join(root, "buy", "index.html"), "utf8");
const buyCss = fs.readFileSync(path.join(root, "buy", "styles.css"), "utf8");

let checks = 0;
function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

function htmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(absolute));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
}

check(buyHtml.includes('id="checkout-title"'), "Checkout title region missing");
check(buyHtml.includes('id="store-options"'), "Store option region missing");
check(buyHtml.includes("../world-foundry/storefront-registry.js?v=3.0.1"), "Registry version drift");
check(buyHtml.includes("app.js?v=1.0.0"), "Checkout app version drift");
check(buyCss.includes(".store-option"), "Store option styling missing");
check(buyCss.includes("@media (max-width: 620px)"), "Mobile checkout layout missing");
check(checkout.priceLabel(3) === "$3", "Whole-dollar label drift");
check(checkout.priceLabel(2.99) === "$2.99", "Decimal price label drift");

const ownedBase = "https://loottableworks.github.io/loot-drop-calculator/";
const paidIntent = /\$3|paid|full kit|pack|module|inspect|shops/i;
const excludedDirectFallbacks = new Set([
  path.join(root, "world-foundry", "index.html"),
  path.join(root, "gullwatch-beacon", "START-HERE.html")
]);
const routeLinks = [];

for (const file of htmlFiles(root)) {
  const html = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const pageUrl = new URL(relative, ownedBase);
  const anchorPattern = /<a\b([^>]*?)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    const attributes = `${match[1]}${match[3]}`;
    const href = match[2].replaceAll("&amp;", "&");
    const text = match[4].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    if (href.includes("/buy/?offer=")) {
      const destination = new URL(href, pageUrl);
      const offerId = destination.searchParams.get("offer");
      const marker = attributes.match(/data-offer-id="([^"]+)"/)?.[1] || "";
      check(destination.pathname.endsWith("/loot-drop-calculator/buy/"), `${relative}: route path drift`);
      check(Boolean(registry.offers[offerId]), `${relative}: unknown routed offer`);
      check(marker === offerId, `${relative}: route marker and offer query mismatch`);
      for (const key of checkout.ATTRIBUTION_KEYS) {
        check(Boolean(destination.searchParams.get(key)), `${relative}: ${key} missing`);
      }
      routeLinks.push({ file: relative, offerId, href: destination.toString() });
    }

    const directPaidItch =
      href.startsWith("https://loot-table-works.itch.io/") &&
      paidIntent.test(text) &&
      !/free demo/i.test(text);
    if (directPaidItch && !excludedDirectFallbacks.has(file)) {
      throw new Error(`${relative}: paid link bypasses the verified checkout router`);
    }
  }
}

check(routeLinks.length === 71, `Expected 71 routed paid links, found ${routeLinks.length}`);
check(new Set(routeLinks.map((entry) => entry.file)).size === 15, "Routed page count drift");
for (const offerId of ["item", "merchant", "recipe", "loot", "quest", "encounter"]) {
  check(routeLinks.some((entry) => entry.offerId === offerId), `${offerId}: no routed buyer path`);
}

const singleLocation = {
  href: `${ownedBase}buy/?offer=item&utm_source=integration_guides&utm_medium=seo_guide&utm_campaign=schema_design&utm_content=item_upgrade`
};
const single = checkout.resolveRequest(singleLocation, registry);
check(single.state === "single", "Current item checkout must resolve to one verified store");
check(single.stores.length === 1, "Current item checkout store count drift");
check(single.stores[0].id === "itch", "Current item checkout must retain itch fallback");
const singleUrl = new URL(single.stores[0].url);
check(singleUrl.searchParams.get("utm_source") === "integration_guides", "Source attribution lost");
check(singleUrl.searchParams.get("utm_medium") === "seo_guide", "Medium attribution lost");
check(singleUrl.searchParams.get("utm_campaign") === "schema_design", "Campaign attribution lost");
check(singleUrl.searchParams.get("utm_content") === "item_upgrade", "Content attribution lost");
check(singleUrl.searchParams.get("utm_term") === "itch", "Store attribution missing");

const unknown = checkout.resolveRequest(
  { href: `${ownedBase}buy/?offer=unknown&utm_source=test` },
  registry
);
check(unknown.state === "blocked", "Unknown offer must fail closed");

const gullwatch = checkout.resolveRequest(
  { href: `${ownedBase}buy/?offer=gullwatch_harbor&utm_source=test` },
  registry
);
check(gullwatch.state === "single", "Gullwatch Harbor must resolve to one verified store");
check(gullwatch.stores.length === 1, "Gullwatch Harbor store count drift");
check(gullwatch.stores[0].id === "itch", "Gullwatch Harbor must resolve to itch.io");

const futureOffers = JSON.parse(JSON.stringify(registry.offers));
const futurePolicies = JSON.parse(JSON.stringify(registry.STORE_POLICIES));
const gumroadUrl = "https://loottableworks.gumroad.com/l/verified-item-catalog";
futureOffers.item.stores.gumroad = { status: "public", url: gumroadUrl, priceUsd: 3 };
futurePolicies.gumroad.approvedCanonicalUrls = [gumroadUrl];
const futureRegistry = {
  offers: futureOffers,
  validateRegistry: (offers) => registry.validateRegistry(offers, futurePolicies),
  resolvePublicStores: (offerId, _offers, _policies, attribution) =>
    registry.resolvePublicStores(offerId, futureOffers, futurePolicies, attribution)
};
const multiple = checkout.resolveRequest(singleLocation, futureRegistry);
check(multiple.state === "multiple", "Two verified stores must render a choice");
check(multiple.stores.length === 2, "Future multi-store count drift");
check(
  multiple.stores.every((store) => new URL(store.url).searchParams.get("utm_source") === "integration_guides"),
  "Multi-store routes must preserve source attribution"
);

console.log(
  `Validated marketplace checkout router v1: ${checks} checks; ${routeLinks.length} paid links across 15 pages route through exact public URL gates.`
);
