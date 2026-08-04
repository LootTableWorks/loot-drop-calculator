import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(root, "item-catalog-demo", "index.html"), "utf8");
const startHere = fs.readFileSync(
  path.join(root, "item-catalog-demo", "START-HERE.html"),
  "utf8",
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "item-catalog-demo", "MANIFEST.json"), "utf8"),
);
const acquisition = JSON.parse(
  fs.readFileSync(
    path.join(root, "item-catalog-demo", "ACQUISITION-GAMESTRUCTION.json"),
    "utf8",
  ),
);

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

check(html === startHere, "Hosted entry files must remain byte-identical");
check(html.includes('gamestruction: {'), "Gamestruction source contract missing");
check(html.includes('medium: "tool_directory"'), "Gamestruction medium missing");
check(
  html.includes('campaign: "ltw_data_pack_discovery_v1"'),
  "Gamestruction campaign missing",
);
check(
  html.includes('"gamestruction.com": "gamestruction"'),
  "Apex referrer mapping missing",
);
check(
  html.includes('"www.gamestruction.com": "gamestruction"'),
  "WWW referrer mapping missing",
);
check(
  html.includes('if (!Object.hasOwn(sourceContracts, source))'),
  "Source allowlist must fail closed",
);
check(
  html.includes('href="downloads/world-foundry-item-catalog-demo-v2-rc7.zip"') &&
    html.includes("Download the Complete Demo"),
  "Visible complete RC7 demo download missing",
);
check(
  html.includes("adds 400 more records and 80 more mapped icons") &&
    html.includes("expands the included atlas set from one sheet to four") &&
    html.includes("retains the same four-loader workflow"),
  "Paid upgrade delta is not stated precisely",
);
check(
  html.includes("keeps these exact 100 records, adds 400 more records"),
  "Exact paid-subset upgrade claim missing",
);
check(
  html.includes("Inventory icon artwork is AI-assisted and human-directed"),
  "Artwork disclosure missing",
);
check(
  html.includes('destination.searchParams.set("utm_source", source)'),
  "Paid handoff source propagation missing",
);
check(
  html.includes('destination.searchParams.set("utm_medium", contract.medium)'),
  "Paid handoff medium propagation missing",
);
check(
  html.includes('destination.searchParams.set("utm_campaign", contract.campaign)'),
  "Paid handoff campaign propagation missing",
);
check(
  html.includes('destination.searchParams.set("utm_content", "item_catalog_demo_upgrade")'),
  "Paid handoff content contract missing",
);
check(
  manifest.acquisition_attribution.approved_sources.includes("gamestruction"),
  "Manifest source allowlist missing Gamestruction",
);
check(
  manifest.acquisition_attribution.approved_referrer_hosts.includes(
    "gamestruction.com",
  ),
  "Manifest apex referrer allowlist missing",
);
check(
  manifest.acquisition_attribution.approved_referrer_hosts.includes(
    "www.gamestruction.com",
  ),
  "Manifest WWW referrer allowlist missing",
);
check(
  manifest.acquisition_attribution.source_contracts.gamestruction.medium ===
    "tool_directory",
  "Manifest Gamestruction medium changed",
);
check(
  manifest.acquisition_attribution.source_contracts.gamestruction.campaign ===
    "ltw_data_pack_discovery_v1",
  "Manifest Gamestruction campaign changed",
);
check(
  acquisition.approved_source === "gamestruction",
  "Acquisition source changed",
);
check(
  acquisition.approved_referrer_hosts.join("|") ===
    "gamestruction.com|www.gamestruction.com",
  "Acquisition referrer hosts changed",
);
check(
  acquisition.entry_medium === "tool_directory",
  "Acquisition medium changed",
);
check(
  acquisition.entry_campaign === "ltw_data_pack_discovery_v1",
  "Acquisition campaign changed",
);
check(
  acquisition.entry_content === "item_catalog_demo",
  "Acquisition entry content changed",
);
check(
  acquisition.paid_handoff_term ===
    "origin_gamestruction_item_catalog_demo_upgrade",
  "Acquisition paid handoff term changed",
);
check(acquisition.analytics_used === false, "Analytics boundary changed");
check(acquisition.storage_used === false, "Storage boundary changed");
check(
  acquisition.submission_or_acceptance_counted_as_demand === false,
  "Submission must not count as demand",
);

console.log(`Gamestruction Item Catalog route passed ${checks} checks.`);
