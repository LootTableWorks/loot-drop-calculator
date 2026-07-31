import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.join(root, "item-catalog-demo");
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

const index = read("item-catalog-demo/index.html");
const launchpad = read("item-catalog-demo/START-HERE.html");
const selector = read("choose-world-foundry-module/index.html");
const selectorScript = read("choose-world-foundry-module/app.js");
const selectorStyles = read("choose-world-foundry-module/styles.css");
const sitemap = read("sitemap.xml");
const manifest = JSON.parse(read("item-catalog-demo/MANIFEST.json"));
const acquisition = JSON.parse(read("item-catalog-demo/ACQUISITION.json"));
const packageManifest = JSON.parse(read("item-catalog-demo/PACKAGE-MANIFEST.json"));
const iconMap = JSON.parse(read("item-catalog-demo/item-icons/icon-map.json"));
const items = JSON.parse(read("item-catalog-demo/items.json"));

assert(index === launchpad, "Hosted index and package launchpad differ");
assert(
  index.includes("<title>World Foundry Item Catalog | Free 100-Item Demo</title>"),
  "Hosted demo title changed",
);
assert(
  index.includes(
    '<link rel="canonical" href="https://loottableworks.github.io/loot-drop-calculator/item-catalog-demo/">',
  ),
  "Hosted demo canonical URL changed",
);
assert(
  index.includes("<strong>100</strong><span>STABLE DEMO ITEM IDS</span>"),
  "Hosted demo item-count proof changed",
);
assert(
  index.includes("<strong>20</strong><span>MAPPED SAMPLE ICONS</span>"),
  "Hosted demo icon-count proof changed",
);
assert(index.includes("item-icons/icons/pitm-0036-brineworn-relic.png"), "Hosted icon preview missing");
assert(index.includes("FREE SCHEMA-V2 DEMO"), "Hosted demo label changed");
assert(!index.includes("Five hundred original"), "Hosted demo exposes premium count copy");
assert(
  index.includes(
    "utm_source=item_catalog_demo&amp;utm_medium=product_launchpad&amp;utm_campaign=paid_catalog_feature_v1&amp;utm_content=upgrade_to_500",
  ),
  "Hosted demo paid-upgrade attribution changed",
);
assert(
  index.includes("https://loottableworks.github.io/loot-drop-calculator/choose-world-foundry-module/"),
  "Hosted demo no longer upgrades through the owned selector",
);
assert(index.includes('id="paid-upgrade"'), "Hosted paid-upgrade hook missing");
assert(
  index.includes('source !== "the_compendium"'),
  "Hosted demo source allowlist changed",
);
assert(
  index.includes('hostname === "compendium.tools"'),
  "Hosted demo referrer allowlist changed",
);
assert(
  index.includes(
    'destination.searchParams.set("utm_campaign", "ltw_free_tool_directory_v1")',
  ),
  "Hosted demo downstream directory campaign changed",
);
assert(
  index.includes(
    'destination.searchParams.set("utm_content", "item_catalog_demo_upgrade")',
  ),
  "Hosted demo downstream directory content changed",
);
assert(!index.includes("loot-table-works.itch.io"), "Hosted demo exposes a direct marketplace URL");
assert(!/\bbundle\b/i.test(index), "Hosted demo exposes bundle copy");

assert(items.length === 100, "Hosted demo item count changed");
assert(new Set(items.map((item) => item.id)).size === 100, "Hosted demo IDs are not unique");
assert(new Set(items.map((item) => item.family_id)).size === 26, "Hosted demo family count changed");
assert(new Set(items.map((item) => item.biome)).size === 10, "Hosted demo biome count changed");
assert(new Set(items.map((item) => item.category)).size === 10, "Hosted demo category count changed");
assert(new Set(items.map((item) => item.tier)).size === 5, "Hosted demo tier count changed");

