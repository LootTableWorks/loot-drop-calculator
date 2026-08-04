import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.dirname(fileURLToPath(import.meta.url));
const screenshotRoot = path.join(
  os.tmpdir(),
  "loot-table-works",
  "fantasy-rpg-data-pack-finder-v1",
);
fs.mkdirSync(screenshotRoot, { recursive: true });

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

function resolveRequest(requestUrl) {
  const pathname = decodeURIComponent(
    new URL(requestUrl || "/", "http://127.0.0.1").pathname,
  );
  const relative = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const candidate = path.resolve(root, `.${relative}`);
  if (
    !candidate.startsWith(root) ||
    !fs.existsSync(candidate) ||
    !fs.statSync(candidate).isFile()
  ) {
    return null;
  }
  return candidate;
}

const server = http.createServer((request, response) => {
  if (request.url === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }
  const filePath = resolveRequest(request.url);
  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type":
      mimeTypes[path.extname(filePath).toLowerCase()] ||
      "application/octet-stream",
  });
  fs.createReadStream(filePath).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});

let checks = 0;
function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

const offers = {
  items: ["item", "Item Catalog & Economy Kit"],
  merchants: ["merchant", "Merchant & Shop Kit"],
  crafting: ["recipe", "Crafting & Recipe Kit"],
  loot: ["loot", "Enemy Loot & Reward Kit"],
  quests: ["quest", "Quest, Contract & Reward Kit"],
  encounters: ["encounter", "Encounter & Threat Kit"],
};

try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 1000 },
    mobile: { width: 390, height: 844 },
    narrow: { width: 320, height: 760 },
  })) {
    const page = await browser.newPage({ viewport });
    const browserIssues = [];
    const missingResources = [];
    page.on("pageerror", (error) => browserIssues.push(`pageerror:${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") {
        browserIssues.push(`console:${message.text()}`);
      }
    });
    page.on("response", (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });

    const response = await page.goto(
      `${baseUrl}/choose-world-foundry-module/?utm_source=gamestruction&utm_medium=tool_directory&utm_campaign=ltw_data_pack_discovery_v1&utm_content=item_catalog_demo_upgrade&ltw_qa=1`,
      { waitUntil: "networkidle" },
    );
    check(response?.status() === 200, `${name}: finder did not return 200`);
    check(
      (await page.title()) ===
        "Fantasy RPG Data Packs (JSON + CSV) for Unity & Godot",
      `${name}: search-intent title drifted`,
    );
    check(
      (await page.locator("h1").innerText()) ===
        "Choose production-ready fantasy RPG data without rebuilding it.",
      `${name}: value proposition drifted`,
    );
    check(
      (await page.locator(".intent-proof > div").count()) === 4,
      `${name}: intent proof count drifted`,
    );
    check(
      await page.locator("#campaign-route").isVisible(),
      `${name}: campaign branch is not visible`,
    );
    await page.keyboard.press("Tab");
    check(
      await page.evaluate(() => document.activeElement?.classList.contains("skip-link")),
      `${name}: keyboard skip link is not first`,
    );
    check(await page.locator(".skip-link").isVisible(), `${name}: focused skip link is hidden`);
    await page.evaluate(() => document.activeElement?.blur());

    const layout = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };
      const boundedSelectors = [
        ".selector-heading-actions a",
        ".intent-proof > div",
        ".campaign-route",
        ".campaign-route-actions a",
        ".selector-controls",
        ".recommendation",
      ];
      const bounded = boundedSelectors.flatMap((selector) =>
        [...document.querySelectorAll(selector)].filter(visible),
      );
      const textNodes = [
        ...document.querySelectorAll(
          ".selector-heading-actions a,.intent-proof dd,.campaign-route h2,.campaign-route-actions a,.price-lock",
        ),
      ].filter(visible);
      return {
        horizontalOverflow:
          Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) >
          window.innerWidth + 1,
        outOfBounds: bounded.filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left < -1 || rect.right > window.innerWidth + 1;
        }).length,
        textOverflow: textNodes.filter(
          (element) => element.scrollWidth > element.clientWidth + 1,
        ).length,
        brokenImages: [...document.images]
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.getAttribute("src")),
      };
    });
    check(!layout.horizontalOverflow, `${name}: horizontal overflow`);
    check(layout.outOfBounds === 0, `${name}: key element escaped viewport`);
    check(layout.textOverflow === 0, `${name}: key text overflow`);
    check(
      layout.brokenImages.length === 0,
      `${name}: broken images ${layout.brokenImages.join(", ")}`,
    );

    const campaignUrl = new URL(
      await page.locator(".campaign-primary").getAttribute("href"),
    );
    check(campaignUrl.pathname.endsWith("/buy/"), `${name}: campaign route bypassed checkout`);
    check(campaignUrl.searchParams.get("offer") === "gullwatch_harbor", `${name}: campaign offer drifted`);
    check(campaignUrl.searchParams.get("utm_source") === "data_pack_finder", `${name}: campaign source drifted`);
    check(campaignUrl.searchParams.get("utm_medium") === "owned_web", `${name}: campaign medium drifted`);
    check(campaignUrl.searchParams.get("utm_campaign") === "fantasy_rpg_data_packs_v1", `${name}: campaign name drifted`);
    check(campaignUrl.searchParams.get("utm_content") === "gullwatch_harbor_campaign", `${name}: campaign content drifted`);
    check(
      campaignUrl.searchParams.get("utm_term") ===
        "origin_gamestruction_item_catalog_demo_upgrade",
      `${name}: upstream Gamestruction attribution was not preserved`,
    );

    const demoUrl = new URL(
      await page.locator(".heading-primary").getAttribute("href"),
      page.url(),
    );
    check(demoUrl.pathname.endsWith("/item-catalog-demo/"), `${name}: demo route drifted`);
    check(demoUrl.searchParams.get("utm_content") === "inspect_100_free_records", `${name}: demo attribution drifted`);

    for (const [problem, [offerId, title]] of Object.entries(offers)) {
      await page.locator(`input[name="problem"][value="${problem}"]`).check();
      check((await page.locator("#result-title").innerText()) === title, `${name}: ${problem} result drifted`);
      const resultUrl = new URL(await page.locator("#result-link").getAttribute("href"));
      check(resultUrl.searchParams.get("offer") === offerId, `${name}: ${problem} offer drifted`);
      check(
        resultUrl.searchParams.get("utm_term") ===
          "origin_gamestruction_item_catalog_demo_upgrade",
        `${name}: ${problem} origin attribution drifted`,
      );
    }

    check(browserIssues.length === 0, `${name}: ${browserIssues.join(" | ")}`);
    check(missingResources.length === 0, `${name}: missing ${missingResources.join(", ")}`);
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    });
    const screenshot = await page.screenshot({
      path: path.join(screenshotRoot, `${name}.png`),
      fullPage: true,
    });
    check(screenshot.length > 40000, `${name}: screenshot is unexpectedly small`);
    await page.close();
  }

  console.log(
    `Fantasy RPG data-pack finder browser QA passed ${checks} responsive, media, selector, checkout, and attribution checks. Screenshots: ${screenshotRoot}`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
