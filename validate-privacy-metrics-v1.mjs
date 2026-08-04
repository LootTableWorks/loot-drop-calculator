import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const registry = require("./world-foundry/storefront-registry.js");
const loaderPath = path.join(root, "assets", "privacy-metrics-v1.js");
const loaderSource = fs.readFileSync(loaderPath, "utf8");
const placeholder = "__LTW_GOATCOUNTER_ENDPOINT__";
const expectedEndpoint = process.env.LTW_GOATCOUNTER_ENDPOINT || placeholder;
const expectedIntegrity =
  "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ";

const measuredPages = [
  "index.html",
  "world-foundry/index.html",
  "gullwatch-beacon/index.html",
  "gullwatch-aftermath/index.html",
  "choose-world-foundry-module/index.html",
  "connected-record-proof/index.html",
  "press-kit/index.html",
  "run-one-shot-tonight/index.html",
  "one-shot-forge/index.html",
  "campaign-workspace/index.html",
  "buy/index.html"
];

const uninstrumentedToolPages = [
  "campaign-arc-forge/index.html",
  "campaign-launchpad/index.html",
  "character-foundry/index.html",
  "loot-odds/index.html",
  "player-chronicle/index.html",
  "rpg-data-bridge/index.html",
  "rpg-data-doctor/index.html",
  "shop-inventory-generator/index.html",
  "world-seed-studio/index.html"
];

let checks = 0;
function assert(condition, message) {
  checks += 1;
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function allHtmlFiles(directory) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...allHtmlFiles(fullPath));
    if (entry.isFile() && entry.name.endsWith(".html")) output.push(fullPath);
  }
  return output;
}

function linkMock(href) {
  const attributes = {};
  return {
    href,
    attributes,
    setAttribute(name, value) {
      attributes[name] = String(value);
    }
  };
}

