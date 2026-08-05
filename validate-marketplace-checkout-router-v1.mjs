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
const buyManifest = JSON.parse(
  fs.readFileSync(path.join(root, "buy", "MANIFEST.json"), "utf8")
);

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
check(buyHtml.includes("app.js?v=1.1.8"), "Checkout app version drift");
check(
  buyHtml.indexOf("privacy-metrics-v1.js") < buyHtml.indexOf("app.js?v=1.1.8"),
  "Measurement handshake must load before checkout auto-redirect"
);
check(buyCss.includes(".store-option"), "Store option styling missing");
check(buyCss.includes("@media (max-width: 620px)"), "Mobile checkout layout missing");
check(buyManifest.version === "1.1.8", "Checkout manifest version drift");
check(buyManifest.paid_routes === 73, "Checkout paid-route manifest drift");
check(buyManifest.routed_pages === 15, "Checkout routed-page manifest drift");
check(buyManifest.measurement_candidate === "activation_gated", "Checkout measurement gate drift");
check(buyManifest.checkout_event_counts_as_verified_sale === false, "Checkout sale boundary drift");
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

check(routeLinks.length === 73, `Expected 73 routed paid links, found ${routeLinks.length}`);
check(new Set(routeLinks.map((entry) => entry.file)).size === 15, "Routed page count drift");
for (const offerId of ["item", "merchant", "recipe", "loot", "quest", "encounter", "gullwatch_harbor"]) {
  check(routeLinks.some((entry) => entry.offerId === offerId), `${offerId}: no routed buyer path`);
}
for (const route of routeLinks) {
  const request = checkout.readRequest({ href: route.href });
  const routeUrl = new URL(route.href);
  for (const key of checkout.ATTRIBUTION_KEYS) {
    check(
      request.attribution[key] === routeUrl.searchParams.get(key),
      `${route.file}: ${key} is not in the checkout allowlist`
    );
  }
}

const singleLocation = {
  href: `${ownedBase}buy/?offer=item&utm_source=integration_guides&utm_medium=seo_guide&utm_campaign=rpg_json_schema_design&utm_content=schema_item_catalog`
};
const single = checkout.resolveRequest(singleLocation, registry);
check(single.state === "single", "Current item checkout must resolve to one verified store");
check(single.stores.length === 1, "Current item checkout store count drift");
check(single.stores[0].id === "itch", "Current item checkout must retain itch fallback");
const singleUrl = new URL(single.stores[0].url);
check(singleUrl.searchParams.get("utm_source") === "integration_guides", "Source attribution lost");
check(singleUrl.searchParams.get("utm_medium") === "seo_guide", "Medium attribution lost");
check(
  singleUrl.searchParams.get("utm_campaign") === "rpg_json_schema_design",
  "Campaign attribution lost"
);
check(
  singleUrl.searchParams.get("utm_content") === "schema_item_catalog",
  "Content attribution lost"
);
check(singleUrl.searchParams.get("utm_term") === "itch", "Store attribution missing");

const gamestruction = checkout.resolveRequest(
  {
    href: `${ownedBase}buy/?offer=item&utm_source=gamestruction&utm_medium=tool_directory&utm_campaign=ltw_data_pack_discovery_v1&utm_content=item_catalog&utm_term=origin_gamestruction_item_catalog_demo_upgrade`
  },
  registry
);
const gamestructionUrl = new URL(gamestruction.stores[0].url);
check(gamestruction.state === "single", "Gamestruction checkout must resolve to one store");
check(gamestructionUrl.searchParams.get("utm_source") === "gamestruction", "Gamestruction source attribution lost");
check(gamestructionUrl.searchParams.get("utm_medium") === "tool_directory", "Gamestruction medium attribution lost");
check(gamestructionUrl.searchParams.get("utm_campaign") === "ltw_data_pack_discovery_v1", "Gamestruction campaign attribution lost");
check(gamestructionUrl.searchParams.get("utm_content") === "item_catalog", "Gamestruction offer content lost");
check(gamestructionUrl.searchParams.get("utm_term") === "itch", "Gamestruction storefront attribution lost");

