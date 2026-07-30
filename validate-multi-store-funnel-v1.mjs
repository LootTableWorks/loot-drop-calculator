import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const registry = require("./world-foundry/storefront-registry.js");
const router = require("./world-foundry/storefront-router.js");
const html = fs.readFileSync(path.join(root, "world-foundry", "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "world-foundry", "styles.css"), "utf8");
const readme = fs.readFileSync(path.join(root, "world-foundry", "README.md"), "utf8");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "world-foundry", "MANIFEST.json"), "utf8")
);
const attributes = fs.readFileSync(path.join(root, ".gitattributes"), "utf8");

let checks = 0;
function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

check(registry.validateRegistry(registry.offers), "Default registry must validate");
check(Object.keys(registry.offers).length === 6, "Six standalone offers required");
check(Object.keys(registry.STORE_POLICIES).length === 4, "Four storefront policies required");
check(registry.ATTRIBUTION.utm_medium === "storefront_selector", "Attribution medium drift");
check(router.priceLabel(3) === "$3", "Price label drift");
check(
  attributes.includes("world-foundry/*.html text eol=lf") &&
    attributes.includes("world-foundry/*.js text eol=lf") &&
    attributes.includes("world-foundry/*.json text eol=lf"),
  "World Foundry deployment text must be pinned to LF"
);

const expectedOffers = ["item", "merchant", "recipe", "loot", "quest", "encounter"];
for (const offerId of expectedOffers) {
  const offer = registry.offers[offerId];
  check(Boolean(offer), `${offerId}: offer missing`);
  check(offer.priceUsd === 3, `${offerId}: price drift`);
  check(Object.keys(offer.stores).length === 4, `${offerId}: storefront state incomplete`);
  check(offer.stores.itch.status === "public", `${offerId}: itch fallback must be public`);
  check(typeof offer.stores.itch.url === "string", `${offerId}: itch URL missing`);

  for (const storeId of ["gumroad", "kofi", "payhip"]) {
    check(offer.stores[storeId].status === "pending", `${offerId}/${storeId}: must remain pending`);
    check(offer.stores[storeId].url === null, `${offerId}/${storeId}: draft URL exposed`);
  }

  const publicStores = registry.resolvePublicStores(offerId);
  check(publicStores.length === 1, `${offerId}: exactly one public store expected`);
  check(publicStores[0].id === "itch", `${offerId}: itch must remain the only public store`);
  const attributed = new URL(publicStores[0].url);
  check(attributed.protocol === "https:", `${offerId}: HTTPS required`);
  check(attributed.hostname === "loot-table-works.itch.io", `${offerId}: fallback host drift`);
  check(attributed.searchParams.get("utm_source") === "world_foundry_hub", `${offerId}: source missing`);
  check(attributed.searchParams.get("utm_medium") === "storefront_selector", `${offerId}: medium missing`);
  check(attributed.searchParams.get("utm_campaign") === "standalone_modules", `${offerId}: campaign missing`);
  check(attributed.searchParams.get("utm_content") === offer.attributionContent, `${offerId}: content missing`);
  check(attributed.searchParams.get("utm_term") === "itch", `${offerId}: store term missing`);

  const marker = new RegExp(`data-offer-id="${offerId}"`, "g");
  check((html.match(marker) || []).length === 1, `${offerId}: HTML marker must appear once`);
}

