import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const forgeRoot = path.join(root, "one-shot-forge");
const launchpadRoot = path.join(root, "campaign-launchpad");
const manifest = JSON.parse(fs.readFileSync(path.join(forgeRoot, "MANIFEST.json"), "utf8"));
const launchpadManifest = JSON.parse(fs.readFileSync(path.join(launchpadRoot, "MANIFEST.json"), "utf8"));
const html = fs.readFileSync(path.join(forgeRoot, "index.html"), "utf8");
const app = fs.readFileSync(path.join(forgeRoot, "app.js"), "utf8");
const core = fs.readFileSync(path.join(forgeRoot, "one-shot-core.js"), "utf8");
const launchpadCore = fs.readFileSync(path.join(forgeRoot, "campaign-start-launchpad-core.js"), "utf8");
const publicLaunchpadCore = fs.readFileSync(path.join(launchpadRoot, "campaign-launchpad-core.js"), "utf8");
const launchpadOneShotCore = fs.readFileSync(path.join(launchpadRoot, "campaign-start-one-shot-core.js"), "utf8");
const css = fs.readFileSync(path.join(forgeRoot, "styles.css"), "utf8");

let checks = 0;
function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

check(manifest.version === "1.3.2", "One-Shot Forge version drift");
check(manifest.status === "approved_public_release", "Release status drift");
check(manifest.publication_allowed === true, "Publication gate closed");
check(manifest.live_standalone_destinations === 6, "Standalone destination count drift");
check(manifest.visible_standalone_recommendations === 6, "Visible recommendation count drift");
check(manifest.live_campaign_destinations === 1, "Campaign destination count drift");
check(manifest.checkout_router_destinations === 7, "Checkout route count drift");
check(manifest.bundle_destinations === 0, "Bundle route must remain closed");
check(manifest.measurement_candidate === "activation_gated", "Measurement gate drift");
check(
  manifest.measurement_collects_generated_content === false,
  "Generated-content privacy boundary drift"
);

for (const entry of manifest.files) {
  const absolute = path.join(forgeRoot, entry.path);
  check(fs.existsSync(absolute), `${entry.path}: missing manifest file`);
  const bytes = fs.readFileSync(absolute);
  check(bytes.length === entry.bytes, `${entry.path}: byte count drift`);
  check(sha256(bytes) === entry.sha256, `${entry.path}: hash drift`);
}

for (const entry of launchpadManifest.files) {
  const absolute = path.join(launchpadRoot, entry.path);
  check(fs.existsSync(absolute), `campaign-launchpad/${entry.path}: missing manifest file`);
  const bytes = fs.readFileSync(absolute);
  check(bytes.length === entry.bytes, `campaign-launchpad/${entry.path}: byte count drift`);
  check(sha256(bytes) === entry.sha256, `campaign-launchpad/${entry.path}: hash drift`);
}
check(launchpadCore === publicLaunchpadCore, "One-Shot Forge Launchpad snapshot drift");
check(core === launchpadOneShotCore, "Campaign Launchpad One-Shot snapshot drift");

const offers = ["item", "merchant", "recipe", "loot", "quest", "encounter"];
for (const offer of offers) {
  check(core.includes(`offer: "${offer}"`), `${offer}: offer marker missing`);
  check(
    core.includes(`https://loottableworks.github.io/loot-drop-calculator/buy/?offer=${offer}`),
    `${offer}: owned checkout route missing`
  );
}