for (const [label, href] of [
  ["medium", `${ownedBase}buy/?offer=item&utm_source=gamestruction&utm_medium=owned_web&utm_campaign=ltw_data_pack_discovery_v1&utm_content=item_catalog`],
  ["campaign", `${ownedBase}buy/?offer=item&utm_source=gamestruction&utm_medium=tool_directory&utm_campaign=standalone_modules&utm_content=item_catalog`],
  ["content", `${ownedBase}buy/?offer=item&utm_source=gamestruction&utm_medium=tool_directory&utm_campaign=ltw_data_pack_discovery_v1&utm_content=schema_item_catalog`],
  ["source", `${ownedBase}buy/?offer=item&utm_source=private_customer&utm_medium=tool_directory&utm_campaign=ltw_data_pack_discovery_v1&utm_content=item_catalog`],
  ["allowlisted_source", `${ownedBase}buy/?offer=item&utm_source=module_selector&utm_medium=tool_directory&utm_campaign=ltw_data_pack_discovery_v1&utm_content=item_catalog`],
  ["protected_medium_only", `${ownedBase}buy/?offer=item&utm_source=module_selector&utm_medium=tool_directory&utm_campaign=standalone_modules&utm_content=item_catalog`],
  ["protected_campaign_only", `${ownedBase}buy/?offer=item&utm_source=module_selector&utm_medium=owned_web&utm_campaign=ltw_data_pack_discovery_v1&utm_content=item_catalog`]
]) {
  const request = checkout.readRequest({ href });
  check(
    Object.keys(request.attribution).length === 0,
    `Mismatched Gamestruction ${label} tuple did not fail closed`
  );
  const fallbackUrl = new URL(checkout.resolveRequest({ href }, registry).stores[0].url);
  check(
    fallbackUrl.searchParams.get("utm_source") === "world_foundry_hub" &&
      fallbackUrl.searchParams.get("utm_medium") === "storefront_selector" &&
      fallbackUrl.searchParams.get("utm_campaign") === "standalone_modules" &&
      fallbackUrl.searchParams.get("utm_content") === "item_catalog",
    `Mismatched Gamestruction ${label} tuple did not use fixed fallback attribution`
  );
}

const oneShotContract = checkout.ATTRIBUTION_SOURCE_CONTRACTS.one_shot_forge;
const oneShotOfferContents = [
  ["gullwatch_harbor", "gullwatch_harbor_featured_campaign"],
  ["quest", "quests_recommended"],
  ["encounter", "encounters_recommended"],
  ["loot", "loot_profiles_recommended"],
  ["item", "items_recommended"],
  ["merchant", "merchants_recommended"],
  ["recipe", "recipes_recommended"]
];
for (const origin of ["", ...oneShotContract.origins]) {
  for (const [offerId, baseContent] of oneShotOfferContents) {
    const content = origin ? `${baseContent}_origin_${origin}` : baseContent;
    const href = `${ownedBase}buy/?offer=${offerId}&utm_source=one_shot_forge&utm_medium=free_tool&utm_campaign=one_shot_value_launch&utm_content=${content}`;
    const request = checkout.readRequest({ href });
    check(request.attribution.utm_source === "one_shot_forge", `${offerId}/${origin || "direct"}: source lost`);
    check(request.attribution.utm_medium === "free_tool", `${offerId}/${origin || "direct"}: medium lost`);
    check(request.attribution.utm_campaign === "one_shot_value_launch", `${offerId}/${origin || "direct"}: campaign lost`);
    check(request.attribution.utm_content === content, `${offerId}/${origin || "direct"}: content lost`);
    const resolution = checkout.resolveRequest({ href }, registry);
    check(resolution.state === "single", `${offerId}/${origin || "direct"}: checkout did not resolve`);
    const destination = new URL(resolution.stores[0].url);
    check(destination.searchParams.get("utm_source") === "one_shot_forge", `${offerId}/${origin || "direct"}: final source lost`);
    check(destination.searchParams.get("utm_medium") === "free_tool", `${offerId}/${origin || "direct"}: final medium lost`);
    check(destination.searchParams.get("utm_campaign") === "one_shot_value_launch", `${offerId}/${origin || "direct"}: final campaign lost`);
    check(destination.searchParams.get("utm_content") === content, `${offerId}/${origin || "direct"}: final content lost`);
    check(destination.searchParams.get("utm_term") === "itch", `${offerId}/${origin || "direct"}: final store lost`);
  }
}