check(!html.includes("loottableworks.gumroad.com/l/"), "Draft Gumroad product URL exposed");
check(!html.includes("ko-fi.com/s/"), "Draft Ko-fi product URL exposed");
check(!html.includes("payhip.com/b/"), "Draft Payhip product URL exposed");
check(
  html.indexOf("storefront-registry.js") < html.indexOf("storefront-router.js"),
  "Registry must load before router"
);
check((html.match(/data-link-kind="paid-module"/g) || []).length === 6, "Six static paid fallbacks required");
check((html.match(/Buy on itch\.io/g) || []).length === 6, "Static fallbacks must name itch.io");
check(css.includes(".storefront-picker"), "Storefront picker styles missing");
check(css.includes(".storefront-menu"), "Storefront menu styles missing");
check(manifest.version === "1.8.0", "World Foundry manifest version drift");
check(manifest.storefront_registry_version === "1.0.0", "Storefront registry version drift");
check(
  readme.includes(`Status: \`${manifest.status}\``),
  "README and manifest release statuses must match"
);
if (manifest.status === "approved_for_deployment") {
  check(manifest.publication_allowed === true, "Approved manifest must allow publication");
  check(manifest.deployment_allowed === true, "Approved manifest must allow deployment");
  check(manifest.public_release_requires_review === false, "Approved manifest review flag drift");
} else {
  check(manifest.publication_allowed === false, "Unapproved manifest must lock publication");
  check(manifest.deployment_allowed === false, "Unapproved manifest must lock deployment");
  check(manifest.public_release_requires_review === true, "Unapproved manifest must require review");
}
check(
  JSON.stringify(manifest.public_storefronts) === JSON.stringify(["itch"]),
  "Only itch may be recorded as public"
);
check(
  JSON.stringify(manifest.pending_storefronts) ===
    JSON.stringify(["gumroad", "kofi", "payhip"]),
  "Pending storefront state drift"
);
check(manifest.draft_storefront_urls_exposed === 0, "Draft storefront exposure must remain zero");

const expectedManifestFiles = [
  "README.md",
  "assets/campaign-workspace-preview-v1.png",
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "storefront-registry.js",
  "storefront-router.js",
  "styles.css"
];
check(
  JSON.stringify(manifest.files.map((entry) => entry.path)) ===
    JSON.stringify(expectedManifestFiles),
  "Manifest file inventory drift"
);

for (const entry of manifest.files) {
  const sourcePath = path.join(root, "world-foundry", entry.path);
  check(fs.existsSync(sourcePath), `${entry.path}: manifest source missing`);
  const bytes = fs.readFileSync(sourcePath);
  check(bytes.length === entry.bytes, `${entry.path}: byte count drift`);
  check(
    crypto.createHash("sha256").update(bytes).digest("hex") === entry.sha256,
    `${entry.path}: SHA-256 drift`
  );
}

const futureRegistry = JSON.parse(JSON.stringify(registry.offers));
futureRegistry.item.stores.gumroad = {
  status: "public",
  url: "https://loottableworks.gumroad.com/l/verified-item-catalog"
};
check(registry.validateRegistry(futureRegistry), "Verified future Gumroad state should validate");
check(registry.resolvePublicStores("item", futureRegistry).length === 2, "Future item selector needs two stores");

class FakeElement {
  constructor(documentRef, tagName) {
    this.ownerDocument = documentRef;
    this.tagName = String(tagName || "").toUpperCase();
    this.dataset = {};
    this.attributes = new Map();
    this.children = [];
    this.className = "";
    this.href = "";
    this.target = "";
    this.rel = "";
    this.textContent = "";
    this.replacement = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === "href" || name === "target" || name === "rel") this[name] = "";
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = [];
    this.append(...children);
  }

  replaceWith(node) {
    this.replacement = node;
  }
}

class FakeDocument {
  constructor(offerIds) {
    this.links = offerIds.map((offerId) => {
      const link = new FakeElement(this, "a");
      link.className = "module-action";
      link.dataset.offerId = offerId;
      link.href = registry.buildAttributedUrl(offerId, "itch");
      link.target = "_blank";
      link.rel = "noopener";
      return link;
    });
  }

  createElement(tagName) {
    return new FakeElement(this, tagName);
  }

  createTextNode(text) {
    return { nodeType: 3, textContent: String(text) };
  }

  querySelectorAll(selector) {
    return selector === ".module-action[data-offer-id]" ? this.links : [];
  }
}

function registryView(offers) {
  return {
    offers,
    validateRegistry: registry.validateRegistry,
    resolvePublicStores: (offerId) => registry.resolvePublicStores(offerId, offers)
  };
}

