import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const loaderPath = path.join(root, "assets", "privacy-metrics-v1.js");
const loaderSource = fs.readFileSync(loaderPath, "utf8");
const placeholder = "__LTW_GOATCOUNTER_ENDPOINT__";
const expectedEndpoint =
  process.env.LTW_GOATCOUNTER_ENDPOINT || placeholder;
const expectedIntegrity =
  "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ";

const measuredPages = [
  "index.html",
  "world-foundry/index.html",
  "gullwatch-beacon/index.html",
  "gullwatch-aftermath/index.html",
  "choose-world-foundry-module/index.html",
  "connected-record-proof/index.html",
  "press-kit/index.html"
];

const coreToolPages = [
  "campaign-arc-forge/index.html",
  "campaign-launchpad/index.html",
  "campaign-workspace/index.html",
  "character-foundry/index.html",
  "loot-odds/index.html",
  "one-shot-forge/index.html",
  "player-chronicle/index.html",
  "rpg-data-bridge/index.html",
  "rpg-data-doctor/index.html",
  "shop-inventory-generator/index.html",
  "world-seed-studio/index.html"
];

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

function allHtmlFiles(directory) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git") {
      continue;
    }
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...allHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      output.push(fullPath);
    }
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
  links = []
} = {}) {
  const appended = [];
  const window = {};
  const location = {
    hostname: "loottableworks.github.io",
    pathname,
    search
  };
  const document = {
    currentScript: {
      dataset: {
        goatcounterEndpoint: endpoint
      }
    },
    referrer,
    querySelectorAll(selector) {
      return selector === "a[href]" ? links : [];
    },
    createElement(tagName) {
      return {
        tagName,
        dataset: {}
      };
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
    URL,
    URLSearchParams,
    document,
    location,
    localStorage,
    navigator: { doNotTrack },
    window
  };
  vm.runInNewContext(loaderSource, context, {
    filename: "privacy-metrics-v1.js"
  });
  return {
    api: window.LTWPrivacyMetrics,
    appended,
    goatcounter: window.goatcounter,
    links
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
}

for (const relativePath of coreToolPages) {
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

assert(
  !read("index.html").includes("No background analytics"),
  "The measured front door must not retain the no-analytics promise"
);
assert(
  read("campaign-workspace/app.js").includes("No analytics run here"),
  "The uninstrumented Campaign Workspace field-test disclosure must remain"
);

const privacyHtml = read("privacy/index.html");
for (const requiredText of [
  "Aggregate counts, not player profiles.",
  "No cookies",
  "No campaign text",
  "No raw query string",
  "No analytics on the Campaign Workspace field-test route",
  "individual-pageview storage in GoatCounter; that optional setting must remain disabled",
  "Do Not Track is honored",
  "Exclude this browser"
]) {
  assert(
    privacyHtml.includes(requiredText),
    `Privacy page is missing: ${requiredText}`
  );
}

assert(
  read("sitemap.xml").includes(
    "https://loottableworks.github.io/loot-drop-calculator/privacy/"
  ),
  "Privacy page is missing from the sitemap"
);
assert(
  read("README.md").includes("Seven public acquisition pages"),
  "Repository privacy boundary is missing"
);

const productionLink = linkMock(
  "https://loot-table-works.itch.io/original-fantasy-item-data-pack?utm_source=private@example.com"
);
const production = execute({
  pathname: "/loot-drop-calculator/connected-record-proof/",
  search: "?utm_source=instagram&utm_campaign=private@example.com",
  links: [productionLink]
});
assert(production.appended.length === 1, "Production scenario must load one vendor script");
assert(
  production.appended[0].src === "https://gc.zgo.at/count.v5.js",
  "Vendor script must use pinned GoatCounter v5"
);
assert(
  production.appended[0].integrity === expectedIntegrity,
  "Vendor SRI hash drifted"
);
assert(
  production.appended[0].crossOrigin === "anonymous",
  "Vendor script must use anonymous CORS"
);
assert(
  production.appended[0].dataset.goatcounter ===
    "https://loottableworks.goatcounter.com/count",
  "GoatCounter endpoint drifted"
);
assert(
  production.goatcounter.path === "/connected-record-proof/",
  "Pageview path must be canonical and query-free"
);
assert(
  production.goatcounter.referrer === "source.instagram",
  "Approved source attribution was not reduced to a fixed label"
);
assert(
  productionLink.attributes["data-goatcounter-click"] ===
    "paid.item-catalog.from.connected-record-proof",
  "Paid event is not fixed and route-scoped"
);
assert(
  !JSON.stringify({
    goatcounter: production.goatcounter,
    vendor: production.appended[0],
    eventAttributes: productionLink.attributes
  }).includes("private@example.com"),
  "Raw query or href data leaked into the measurement output"
);

const api = production.api;
assert(
  api.pagePath("/loot-drop-calculator/?private=email@example.com") === null,
  "A query-like path must not be accepted as a page path"
);
assert(
  api.sourceLabel("?utm_source=unknown@example.com", "") === "source.direct",
  "Unknown UTM data must not be forwarded"
);
assert(
  api.sourceLabel("", "https://unexpected.example/private/path?email=a@b.com") ===
    "source.external",
  "Unknown referrers must be reduced to a generic label"
);

const paidEvent = api.classifyLink(
  "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit?email=a@b.com",
  "/loot-drop-calculator/world-foundry/"
);
assert(
  paidEvent.event === "paid.encounter-threat.from.world-foundry",
  "Paid event classification drifted"
);
assert(
  !JSON.stringify(paidEvent).includes("a@b.com"),
  "Paid event leaked query data"
);

const downloadEvent = api.classifyLink(
  "https://loottableworks.github.io/loot-drop-calculator/downloads/gullwatch-beacon-play-tonight-kit-v1.zip?token=secret",
  "/loot-drop-calculator/gullwatch-beacon/"
);
assert(
  downloadEvent.event === "download.gullwatch-beacon.from.gullwatch-beacon",
  "Gullwatch download event classification drifted"
);

const pressEvent = api.classifyLink(
  "https://loottableworks.github.io/loot-drop-calculator/press-kit/loot-table-works-press-facts.txt?private=1",
  "/loot-drop-calculator/press-kit/"
);
assert(
  pressEvent.event === "download.press-facts.from.press-kit",
  "Press download event classification drifted"
);

const handoffEvent = api.classifyLink(
  "https://loottableworks.github.io/loot-drop-calculator/campaign-workspace/?view=field-test&utm_source=private",
  "/loot-drop-calculator/gullwatch-aftermath/"
);
assert(
  handoffEvent.event === "handoff.campaign-workspace.from.gullwatch-aftermath",
  "Workflow handoff event classification drifted"
);

for (const scenario of [
  { endpoint: placeholder },
  { pathname: "/loot-drop-calculator/campaign-workspace/" },
  { search: "?ltw_qa=1" },
  { doNotTrack: "1" },
  { optedOut: true }
]) {
  const result = execute(scenario);
  assert(
    result.appended.length === 0,
    `Excluded scenario loaded analytics: ${JSON.stringify(scenario)}`
  );
}

assert(
  !loaderSource.includes("location.pathname + location.search"),
  "Loader must never send the raw query string as the page path"
);
assert(
  !loaderSource.includes("utm_campaign") &&
    !loaderSource.includes("utm_content") &&
    !loaderSource.includes("utm_medium"),
  "Loader must not read free-form campaign parameters"
);

console.log(
  `Privacy measurement v1 candidate validated: ${checks} checks; seven acquisition pages only; deployment endpoint remains locked.`
);