for (const [label, href] of [
  ["source", `${ownedBase}buy/?offer=item&utm_source=module_selector&utm_medium=free_tool&utm_campaign=one_shot_value_launch&utm_content=items_recommended_origin_awesome_dnd`],
  ["medium", `${ownedBase}buy/?offer=item&utm_source=one_shot_forge&utm_medium=owned_web&utm_campaign=one_shot_value_launch&utm_content=items_recommended_origin_awesome_dnd`],
  ["campaign", `${ownedBase}buy/?offer=item&utm_source=one_shot_forge&utm_medium=free_tool&utm_campaign=standalone_modules&utm_content=items_recommended_origin_awesome_dnd`],
  ["content", `${ownedBase}buy/?offer=item&utm_source=one_shot_forge&utm_medium=free_tool&utm_campaign=one_shot_value_launch&utm_content=schema_item_catalog`],
  ["origin", `${ownedBase}buy/?offer=item&utm_source=one_shot_forge&utm_medium=free_tool&utm_campaign=one_shot_value_launch&utm_content=items_recommended_origin_private_customer`],
  ["exclusive_content", `${ownedBase}buy/?offer=item&utm_source=module_selector&utm_medium=owned_web&utm_campaign=standalone_modules&utm_content=items_recommended_origin_awesome_dnd`]
]) {
  const request = checkout.readRequest({ href });
  check(Object.keys(request.attribution).length === 0, `Mismatched One-Shot ${label} tuple did not fail closed`);
  const fallback = new URL(checkout.resolveRequest({ href }, registry).stores[0].url);
  check(
    fallback.searchParams.get("utm_source") === "world_foundry_hub" &&
      fallback.searchParams.get("utm_medium") === "storefront_selector" &&
      fallback.searchParams.get("utm_campaign") === "standalone_modules" &&
      fallback.searchParams.get("utm_content") === "item_catalog",
    `Mismatched One-Shot ${label} tuple did not use fixed fallback attribution`
  );
}

const sensitiveLocation = {
  href: `${ownedBase}buy/?offer=item&utm_source=private_customer_123&utm_medium=secret_channel&utm_campaign=internal_project_42&utm_content=contact_5551234567`
};
check(
  Object.keys(checkout.readRequest(sensitiveLocation).attribution).length === 0,
  "Unknown attribution reached the storefront registry"
);
const sanitized = checkout.resolveRequest(sensitiveLocation, registry);
const sanitizedUrl = new URL(sanitized.stores[0].url);
check(
  sanitizedUrl.searchParams.get("utm_source") === "world_foundry_hub" &&
    sanitizedUrl.searchParams.get("utm_medium") === "storefront_selector" &&
    sanitizedUrl.searchParams.get("utm_campaign") === "standalone_modules" &&
    sanitizedUrl.searchParams.get("utm_content") === "item_catalog",
  "Unknown attribution did not fall back to fixed offer-safe labels"
);
check(
  !sanitizedUrl.toString().includes("private_customer_123") &&
    !sanitizedUrl.toString().includes("secret_channel") &&
    !sanitizedUrl.toString().includes("internal_project_42") &&
    !sanitizedUrl.toString().includes("contact_5551234567"),
  "Unknown attribution leaked to the storefront URL"
);

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

const redirected = [];
const scheduled = [];
checkout.completeRedirect(
  Promise.resolve(true),
  { replace: (url) => redirected.push(url) },
  "https://example.com/verified",
  (callback, delay) => scheduled.push({ callback, delay })
);
await Promise.resolve();
check(redirected.length === 1, "Resolved measurement must release checkout redirect");
check(scheduled[0].delay === 600, "Checkout fallback timeout drift");
scheduled[0].callback();
check(redirected.length === 1, "Fallback must not duplicate a completed redirect");

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