const defaultDocument = new FakeDocument(expectedOffers);
const defaultEnhancement = router.enhance(defaultDocument, registry);
check(defaultEnhancement.enhanced === 6, "Six current purchase links must enhance");
check(defaultEnhancement.fallback === 0, "Current verified registry must not use fallback");
for (const link of defaultDocument.links) {
  check(link.dataset.storefrontState === "single-public", "Current link state must be single-public");
  check(link.dataset.storeId === "itch", "Current enhanced link must identify itch");
  check(link.href.includes("utm_term=itch"), "Current enhanced link needs per-store attribution");
}

const noPublicStore = JSON.parse(JSON.stringify(registry.offers));
for (const storeId of Object.keys(noPublicStore.item.stores)) {
  noPublicStore.item.stores[storeId] = { status: "pending", url: null };
}
const unavailableDocument = new FakeDocument(["item"]);
const unavailableResult = router.enhance(unavailableDocument, registryView(noPublicStore));
check(unavailableResult.enhanced === 1, "Zero-store offer must be handled");
check(unavailableResult.fallback === 0, "Zero-store offer must not retain fallback");
check(unavailableDocument.links[0].href === "", "Zero-store offer must remove purchase URL");
check(
  unavailableDocument.links[0].dataset.storefrontState === "unavailable",
  "Zero-store offer state must be unavailable"
);
check(
  unavailableDocument.links[0].getAttribute("aria-disabled") === "true",
  "Zero-store offer must be exposed as disabled"
);

const futureDocument = new FakeDocument(["item"]);
const futureResult = router.enhance(futureDocument, registryView(futureRegistry));
check(futureResult.enhanced === 1, "Future multi-store offer must enhance");
const futurePicker = futureDocument.links[0].replacement;
check(futurePicker?.tagName === "DETAILS", "Future multi-store offer must render a details picker");
const futureSummary = futurePicker.children.find((child) => child.tagName === "SUMMARY");
check(
  futureSummary?.getAttribute("aria-label") ===
    "Choose a verified store for Item Catalog & Economy Kit, $3",
  "Store picker needs a product-specific accessible name"
);

const missingRegistryDocument = new FakeDocument(["item"]);
const missingRegistryResult = router.enhance(missingRegistryDocument, null);
check(missingRegistryResult.enhanced === 0, "Missing registry must not mutate static HTML");
check(
  missingRegistryDocument.links[0].href.includes("loot-table-works.itch.io"),
  "Missing script must retain verified static itch fallback"
);

for (const invalid of [
  {
    name: "pending URL",
    mutate: (copy) => {
      copy.item.stores.gumroad.url = "https://loottableworks.gumroad.com/l/draft";
    }
  },
  {
    name: "wrong host",
    mutate: (copy) => {
      copy.item.stores.gumroad = { status: "public", url: "https://example.com/l/item" };
    }
  },
  {
    name: "query-bearing canonical",
    mutate: (copy) => {
      copy.item.stores.gumroad = {
        status: "public",
        url: "https://loottableworks.gumroad.com/l/item?secret=1"
      };
    }
  },
  {
    name: "draft-like path",
    mutate: (copy) => {
      copy.item.stores.gumroad = {
        status: "public",
        url: "https://loottableworks.gumroad.com/l/private-item"
      };
    }
  },
  {
    name: "unapproved Ko-fi product ownership",
    mutate: (copy) => {
      copy.item.stores.kofi = {
        status: "public",
        url: "https://ko-fi.com/s/another-seller-product"
      };
    }
  },
  {
    name: "unapproved Payhip product ownership",
    mutate: (copy) => {
      copy.item.stores.payhip = {
        status: "public",
        url: "https://another-seller.payhip.com/b/item"
      };
    }
  }
]) {
  const copy = JSON.parse(JSON.stringify(registry.offers));
  invalid.mutate(copy);
  assert.throws(() => registry.validateRegistry(copy), undefined, `${invalid.name} must fail`);
  checks += 1;
}

console.log(`Validated multi-store funnel v1: ${checks} checks; only verified itch.io fallbacks are exposed.`);
