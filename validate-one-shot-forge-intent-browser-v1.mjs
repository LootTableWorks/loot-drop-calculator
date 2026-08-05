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
  "one-shot-forge-intent-v1",
);
fs.mkdirSync(screenshotRoot, { recursive: true });

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
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

async function inspectLayout(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const bounded = [
      ...document.querySelectorAll(
        ".app-header,.control-rail,.adventure-stage,.adventure-actions,.stats-band,.adventure-overview,.contextual-item-offer,.result-tabs,.campaign-continuation,.marketplace-heading,.recommendation-card,.site-footer",
      ),
    ].filter(visible);
    const textNodes = [
      ...document.querySelectorAll(
        ".control-heading,.control-trust li,.generate-button,.adventure-actions button,.stat,.contextual-item-copy,.contextual-proof,.contextual-item-actions a,.result-tabs button,.campaign-continuation-action a,.recommendation-card a",
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
}

try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 1000 },
    mobile: { width: 390, height: 844 },
    narrow: { width: 320, height: 760 },
  })) {
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async (value) => { window.__copiedText = value; } },
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: undefined,
      });
      window.print = () => { window.__printCalled = true; };
      window.__downloadBlobs = new Map();
      window.__downloads = [];
      let nextBlobId = 0;
      URL.createObjectURL = (blob) => {
        const blobUrl = `blob:ltw-qa-${++nextBlobId}`;
        window.__downloadBlobs.set(blobUrl, blob);
        return blobUrl;
      };
      URL.revokeObjectURL = () => {};
      const nativeAnchorClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function click() {
        if (this.download) {
          window.__downloads.push({ href: this.href, filename: this.download });
          return;
        }
        nativeAnchorClick.call(this);
      };
    });
    const page = await context.newPage();
    const browserIssues = [];
    const missingResources = [];
    page.on("pageerror", (error) => browserIssues.push(`pageerror:${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") browserIssues.push(`console:${message.text()}`);
    });
    page.on("response", (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });

    const response = await page.goto(
      `${baseUrl}/one-shot-forge/?seed=intent-47&utm_source=awesome_dnd&utm_medium=referral_directory&utm_campaign=ltw_free_tool_directory_v1&utm_content=one_shot_forge_generator&ltw_qa=1`,
      { waitUntil: "networkidle" },
    );
    check(response?.status() === 200, `${name}: One-Shot Forge did not return 200`);
    check(
      (await page.title()) ===
        "Free TTRPG One-Shot Generator - No Sign-Up | Loot Table Works",
      `${name}: high-intent title drifted`,
    );
    check(
      (await page.locator('meta[name="description"]').getAttribute("content"))?.includes(
        "complete 2-4 hour fantasy adventure",
      ),
      `${name}: outcome-led description drifted`,
    );
    check(
      (await page.locator("h1").innerText()) === "One-Shot Forge",
      `${name}: product H1 drifted`,
    );
    check(
      (await page.locator(".control-promise").innerText()).startsWith(
        "Build a complete 2-4 hour adventure",
      ),
      `${name}: first-screen promise drifted`,
    );
    check(
      (await page.locator(".control-trust li").allInnerTexts()).join("|") ===
        "No sign-up|No prompt writing|Runs locally",
      `${name}: trust markers drifted`,
    );
    check(
      (await page.locator("#generate").innerText()) === "Generate complete one-shot",
      `${name}: primary command drifted`,
    );
    const initialValidity = (await page.locator("#validity").textContent()).trim();
    check(
      initialValidity === "Validated packet",
      `${name}: initial packet is invalid (${initialValidity})`,
    );
    check(
      (await page.locator("#stat-scenes").innerText()) === "5",
      `${name}: initial scene count drifted`,
    );
    check(
      (await page.locator("#stat-characters").innerText()) === "4",
      `${name}: initial party count drifted`,
    );
    check(
      (await page.locator("#rail-missing").innerText()) === "0",
      `${name}: initial references are unresolved`,
    );
    check(
      (await page.locator(".timeline-row").count()) === 5,
      `${name}: run sheet does not expose five scenes`,
    );
    check(
      (await page.locator(".recommendation-card").count()) === 6,
      `${name}: paid recommendation count drifted`,
    );
    const initialPacket = JSON.parse(await page.locator("#json-output").innerText());
    const signatureItem = initialPacket.characters.find(
      (character) => character.signature_item_name,
    );
    const expectedItemName =
      initialPacket.rewards.item_name ||
      signatureItem?.signature_item_name ||
      "the reward";
    const expectedItemId =
      initialPacket.rewards.item_id ||
      signatureItem?.signature_item_id ||
      "stable item references";
    check(await page.locator("#contextual-item-offer").isVisible(), `${name}: contextual item offer is hidden`);
    check(
      (await page.locator("#contextual-item-title").innerText()).includes(expectedItemName),
      `${name}: generated reward name did not reach the item offer`,
    );
    check(
      (await page.locator("#contextual-item-reason").innerText()).includes(expectedItemId),
      `${name}: generated stable item ID did not reach the item offer`,
    );
    check(
      (await page.locator(".contextual-proof dd").allInnerTexts())
        .map((value) => value.replace(/\s+/g, ""))
        .join("|") ===
        "100500|20100|14|44",
      `${name}: demo-to-paid proof counts drifted`,
    );
    check(
      await page.evaluate(() => {
        const offer = document.querySelector("#contextual-item-offer");
        const tabs = document.querySelector(".result-tabs");
        return Boolean(offer && tabs && (offer.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING));
      }),
      `${name}: contextual item offer no longer precedes the run-sheet tabs`,
    );
    const preservedUrl = new URL(page.url());
    check(preservedUrl.searchParams.get("utm_source") === "awesome_dnd", `${name}: inbound source was erased`);
    check(preservedUrl.searchParams.get("utm_medium") === "referral_directory", `${name}: inbound medium was erased`);
    check(preservedUrl.searchParams.get("utm_campaign") === "ltw_free_tool_directory_v1", `${name}: inbound campaign was erased`);
    check(preservedUrl.searchParams.get("utm_content") === "one_shot_forge_generator", `${name}: inbound content was erased`);
    check(preservedUrl.searchParams.get("ltw_qa") === "1", `${name}: QA exclusion marker was erased`);
    check(
      await page.evaluate(() =>
        window.LTWPrivacyMetrics.fixedAttribution(window.location.search, "") ===
        "source.awesome-dnd/campaign.ltw-free-tool-directory-v1/content.one-shot-forge-generator"
      ),
      `${name}: fixed acquisition measurement drifted`,
    );

    const campaignUrl = new URL(
      await page.locator("#campaign-offer-link").getAttribute("href"),
    );
    check(campaignUrl.pathname.endsWith("/buy/"), `${name}: campaign bypassed checkout`);
    check(campaignUrl.searchParams.get("offer") === "gullwatch_harbor", `${name}: campaign offer drifted`);
    check(campaignUrl.searchParams.get("utm_source") === "one_shot_forge", `${name}: campaign source drifted`);
    check(campaignUrl.searchParams.get("utm_medium") === "free_tool", `${name}: campaign medium drifted`);
    check(campaignUrl.searchParams.get("utm_campaign") === "one_shot_value_launch", `${name}: campaign name drifted`);
    check(
      campaignUrl.searchParams.get("utm_content") ===
        "gullwatch_harbor_featured_campaign_origin_awesome_dnd",
      `${name}: campaign acquisition origin was not preserved`,
    );

    const contextualDemoUrl = new URL(
      await page.locator("#contextual-item-demo").getAttribute("href"),
    );
    check(contextualDemoUrl.pathname.endsWith("/item-catalog-demo/"), `${name}: contextual demo destination drifted`);
    check(contextualDemoUrl.searchParams.get("utm_source") === "one_shot_forge", `${name}: contextual demo source drifted`);
    check(contextualDemoUrl.searchParams.get("utm_medium") === "free_tool", `${name}: contextual demo medium drifted`);
    check(contextualDemoUrl.searchParams.get("utm_campaign") === "one_shot_value_launch", `${name}: contextual demo campaign drifted`);
    check(
      contextualDemoUrl.searchParams.get("utm_content") ===
        "item_context_demo_origin_awesome_dnd",
      `${name}: contextual demo acquisition origin drifted`,
    );

    const contextualBuyUrl = new URL(
      await page.locator("#contextual-item-buy").getAttribute("href"),
    );
    check(contextualBuyUrl.pathname.endsWith("/buy/"), `${name}: contextual purchase bypassed checkout`);
    check(contextualBuyUrl.searchParams.get("offer") === "item", `${name}: contextual purchase offer drifted`);
    check(contextualBuyUrl.searchParams.get("utm_source") === "one_shot_forge", `${name}: contextual purchase source drifted`);
    check(contextualBuyUrl.searchParams.get("utm_medium") === "free_tool", `${name}: contextual purchase medium drifted`);
    check(contextualBuyUrl.searchParams.get("utm_campaign") === "one_shot_value_launch", `${name}: contextual purchase campaign drifted`);
    check(
      contextualBuyUrl.searchParams.get("utm_content") ===
        "items_recommended_origin_awesome_dnd",
      `${name}: contextual purchase acquisition origin drifted`,
    );
    check(contextualBuyUrl.searchParams.get("utm_term") === "direct", `${name}: contextual purchase checkout marker drifted`);

    const recommendationUrls = [];
    for (const link of await page.locator(".recommendation-card a").all()) {
      const url = new URL(await link.getAttribute("href"));
      recommendationUrls.push(url);
      check(url.pathname.endsWith("/buy/"), `${name}: recommendation bypassed checkout`);
      check(Boolean(url.searchParams.get("offer")), `${name}: recommendation offer missing`);
      check(url.searchParams.get("utm_source") === "one_shot_forge", `${name}: recommendation source drifted`);
      check(url.searchParams.get("utm_medium") === "free_tool", `${name}: recommendation medium drifted`);
      check(
        url.searchParams.get("utm_content")?.endsWith("_recommended_origin_awesome_dnd"),
        `${name}: recommendation origin drifted`,
      );
      check(!url.hostname.endsWith("itch.io"), `${name}: recommendation exposed a direct paid listing`);
    }

    for (const [label, checkoutUrl, expectedOffer, expectedContent] of [
      [
        "campaign",
        campaignUrl,
        "gullwatch_harbor",
        "gullwatch_harbor_featured_campaign_origin_awesome_dnd",
      ],
      ["recommendation", recommendationUrls[0], "quest", "quests_recommended_origin_awesome_dnd"],
      ["contextual item", contextualBuyUrl, "item", "items_recommended_origin_awesome_dnd"],
    ]) {
      const checkoutPage = await context.newPage();
      await checkoutPage.addInitScript(() => {
        window.setTimeout = () => 0;
      });
      const localPath = checkoutUrl.pathname.replace(/^\/loot-drop-calculator/, "");
      const checkoutResponse = await checkoutPage.goto(
        `${baseUrl}${localPath}${checkoutUrl.search}`,
        { waitUntil: "networkidle" },
      );
      check(checkoutResponse?.status() === 200, `${name}: ${label} checkout did not return 200`);
      check((await checkoutPage.locator(".store-option").count()) === 1, `${name}: ${label} verified store count drifted`);
      const storefrontUrl = new URL(
        await checkoutPage.locator(".store-option").getAttribute("href"),
      );
      check(storefrontUrl.hostname === "loot-table-works.itch.io", `${name}: ${label} final store drifted`);
      check(storefrontUrl.searchParams.get("utm_source") === "one_shot_forge", `${name}: ${label} final source lost`);
      check(storefrontUrl.searchParams.get("utm_medium") === "free_tool", `${name}: ${label} final medium lost`);
      check(storefrontUrl.searchParams.get("utm_campaign") === "one_shot_value_launch", `${name}: ${label} final campaign lost`);
      check(storefrontUrl.searchParams.get("utm_content") === expectedContent, `${name}: ${label} final content lost`);
      check(storefrontUrl.searchParams.get("utm_term") === "itch", `${name}: ${label} final store marker lost`);
      check(checkoutUrl.searchParams.get("offer") === expectedOffer, `${name}: ${label} offer drifted`);
      await checkoutPage.close();
    }

    await page.locator('[data-duration="240"]').click();
    await page.locator("#party-size").fill("6");
    await page.locator("#party-size").dispatchEvent("change");
    await page.locator('[data-tone="mystery"]').click();
    check((await page.locator("#stat-minutes").innerText()) === "240", `${name}: duration change failed`);
    check((await page.locator("#stat-characters").innerText()) === "6", `${name}: party-size change failed`);
    check((await page.locator("#validity").textContent()).trim() === "Validated packet", `${name}: changed packet is invalid`);
    check((await page.locator(".character-card").count()) === 6, `${name}: changed party was not rendered`);
    const changedUrl = new URL(page.url());
    check(
      changedUrl.searchParams.get("utm_source") === "awesome_dnd" &&
        changedUrl.searchParams.get("utm_medium") === "referral_directory" &&
        changedUrl.searchParams.get("utm_campaign") === "ltw_free_tool_directory_v1" &&
        changedUrl.searchParams.get("utm_content") === "one_shot_forge_generator" &&
        changedUrl.searchParams.get("ltw_qa") === "1",
      `${name}: generator controls erased acquisition or QA state`,
    );

    await page.locator("#run-sheet-tab").focus();
    await page.keyboard.press("ArrowRight");
    check(
      await page.locator("#scenes-tab").evaluate((element) => document.activeElement === element),
      `${name}: tab keyboard navigation failed`,
    );
    check((await page.locator("#scenes-tab").getAttribute("aria-selected")) === "true", `${name}: scene tab state failed`);
    check(await page.locator("#scenes-panel").isVisible(), `${name}: scene panel did not open`);
    await page.locator("#json-tab").click();
    check(await page.locator("#json-panel").isVisible(), `${name}: JSON panel did not open`);
    const packet = JSON.parse(await page.locator("#json-output").innerText());
    check(packet.validation.valid === true, `${name}: exported packet validation failed`);
    check(packet.duration_minutes === 240, `${name}: exported duration drifted`);
    check(packet.characters.length === 6, `${name}: exported character count drifted`);

    await page.locator("#copy-link").click();
    const copiedUrl = new URL(await page.evaluate(() => window.__copiedText));
    check(copiedUrl.searchParams.get("utm_source") === "user_share", `${name}: shared source drifted`);
    check(copiedUrl.searchParams.get("utm_medium") === "social", `${name}: shared medium drifted`);
    check(copiedUrl.searchParams.get("utm_campaign") === "one_shot_forge_share", `${name}: shared campaign drifted`);
    check(copiedUrl.searchParams.get("utm_content") === "generated_one_shot", `${name}: shared content drifted`);

    if (name === "desktop") {
      await page.locator("#download-json").click();
      const packetDownload = await page.evaluate(async () => {
        const entry = window.__downloads.at(-1);
        return {
          filename: entry.filename,
          text: await window.__downloadBlobs.get(entry.href).text(),
        };
      });
      check(packetDownload.filename.endsWith(".json"), "desktop: packet download filename drifted");
      const downloadedPacket = JSON.parse(packetDownload.text);
      check(downloadedPacket.validation.valid === true, "desktop: downloaded packet is invalid");
      check(downloadedPacket.characters.length === 6, "desktop: downloaded party count drifted");

      await page.locator("#download-campaign-start").click();
      const campaignDownload = await page.evaluate(async () => {
        const entry = window.__downloads.at(-1);
        return {
          filename: entry.filename,
          text: await window.__downloadBlobs.get(entry.href).text(),
        };
      });
      check(campaignDownload.filename.endsWith(".json"), "desktop: Campaign Start filename drifted");
      const campaignStart = JSON.parse(campaignDownload.text);
      check(Boolean(campaignStart), "desktop: Campaign Start export is empty");

      await page.locator("#print-packet").click();
      check(await page.evaluate(() => window.__printCalled === true), "desktop: print command failed");
    }

    await page.locator("#run-sheet-tab").click();
    check(await page.locator("#run-sheet-panel").isVisible(), `${name}: run sheet did not reopen`);
    const layout = await inspectLayout(page);
    check(!layout.horizontalOverflow, `${name}: horizontal overflow`);
    check(layout.outOfBounds === 0, `${name}: key element escaped viewport`);
    check(layout.textOverflow === 0, `${name}: key text overflow`);
    check(layout.brokenImages.length === 0, `${name}: broken images ${layout.brokenImages.join(", ")}`);
    check(browserIssues.length === 0, `${name}: ${browserIssues.join(" | ")}`);
    check(missingResources.length === 0, `${name}: missing ${missingResources.join(", ")}`);

    await page.evaluate(() => window.scrollTo(0, 0));
    const screenshot = await page.screenshot({
      path: path.join(screenshotRoot, `${name}.png`),
      fullPage: true,
    });
    check(screenshot.length > 50000, `${name}: screenshot is unexpectedly small`);
    await context.close();
  }

  const attributionContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const organicPage = await attributionContext.newPage();
  await organicPage.goto(
    `${baseUrl}/one-shot-forge/?utm_source=organic_search&utm_medium=owned_search&utm_campaign=ltw_one_shot_intent_v1&utm_content=complete_one_shot_generator`,
    { waitUntil: "networkidle" },
  );
  const organicUrl = new URL(organicPage.url());
  check(organicUrl.searchParams.get("utm_source") === "organic_search", "organic source was erased");
  check(organicUrl.searchParams.get("utm_medium") === "owned_search", "owned-search medium was erased");
  check(organicUrl.searchParams.get("utm_campaign") === "ltw_one_shot_intent_v1", "intent campaign was erased");
  check(organicUrl.searchParams.get("utm_content") === "complete_one_shot_generator", "intent content was erased");
  check(
    await organicPage.evaluate(() =>
      window.LTWPrivacyMetrics.fixedAttribution(window.location.search, "") ===
      "source.organic-search/campaign.ltw-one-shot-intent-v1/content.complete-one-shot-generator"
    ),
    "organic search measurement labels drifted",
  );
  await organicPage.close();

  const rpggenPage = await attributionContext.newPage();
  await rpggenPage.goto(
    `${baseUrl}/one-shot-forge/?seed=rpggen-47`,
    {
      waitUntil: "networkidle",
      referer: "https://rpggen.dev/generators/one-shot",
    },
  );
  const rpggenCampaign = new URL(
    await rpggenPage.locator("#campaign-offer-link").getAttribute("href"),
  );
  check(
    rpggenCampaign.searchParams.get("utm_content") ===
      "gullwatch_harbor_featured_campaign_origin_rpggen_dev",
    "RPGGen campaign origin was not preserved",
  );
  const rpggenRecommendation = new URL(
    await rpggenPage.locator(".recommendation-card a").first().getAttribute("href"),
  );
  check(
    rpggenRecommendation.searchParams.get("utm_content") ===
      "quests_recommended_origin_rpggen_dev",
    "RPGGen recommendation origin was not preserved",
  );
  const rpggenCheckout = await attributionContext.newPage();
  await rpggenCheckout.addInitScript(() => {
    window.setTimeout = () => 0;
  });
  await rpggenCheckout.goto(
    `${baseUrl}${rpggenRecommendation.pathname.replace(/^\/loot-drop-calculator/, "")}${rpggenRecommendation.search}`,
    { waitUntil: "networkidle" },
  );
  const rpggenStorefront = new URL(
    await rpggenCheckout.locator(".store-option").getAttribute("href"),
  );
  check(rpggenStorefront.hostname === "loot-table-works.itch.io", "RPGGen final store drifted");
  check(rpggenStorefront.searchParams.get("utm_source") === "one_shot_forge", "RPGGen final source was lost");
  check(rpggenStorefront.searchParams.get("utm_medium") === "free_tool", "RPGGen final medium was lost");
  check(rpggenStorefront.searchParams.get("utm_campaign") === "one_shot_value_launch", "RPGGen final campaign was lost");
  check(
    rpggenStorefront.searchParams.get("utm_content") ===
      "quests_recommended_origin_rpggen_dev",
    "RPGGen final acquisition origin was lost",
  );
  check(rpggenStorefront.searchParams.get("utm_term") === "itch", "RPGGen final store marker was lost");
  await rpggenCheckout.close();
  await rpggenPage.close();

  const rejectedPage = await attributionContext.newPage();
  await rejectedPage.goto(
    `${baseUrl}/one-shot-forge/?utm_source=private_customer&utm_medium=secret&utm_campaign=internal&utm_content=email_address&ltw_qa=1`,
    { waitUntil: "networkidle" },
  );
  const rejectedUrl = new URL(rejectedPage.url());
  check(!rejectedUrl.searchParams.has("utm_source"), "unknown source survived URL normalization");
  check(!rejectedUrl.searchParams.has("utm_medium"), "unknown medium survived URL normalization");
  check(!rejectedUrl.searchParams.has("utm_campaign"), "unknown campaign survived URL normalization");
  check(!rejectedUrl.searchParams.has("utm_content"), "unknown content survived URL normalization");
  check(rejectedUrl.searchParams.get("ltw_qa") === "1", "QA exclusion did not survive rejected attribution");
  await attributionContext.close();

  console.log(
    `Validated One-Shot Forge v1.3.1 intent funnel in ${checks} browser checks across desktop, mobile, and narrow; screenshots: ${screenshotRoot}`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