assert(manifest.schema_version === "1.0.0", "Hosted manifest schema changed");
assert(manifest.version === "2.0.0-rc4", "Hosted demo release changed");
assert(manifest.publication_allowed === true, "Hosted demo publication gate changed");
assert(manifest.item_count === 100 && manifest.unique_item_ids === 100, "Hosted manifest item contract changed");
assert(manifest.family_count === 26, "Hosted manifest family count changed");
assert(manifest.biome_count === 10, "Hosted manifest biome count changed");
assert(manifest.category_count === 10, "Hosted manifest category count changed");
assert(manifest.tier_count === 5, "Hosted manifest tier count changed");
assert(manifest.mapped_icon_count === 20, "Hosted manifest mapped-icon count changed");
assert(manifest.icon_atlas_count === 1, "Hosted manifest atlas count changed");
assert(manifest.paid_upgrade_price_usd === 3, "Hosted demo upgrade price changed");
assert(manifest.paid_upgrade_campaign === "paid_catalog_feature_v1", "Hosted demo paid campaign changed");
assert(
  manifest.acquisition_attribution.approved_sources.join("|") ===
    "the_compendium",
  "Hosted demo source allowlist manifest changed",
);
assert(
  manifest.acquisition_attribution.approved_referrer_hosts.join("|") ===
    "compendium.tools",
  "Hosted demo referrer allowlist manifest changed",
);
assert(
  manifest.acquisition_attribution.downstream_campaign ===
    "ltw_free_tool_directory_v1",
  "Hosted demo directory campaign manifest changed",
);
assert(
  manifest.acquisition_attribution.downstream_content ===
    "item_catalog_demo_upgrade",
  "Hosted demo directory content manifest changed",
);
assert(
  manifest.acquisition_attribution.analytics_used === false &&
    manifest.acquisition_attribution.storage_used === false,
  "Hosted demo acquisition privacy boundary changed",
);
assert(manifest.archive.bytes === 3630049, "Hosted archive byte count changed");
assert(
  manifest.archive.sha256 ===
    "907b85adb668b1ca18ff8ffa3d355a64395f0edf08f2de3843985948ab7515bf",
  "Hosted archive SHA-256 changed",
);

const manifested = new Set();
for (const record of manifest.files) {
  assert(!record.path.includes("\\"), `Manifest path is not portable: ${record.path}`);
  assert(!manifested.has(record.path), `Duplicate manifest path: ${record.path}`);
  manifested.add(record.path);
  const absolutePath = path.join(demoRoot, ...record.path.split("/"));
  assert(fs.existsSync(absolutePath), `Manifest file is missing: ${record.path}`);
  const bytes = fs.readFileSync(absolutePath);
  assert(bytes.length === record.bytes, `Manifest byte count changed: ${record.path}`);
  assert(sha256(bytes) === record.sha256, `Manifest SHA-256 changed: ${record.path}`);
}
assert(manifest.files.length === 45, "Hosted manifest file count changed");

assert(
  acquisition.release_id ===
    "item-catalog-demo-compendium-attribution-v1",
  "Hosted acquisition release ID changed",
);
assert(acquisition.publication_allowed === true, "Hosted acquisition publication gate changed");
assert(acquisition.approved_source === "the_compendium", "Hosted acquisition source changed");
assert(
  acquisition.approved_referrer_host === "compendium.tools",
  "Hosted acquisition referrer changed",
);
assert(
  acquisition.entry_campaign === "ltw_free_tool_directory_v1" &&
    acquisition.entry_content === "item_catalog_demo" &&
    acquisition.downstream_content === "item_catalog_demo_upgrade",
  "Hosted acquisition campaign contract changed",
);
assert(
  acquisition.paid_handoff_term ===
    "origin_the_compendium_item_catalog_demo_upgrade",
  "Hosted acquisition paid handoff changed",
);
assert(
  acquisition.unknown_sources_discarded === true &&
    acquisition.unapproved_referrer_hosts_discarded === true &&
    acquisition.email_like_values_discarded === true,
  "Hosted acquisition rejection boundary changed",
);
assert(
  acquisition.path_or_user_identifier_preserved === false &&
    acquisition.analytics_used === false &&
    acquisition.storage_used === false,
  "Hosted acquisition privacy boundary changed",
);
assert(
  acquisition.submission_or_acceptance_counted_as_demand === false &&
    acquisition.owner_or_qa_activity_counted_as_demand === false &&
    acquisition.crawler_or_impression_activity_counted_as_demand === false,
  "Hosted acquisition demand boundary changed",
);