function execute({
  pathname = "/loot-drop-calculator/",
  search = "",
  referrer = "",
  endpoint = "https://loottableworks.goatcounter.com/count",
  doNotTrack,
  optedOut = false,
  userAgent = "Mozilla/5.0",
  links = []
} = {}) {
  const appended = [];
  const listeners = {};
  const window = { LTWStorefrontRegistry: registry };
  const location = {
    hostname: "loottableworks.github.io",
    pathname,
    search
  };
  const document = {
    currentScript: { dataset: { goatcounterEndpoint: endpoint } },
    referrer,
    querySelectorAll(selector) {
      return selector === "a[href]" ? links : [];
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    createElement(tagName) {
      return { tagName, dataset: {} };
    },
    head: {
      appendChild(node) {
        appended.push(node);
      }
    }
  };
  const localStorage = {
    getItem(key) {
      return key === "ltw_metrics_opt_out" && optedOut ? "1" : null;
    }
  };
  const context = {
    Promise,
    URL,
    URLSearchParams,
    document,
    location,
    localStorage,
    navigator: { doNotTrack, userAgent },
    window
  };
  vm.runInNewContext(loaderSource, context, { filename: "privacy-metrics-v1.js" });
  return {
    api: window.LTWPrivacyMetrics,
    appended,
    goatcounter: window.goatcounter,
    links,
    listeners
  };
}

for (const relativePath of measuredPages) {
  const html = read(relativePath);
  assert(
    (html.match(/privacy-metrics-v1\.js/g) || []).length === 1,
    `${relativePath} must load the measurement candidate exactly once`
  );
  assert(
    html.includes(`data-goatcounter-endpoint="${expectedEndpoint}"`),
    `${relativePath} must contain the expected measurement endpoint`
  );
  assert(
    /href="(?:\.\.\/)?privacy\/"/.test(html),
    `${relativePath} must link to the privacy page`
  );
  assert(
    relativePath === "world-foundry/index.html" ||
      html.includes("storefront-registry.js?v=3.0.1"),
    `${relativePath} must load the exact offer and storefront registry`
  );
}

for (const relativePath of uninstrumentedToolPages) {
  assert(
    !read(relativePath).includes("privacy-metrics-v1.js"),
    `${relativePath} must remain uninstrumented`
  );
}

const instrumentedHtml = allHtmlFiles(root)
  .filter((filePath) => read(path.relative(root, filePath)).includes("privacy-metrics-v1.js"))
  .map((filePath) => path.relative(root, filePath).replaceAll("\\", "/"))
  .sort();
assert(
  JSON.stringify(instrumentedHtml) === JSON.stringify([...measuredPages].sort()),
  `Unexpected instrumented pages: ${instrumentedHtml.join(", ")}`
);

const privacyHtml = read("privacy/index.html");
for (const requiredText of [
  "Aggregate counts, not player profiles.",
  "No cookies",
  "No campaign text",
  "No raw query string",
  "only allowlisted source, medium, campaign, and content labels are forwarded",
  "eleven public funnel pages",
  "seven paid offers",
  "does not prove a purchase",
  "individual-pageview storage in GoatCounter; that optional setting must remain disabled",
  "Do Not Track is honored",
  "Exclude this browser"
]) {
  assert(privacyHtml.includes(requiredText), `Privacy page is missing: ${requiredText}`);
}

assert(
  read("sitemap.xml").includes("https://loottableworks.github.io/loot-drop-calculator/privacy/"),
  "Privacy page is missing from the sitemap"
);
assert(read("README.md").includes("Eleven public funnel pages"), "Repository boundary is stale");

const productionLink = linkMock(
  "https://loot-table-works.itch.io/original-fantasy-item-data-pack?utm_source=private@example.com"
);
const paidIntentLink = linkMock(
  "https://loottableworks.github.io/loot-drop-calculator/buy/?offer=encounter&utm_source=private@example.com"
);
const production = execute({
  pathname: "/loot-drop-calculator/connected-record-proof/",
  search:
    "?utm_source=pinterest&utm_campaign=ltw_pinterest_launch_v1&utm_content=pin09_encounter_reference_closure&email=private@example.com",
  links: [productionLink, paidIntentLink]
});
assert(production.appended.length === 1, "Production scenario must load one vendor script");
assert(production.appended[0].src === "https://gc.zgo.at/count.v5.js", "Vendor version drift");
assert(production.appended[0].integrity === expectedIntegrity, "Vendor SRI hash drifted");
assert(production.appended[0].crossOrigin === "anonymous", "Vendor CORS drifted");
assert(
  production.appended[0].dataset.goatcounter === "https://loottableworks.goatcounter.com/count",
  "GoatCounter endpoint drifted"
);
assert(production.goatcounter.path === "/connected-record-proof/", "Page path is not canonical");
assert(
  production.goatcounter.referrer ===
    "source.pinterest/campaign.ltw-pinterest-launch-v1/content.pin09-encounter-reference-closure",
  "Allowlisted attribution was not reduced to fixed labels"
);
assert(production.goatcounter.no_events === true, "Vendor automatic event binding must be disabled");
assert(
  productionLink.attributes["data-goatcounter-click"] ===
    "store-outbound.itch.item.from.connected-record-proof",
  "Store outbound event drifted"
);
assert(
  paidIntentLink.attributes["data-goatcounter-click"] ===
    "paid-intent.encounter.from.connected-record-proof",
  "Paid intent event drifted"
);
assert(
  !JSON.stringify({
    goatcounter: production.goatcounter,
    vendor: production.appended[0],
    store: productionLink.attributes,
    intent: paidIntentLink.attributes
  }).includes("private@example.com"),
  "Raw query or href data leaked into measurement output"
);

const api = production.api;
assert(
  api.pagePath("/loot-drop-calculator/?private=email@example.com") === null,
  "Query-like paths must fail closed"
);
assert(
  api.fixedAttribution("?utm_source=unknown@example.com&utm_campaign=secret", "") ===
    "source.direct",
  "Unknown attribution must be discarded"
);
assert(
  api.fixedAttribution(
    "?utm_source=world_foundry_hub&utm_campaign=standalone_modules&utm_content=item_catalog",
    ""
  ) === "source.world-foundry-hub/campaign.standalone-modules/content.item-catalog",
  "Current paid-catalog attribution must remain observable"
);
assert(
  api.fixedAttribution(
    "?utm_source=gamestruction&utm_medium=tool_directory&utm_campaign=ltw_data_pack_discovery_v1&utm_content=item_catalog_demo_upgrade",
    ""
  ) ===
    "source.gamestruction/campaign.ltw-data-pack-discovery-v1/content.item-catalog-demo-upgrade",
  "Gamestruction paid handoff attribution must remain observable"
);
assert(
  api.fixedAttribution(
    "?utm_source=organic_search&utm_medium=owned_search&utm_campaign=ltw_one_shot_intent_v1&utm_content=complete_one_shot_generator",
    ""
  ) ===
    "source.organic-search/campaign.ltw-one-shot-intent-v1/content.complete-one-shot-generator",
  "One-Shot Forge search-intent attribution must remain observable"
);
assert(
  api.fixedAttribution(
    "?utm_source=one_shot_forge&utm_medium=free_tool&utm_campaign=one_shot_value_launch&utm_content=quests_recommended_origin_awesome_dnd",
    ""
  ) ===
    "source.one-shot-forge/campaign.one-shot-value-launch/content.quests-recommended-origin-awesome-dnd",
  "One-Shot Forge checkout-origin attribution must remain observable"
);
assert(
  api.fixedAttribution("", "https://www.gamestruction.com/tools/item-catalog") ===
    "source.gamestruction",
  "Gamestruction referrers must reduce to the fixed source label"
);
assert(
  api.fixedAttribution("", "https://rpggen.dev/generators/one-shot") ===
    "source.rpggen-dev",
  "RPGGen referrers must reduce to the fixed source label"
);
assert(
  api.fixedAttribution("", "https://unexpected.example/private/path?email=a@b.com") ===
    "source.external",
  "Unknown referrers must be reduced to a generic label"
);

const routedAttribution = [];
for (const filePath of allHtmlFiles(root)) {
  const relativePath = path.relative(root, filePath).replaceAll("\\", "/");
  const pageUrl = new URL(relativePath, "https://loottableworks.github.io/loot-drop-calculator/");
  const html = fs.readFileSync(filePath, "utf8");
  for (const match of html.matchAll(/href="([^"]*\/buy\/\?offer=[^"]+)"/g)) {
    routedAttribution.push(
      new URL(match[1].replaceAll("&amp;", "&"), pageUrl)
    );
  }
}
assert(routedAttribution.length === 72, "Paid-route attribution inventory drifted");
for (const route of routedAttribution) {
  const reduced = api.fixedAttribution(route.search, "");
  for (const [key, prefix] of [
    ["utm_source", "source"],
    ["utm_campaign", "campaign"],
    ["utm_content", "content"]
  ]) {
    const expected = route.searchParams.get(key).replaceAll("_", "-");
    assert(
      reduced.split("/").includes(`${prefix}.${expected}`),
      `${key}=${route.searchParams.get(key)} is missing from measurement allowlists`
    );
  }
}

for (const offerId of Object.keys(registry.offers)) {
  const event = api.classifyLink(
    `https://loottableworks.github.io/loot-drop-calculator/buy/?offer=${offerId}&private=a@b.com`,
    "/loot-drop-calculator/world-foundry/",
    registry
  );
  assert(event?.event === `paid-intent.${offerId}.from.world-foundry`, `${offerId}: intent drift`);
  assert(!JSON.stringify(event).includes("a@b.com"), `${offerId}: intent leaked query data`);
}

for (const [offerId, offer] of Object.entries(registry.offers)) {
  for (const [storeId, state] of Object.entries(offer.stores)) {
    if (state.status !== "public") continue;
    const event = api.classifyLink(
      `${state.url}?utm_source=private@example.com`,
      "/loot-drop-calculator/buy/",
      registry
    );
    assert(
      event?.event === `store-outbound.${storeId}.${offerId}.from.checkout`,
      `${offerId}/${storeId}: outbound classification drifted`
    );
  }
}

const sent = [];
production.goatcounter.count = (record) => sent.push(record);
for (const [offerId, offer] of Object.entries(registry.offers)) {
  for (const [storeId, state] of Object.entries(offer.stores)) {
    if (state.status !== "public") continue;
    await api.recordCheckoutRedirect(storeId, offerId, registry);
    assert(
      sent.at(-1)?.path === `checkout-redirect.${storeId}.${offerId}`,
      `${offerId}/${storeId}: checkout redirect event drifted`
    );
  }
}
assert(
  (await api.recordCheckoutRedirect("gumroad", "item", registry)) === false,
  "Pending storefront redirect must fail closed"
);
assert(
  (await api.recordCheckoutRedirect("itch", "unknown", registry)) === false,
  "Unknown offer redirect must fail closed"
);

const downloadEvent = api.classifyLink(
  "https://loottableworks.github.io/loot-drop-calculator/downloads/gullwatch-beacon-play-tonight-kit-v1.zip?token=secret",
  "/loot-drop-calculator/gullwatch-beacon/"
);
assert(
  downloadEvent.event === "download.gullwatch-beacon.from.gullwatch-beacon",
  "Gullwatch download event drifted"
);
const handoffEvent = api.classifyLink(
  "https://loottableworks.github.io/loot-drop-calculator/campaign-workspace/?view=field-test&private=1",
  "/loot-drop-calculator/gullwatch-aftermath/"
);
assert(
  handoffEvent.event === "handoff.campaign-workspace.from.gullwatch-aftermath",
  "Workflow handoff event drifted"
);

for (const scenario of [
  { endpoint: placeholder },
  { pathname: "/loot-drop-calculator/free-rpg-tools/" },
  { search: "?ltw_qa=1" },
  { doNotTrack: "1" },
  { optedOut: true },
  { userAgent: "Googlebot/2.1" },
  { userAgent: "Mozilla/5.0 HeadlessChrome/120" }
]) {
  const result = execute(scenario);
  assert(result.appended.length === 0, `Excluded scenario loaded analytics: ${JSON.stringify(scenario)}`);
}

assert(!loaderSource.includes("location.pathname + location.search"), "Raw query path is forbidden");
assert(!loaderSource.includes("utm_medium"), "Free-form medium must not be read");

console.log(
  `Privacy measurement v2 candidate validated: ${checks} checks; eleven funnel pages, seven offers, and twelve storefront policies remain fail-closed.`
);
