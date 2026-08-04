import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const assetBase =
  "https://github.com/LootTableWorks/loot-drop-calculator/releases/download/gullwatch-beacon-v1.0.0/gullwatch-beacon-play-tonight-kit-v1.zip";
const expectedRoutes = [
  {
    file: "gullwatch-beacon/index.html",
    source: "play_tonight_page",
    medium: "download",
    campaign: "gullwatch_v1",
    content: "complete_kit",
    label: "Download the complete free kit",
  },
  {
    file: "press-kit/index.html",
    source: "press_kit",
    medium: "owned_media",
    campaign: "press_creator_kit_v1",
    content: "gullwatch_download",
    label: "Download the complete kit",
  },
];

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const pageHtml = new Map();

const releaseRecord = JSON.parse(
  fs.readFileSync(
    path.join(root, "..", "..", "quality", "gullwatch-github-release-v1-release.json"),
    "utf8",
  ),
);
check(
  releaseRecord.status === "PUBLIC_ROUNDTRIP_VERIFIED_ZERO_DEMAND",
  "Release evidence status drift.",
);
check(releaseRecord.release.id === 362409454, "Release ID drift.");
check(releaseRecord.asset.id === 495323433, "Release asset ID drift.");
check(releaseRecord.asset.download_url === assetBase, "Release asset URL drift.");
check(releaseRecord.asset.bytes === 16_231_801, "Release asset byte drift.");
check(
  releaseRecord.asset.sha256 ===
    "f4a364fc9c3f181844c46dc746aa1f6cda47cca92db3c92c087c064c2f21ebba",
  "Release asset hash drift.",
);
check(
  releaseRecord.measurement.github_release_download_count_baseline === 0,
  "Release download baseline drift.",
);
check(
  releaseRecord.measurement.publication_workflow_or_qa_counted_as_demand ===
    false,
  "Release operations were counted as demand.",
);

let routedAnchorCount = 0;
for (const route of expectedRoutes) {
  const html = fs
    .readFileSync(path.join(root, ...route.file.split("/")), "utf8")
    .replaceAll("\r\n", "\n");
  pageHtml.set(route.file, html);
  const anchorPattern =
    /<a\b[^>]*data-download-route="github-release-v1"[^>]*data-release-asset-id="495323433"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const matches = [...html.matchAll(anchorPattern)];
  check(matches.length === 1, `Measured download anchor drift: ${route.file}`);
  routedAnchorCount += matches.length;

  const decodedHref = matches[0][1].replaceAll("&amp;", "&");
  const url = new URL(decodedHref);
  check(
    `${url.origin}${url.pathname}` === assetBase,
    `Release asset target drift: ${route.file}`,
  );
  check(url.searchParams.get("utm_source") === route.source, `Source drift: ${route.file}`);
  check(url.searchParams.get("utm_medium") === route.medium, `Medium drift: ${route.file}`);
  check(
    url.searchParams.get("utm_campaign") === route.campaign,
    `Campaign drift: ${route.file}`,
  );
  check(
    url.searchParams.get("utm_content") === route.content,
    `Content drift: ${route.file}`,
  );
  check(matches[0][2].trim() === route.label, `Label drift: ${route.file}`);
  check(
    !html.includes("../downloads/gullwatch-beacon-play-tonight-kit-v1.zip"),
    `Unmeasured relative archive route remains: ${route.file}`,
  );
  check(
    !decodedHref.toLowerCase().includes("bundle"),
    `Bundle route detected in measured CTA: ${route.file}`,
  );
}
check(routedAnchorCount === 2, "Measured public download route count drift.");

const gullwatchHtml = pageHtml.get("gullwatch-beacon/index.html");
const pressHtml = pageHtml.get("press-kit/index.html");
check(
  gullwatchHtml.includes("<h2>Optional $3 world expansions</h2>"),
  "Gullwatch optional-expansion price heading drift.",
);
check(
  (gullwatchHtml.match(/\$3/g) ?? []).length === 4,
  "Gullwatch visible $3 contract drift.",
);
check(
  (pressHtml.match(/\$3/g) ?? []).length === 2,
  "Press-kit visible $3 contract drift.",
);
check(
  pressHtml.includes(
    "<dt>Paid catalog</dt><dd>Six standalone World Foundry data modules at $3 each</dd>",
  ),
  "Press-kit paid-catalog price drift.",
);
check(
  pressHtml.includes(
    "<dt>Current bundle status</dt><dd>No public bundle is currently offered</dd>",
  ),
  "Press-kit bundle-status disclosure drift.",
);
check(
  pressHtml.includes(
    "<p>Six standalone $3 modules cover items, merchants, crafting, enemy loot, quests, and encounters.",
  ),
  "Press-kit World Foundry price copy drift.",
);
for (const [file, html] of pageHtml) {
  check(!html.includes("$4"), `Unexpected $4 commercial copy detected: ${file}`);
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) =>
    match[1].replaceAll("&amp;", "&"),
  );
  check(
    hrefs.every((href) => !href.toLowerCase().includes("bundle")),
    `Public bundle link detected: ${file}`,
  );
}
const expectedPaidOffers = ["encounter", "quest", "loot"];
const gullwatchPaidLinks = [
  ...gullwatchHtml.matchAll(
    /data-offer-id="([^"]+)"[^>]*href="([^"]+)"[^>]*>View the \$3 pack<\/a>/g,
  ),
].map((match) => ({
  marker: match[1],
  url: new URL(
    match[2].replaceAll("&amp;", "&"),
    "https://loottableworks.github.io/loot-drop-calculator/gullwatch-beacon/",
  ),
}));
check(gullwatchPaidLinks.length === 3, "Gullwatch paid-link count drift.");
for (const [index, offerId] of expectedPaidOffers.entries()) {
  const { marker, url: paidUrl } = gullwatchPaidLinks[index];
  check(marker === offerId, `Paid offer marker drift: ${offerId}`);
  check(
    paidUrl.pathname === "/loot-drop-calculator/buy/",
    `Checkout route drift: ${offerId}`,
  );
  check(paidUrl.searchParams.get("offer") === offerId, `Paid offer drift: ${offerId}`);
  check(
    paidUrl.searchParams.get("utm_source") === "gullwatch_kit",
    `Paid source drift: ${offerId}`,
  );
  check(
    paidUrl.searchParams.get("utm_campaign") ===
      "play_tonight_gullwatch_v1",
    `Paid campaign drift: ${offerId}`,
  );
}

const retainedArchive = fs.readFileSync(
  path.join(root, "downloads", "gullwatch-beacon-play-tonight-kit-v1.zip"),
);
check(retainedArchive.length === 16_231_801, "Fallback archive byte drift.");
check(
  crypto.createHash("sha256").update(retainedArchive).digest("hex") ===
    "f4a364fc9c3f181844c46dc746aa1f6cda47cca92db3c92c087c064c2f21ebba",
  "Fallback archive hash drift.",
);
check(releaseRecord.protected_boundaries.price_changed === false, "Price changed.");
check(
  releaseRecord.protected_boundaries.bundle_published === false,
  "Bundle gate changed.",
);
check(
  releaseRecord.protected_boundaries.all_faze_electric_involved === false,
  "All Faze Electric boundary drift.",
);

console.log(
  `PASS validate-gullwatch-release-download-routing-v1.mjs (${checks} checks): two attributed public CTAs route to the exact measured release asset while the fallback archive and commercial boundaries remain intact.`,
);