assert(
  packageManifest.package_id === "world-foundry-item-catalog-demo-v2-rc4",
  "Embedded package ID changed",
);
assert(packageManifest.price_usd === 0, "Embedded demo price changed");
assert(packageManifest.item_count === 100, "Embedded package item count changed");
assert(packageManifest.publication_allowed === false, "Embedded package publication boundary changed");
assert(iconMap.icon_count === 20, "Embedded demo icon count changed");
assert(iconMap.atlas_count === 1, "Embedded demo atlas count changed");
assert(iconMap.coverage.catalog_demo_count === 100, "Embedded icon catalog boundary changed");
assert(iconMap.coverage.illustrated_sample_count === 20, "Embedded icon sample boundary changed");

const archivePath = path.join(
  demoRoot,
  "downloads",
  "world-foundry-item-catalog-demo-v2-rc4.zip",
);
const archive = fs.readFileSync(archivePath);
assert(archive.length === manifest.archive.bytes, "Archive byte count does not match manifest");
assert(sha256(archive) === manifest.archive.sha256, "Archive SHA-256 does not match manifest");

for (const localHref of [
  "item-explorer.html",
  "item-collection-builder.html",
  "FIELD-GUIDE.pdf",
  "QUICKSTART.md",
  "USAGE-TERMS.md",
]) {
  assert(index.includes(`href="${localHref}"`), `Launchpad link changed: ${localHref}`);
  assert(fs.existsSync(path.join(demoRoot, localHref)), `Launchpad destination missing: ${localHref}`);
}

assert(
  selector.includes('id="item-demo-callout"'),
  "Item Catalog selector demo callout missing",
);
assert(
  selector.includes(
    "item-catalog-demo/?utm_source=world_foundry_selector&amp;utm_medium=owned_web&amp;utm_campaign=item_catalog_demo_v1&amp;utm_content=open_browser_demo",
  ),
  "Selector browser-demo attribution changed",
);
assert(
  selector.includes(
    "item-catalog-demo/downloads/world-foundry-item-catalog-demo-v2-rc4.zip?utm_source=world_foundry_selector&amp;utm_medium=owned_web&amp;utm_campaign=item_catalog_demo_v1&amp;utm_content=download_demo_zip",
  ),
  "Selector demo-download attribution changed",
);
assert(
  selector.includes("Explore 100 stable demo records with 20 mapped icons"),
  "Selector demo icon proof changed",
);
assert(
  selector.includes("<strong>100</strong> mapped icons"),
  "Selector paid icon proof changed",
);
assert(
  selectorScript.includes('["100", "mapped icons"]'),
  "Selector dynamic paid icon proof changed",
);
assert(
  selectorScript.includes(
    'elements.itemDemo.hidden = selectedValue("problem") !== "items";',
  ),
  "Selector no longer hides the Item demo for other modules",
);
assert(selectorStyles.includes(".item-demo-callout"), "Selector demo styles missing");
assert(selectorStyles.includes(".demo-links"), "Selector demo-link styles missing");
assert(
  (sitemap.match(/https:\/\/loottableworks\.github\.io\/loot-drop-calculator\/item-catalog-demo\//g) || []).length === 1,
  "Hosted demo sitemap entry changed",
);

console.log(
  `Hosted Item Catalog demo v1 passed ${checks} package, proof, selector, attribution, and publication-boundary checks.`,
);
