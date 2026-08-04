import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const siteBase = "https://loottableworks.github.io/loot-drop-calculator/";
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

function attribute(html, kind, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(
      `<meta\\s+${kind}="${escaped}"\\s+content="([^"]+)"`,
      "i"
    )
  );
  return match?.[1] ?? null;
}

function title(html) {
  return html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? null;
}

function canonical(html) {
  return (
    html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] ?? null
  );
}

function structuredData(html) {
  const scripts = [
    ...html.matchAll(
      /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi
    )
  ];
  return scripts.map((match) => JSON.parse(match[1]));
}

function pngDimensions(relativePath) {
  const buffer = fs.readFileSync(path.join(root, relativePath));
  assert(
    buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a",
    `${relativePath} is not a real PNG`
  );
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function sha256(relativePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(root, relativePath)))
    .digest("hex");
}

function committedBlob(relativePath) {
  return execFileSync("git", ["show", `HEAD:${relativePath}`], {
    cwd: root,
    encoding: null,
    maxBuffer: 20 * 1024 * 1024
  });
}

function verifyManifestFile(manifestPath, relativeRoot, relativePath) {
  const manifest = JSON.parse(read(manifestPath));
  const record = manifest.files.find((entry) => entry.path === relativePath);
  assert(record, `${manifestPath} is missing ${relativePath}`);
  const fullRelativePath = path.posix.join(relativeRoot, relativePath);
  const blob = committedBlob(fullRelativePath);
  assert(
    record.bytes === blob.length,
    `${fullRelativePath} committed byte count drifted`
  );
  assert(
    record.sha256 ===
      crypto.createHash("sha256").update(blob).digest("hex"),
    `${fullRelativePath} committed hash drifted`
  );

  const local = fs.readFileSync(path.join(root, fullRelativePath));
  const normalizedLocal = fullRelativePath.endsWith(".png")
    ? local
    : Buffer.from(local.toString("utf8").replaceAll("\r\n", "\n"), "utf8");
  assert(
    normalizedLocal.equals(blob),
    `${fullRelativePath} working content differs from the committed blob`
  );
}

const campaign = read("campaign-workspace/index.html");
assert(
  title(campaign) === "Free TTRPG Campaign Tracker | Gullwatch Workspace",
  "Campaign Workspace title does not match search intent"
);
assert(
  attribute(campaign, "name", "description")?.startsWith(
    "Free local-first TTRPG campaign tracker"
  ),
  "Campaign Workspace description does not match the local-first tracker intent"
);
assert(
  canonical(campaign) === `${siteBase}campaign-workspace/`,
  "Campaign Workspace canonical URL drifted"
);
assert(
  attribute(campaign, "property", "og:image") ===
    `${siteBase}world-foundry/assets/campaign-workspace-preview-v1.png`,
  "Campaign Workspace social preview does not show the product"
);
assert(
  attribute(campaign, "property", "og:image:width") === "1425" &&
    attribute(campaign, "property", "og:image:height") === "891",
  "Campaign Workspace social dimensions drifted"
);
assert(
  attribute(campaign, "property", "og:image:alt")?.includes(
    "Campaign Workspace"
  ),
  "Campaign Workspace social preview alt text is missing"
);
const campaignSchema = structuredData(campaign).find(
  (entry) => entry["@type"] === "WebApplication"
);
assert(campaignSchema, "Campaign Workspace WebApplication schema is missing");
assert(
  campaignSchema.alternateName === "Free TTRPG Campaign Tracker" &&
    campaignSchema.isAccessibleForFree === true &&
    campaignSchema.offers?.price === "0",
  "Campaign Workspace free-product schema drifted"
);
assert(
  campaignSchema.featureList?.length === 5 &&
    campaignSchema.featureList.includes("Campaign timeline and canon"),
  "Campaign Workspace feature schema is incomplete"
);

const campaignPreview = pngDimensions(
  "world-foundry/assets/campaign-workspace-preview-v1.png"
);
assert(
  campaignPreview.width === 1425 && campaignPreview.height === 891,
  "Campaign Workspace preview dimensions do not match metadata"
);

const worldFoundry = read("world-foundry/index.html");
assert(
  attribute(worldFoundry, "property", "og:image:width") === "1425" &&
    attribute(worldFoundry, "property", "og:image:height") === "891",
  "World Foundry preview dimensions do not match the corrected asset"
);
assert(
  worldFoundry.includes(
    '<img src="assets/campaign-workspace-preview-v1.png" width="1425" height="891"'
  ),
  "World Foundry visible image dimensions drifted"
);

const gullwatch = read("gullwatch-beacon/index.html");
assert(
  title(gullwatch) ===
    "Free System-Neutral TTRPG One-Shot | Gullwatch Beacon",
  "Gullwatch title does not match one-shot search intent"
);
assert(
  canonical(gullwatch) === `${siteBase}gullwatch-beacon/`,
  "Gullwatch canonical URL drifted"
);
assert(
  attribute(gullwatch, "property", "og:image") ===
    `${siteBase}assets/gullwatch-beacon-hero-v2.png`,
  "Gullwatch social preview does not use the reviewed hero"
);
assert(
  attribute(gullwatch, "property", "og:image:width") === "1672" &&
    attribute(gullwatch, "property", "og:image:height") === "941",
  "Gullwatch social dimensions drifted"
);
assert(
  attribute(gullwatch, "property", "og:image:alt")?.includes(
    "Gullwatch Beacon"
  ),
  "Gullwatch social preview alt text is missing"
);
const gullwatchSchema = structuredData(gullwatch).find(
  (entry) => entry["@type"] === "Game"
);
assert(gullwatchSchema, "Gullwatch Game schema is missing");
assert(
  gullwatchSchema.isAccessibleForFree === true &&
    gullwatchSchema.offers?.price === "0" &&
    gullwatchSchema.numberOfPlayers?.minValue === 3 &&
    gullwatchSchema.numberOfPlayers?.maxValue === 6,
  "Gullwatch free-game schema drifted"
);
assert(
  gullwatchSchema.description.includes("four scenes") &&
    gullwatchSchema.description.includes("six tokens") &&
    !Object.hasOwn(gullwatchSchema, "timeRequired"),
  "Gullwatch schema claims are incomplete"
);
const gullwatchPreview = pngDimensions("assets/gullwatch-beacon-hero-v2.png");
assert(
  gullwatchPreview.width === 1672 && gullwatchPreview.height === 941,
  "Gullwatch preview dimensions do not match metadata"
);

verifyManifestFile(
  "campaign-workspace/PACKAGE-MANIFEST.json",
  "campaign-workspace",
  "index.html"
);
for (const relativePath of [
  "assets/campaign-workspace-preview-v1.png",
  "index.html"
]) {
  verifyManifestFile(
    "world-foundry/MANIFEST.json",
    "world-foundry",
    relativePath
  );
}
assert(
  JSON.parse(read("world-foundry/MANIFEST.json")).version === "1.10.1",
  "World Foundry multi-store funnel version drifted"
);

const sitemap = read("sitemap.xml");
for (const route of [
  "campaign-workspace/",
  "world-foundry/",
  "gullwatch-beacon/"
]) {
  assert(
    sitemap.includes(
      `<loc>${siteBase}${route}</loc>\n    <lastmod>2026-07-30</lastmod>`
    ),
    `${route} sitemap date was not refreshed`
  );
}

console.log(
  `Search acquisition metadata v1 passed ${checks} checks across the free campaign tracker, free one-shot, corrected product preview, structured data, and sitemap.`
);