check(html.includes('class="campaign-continuation"'), "Campaign continuation card missing");
check(html.includes('data-offer-id="gullwatch_harbor"'), "Campaign offer marker missing");
check(html.includes("61-page PDF and reflowable EPUB"), "Campaign deliverable claim drift");
check(html.includes("nineteen scenes"), "Campaign scene claim drift");
check(html.includes("$2.99"), "Campaign price claim drift");
check(html.includes("assets/gullwatch-harbor-cover-v1.jpg"), "Self-contained campaign cover missing");
check(fs.existsSync(path.join(forgeRoot, "assets", "gullwatch-harbor-cover-v1.jpg")), "Campaign cover target missing");
check(html.includes("Run a complete coastal campaign next"), "Campaign positioning drift");
check(
  html.includes("Free TTRPG One-Shot Generator - No Sign-Up"),
  "High-intent search title missing"
);
check(
  html.includes("Build a complete 2-4 hour adventure with five timed scenes"),
  "First-screen outcome promise missing"
);
check(html.includes("No sign-up"), "No-signup trust marker missing");
check(html.includes("No prompt writing"), "No-prompt trust marker missing");
check(html.includes("Runs locally"), "Local-runtime trust marker missing");
check(html.includes("app.js?v=1.3.2"), "One-Shot runtime cache version drift");
check(html.includes("privacy-metrics-v1.js?v=2.3.2"), "Privacy measurement cache version drift");
check(
  html.includes("Generate complete one-shot"),
  "Outcome-led generate command missing"
);
check(html.includes('role="tablist"'), "Tablist semantics missing");
check((html.match(/role="tab"/g) || []).length === 5, "Tab role count drift");
check((html.match(/role="tabpanel"/g) || []).length === 5, "Tab panel role count drift");
check(app.includes('id: "gullwatch_harbor"'), "Campaign runtime offer missing");
check(app.includes('`_origin_${acquisitionOrigin}`'), "Acquisition origin marker missing");
check(app.includes('`${product.id}_${placement}${originSuffix}`'), "Acquisition origin is not preserved through content attribution");
check(app.includes('trackedCampaignUrl()'), "Campaign attribution helper missing");
check(html.includes('id="contextual-item-offer"'), "Contextual Item Catalog offer missing");
check(
  html.indexOf('id="contextual-item-offer"') < html.indexOf('class="result-tabs"'),
  "Contextual Item Catalog offer must appear before result tabs"
);
check(html.includes("Try the exact 100-record demo"), "Contextual free-proof CTA missing");
check(html.includes("Get 500 records - $3"), "Contextual paid CTA missing");
check(html.includes('data-offer-id="item"'), "Contextual Item Catalog offer marker missing");
check(html.includes("100</span><strong>500"), "Contextual record delta missing");
check(html.includes("20</span><strong>100"), "Contextual icon delta missing");
check(html.includes("1</span><strong>4"), "Contextual sprite-sheet delta missing");
check(app.includes("trackedItemProofUrl"), "Contextual Item Catalog attribution helper missing");
check(app.includes('"item_context_demo"'), "Contextual demo attribution missing");
check(app.includes('"items_recommended"'), "Contextual purchase attribution missing");
check(app.includes("oneShot.rewards.item_name"), "Contextual recommendation does not use generated reward");
check(app.includes("signature_item_name"), "Contextual recommendation does not use signature-item fallback");
check(css.includes(".contextual-item-offer"), "Contextual Item Catalog styling missing");
check(
  css.includes("grid-template-columns: 118px minmax(0, 1fr)"),
  "Contextual mobile layout missing"
);
check(app.includes('"organic_search"'), "Organic-search acquisition source missing");
check(app.includes("readPreservedInboundParams()"), "Inbound attribution preservation missing");
check(app.includes('incoming.get("ltw_qa") === "1"'), "QA exclusion preservation missing");
check(app.includes("preservedInboundParams.forEach"), "Generator URL rewrite still erases fixed attribution");
check(app.includes("core.recommendProducts(6)"), "All six standalone recommendations must render");
check(app.includes('tab.setAttribute("aria-selected", String(selected))'), "Tab selection state missing");
check(app.includes('event.key === "ArrowRight"'), "Keyboard tab navigation missing");
check(css.includes(".campaign-continuation"), "Campaign card styling missing");
check(css.includes(".control-trust"), "First-screen trust styling missing");
check(css.includes("height: auto"), "Campaign cover aspect-ratio correction missing");
check(css.includes("@media (max-width: 420px)"), "Narrow-mobile repair missing");
check(!css.includes("html { min-width: 320px"), "Hard mobile minimum width remains");
check(css.includes("box-shadow: 0 0 0 6px #111"), "High-contrast focus ring missing");

const combined = `${html}\n${app}\n${core}`;
check(!combined.includes("/bundle"), "Bundle route exposed");
check(!combined.includes("offer=bundle"), "Private bundle checkout exposed");
check(!core.includes("https://loot-table-works.itch.io/"), "Core paid route bypasses owned checkout");
check(!launchpadCore.includes("https://loot-table-works.itch.io/"), "Campaign Start export bypasses owned checkout");
check(!publicLaunchpadCore.includes("https://loot-table-works.itch.io/"), "Public Launchpad bypasses owned checkout");
for (const offer of offers) {
  check(
    launchpadCore.includes(`https://loottableworks.github.io/loot-drop-calculator/buy/?offer=${offer}`),
    `${offer}: Campaign Start checkout route missing`
  );
}

console.log(
  `Validated One-Shot Forge revenue funnel v1: ${checks} checks; one campaign and six standalone offers route through the owned checkout.`
);
