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
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
  const relative = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
  const candidate = path.resolve(root, relative || "index.html");
  const safePath = candidate.startsWith(root) ? candidate : path.join(root, "index.html");
  const filePath = fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()
    ? path.join(safePath, "index.html")
    : safePath;

  if (!fs.existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
  });
  response.end(fs.readFileSync(filePath));
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
});
let checks = 0;

function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

async function inspectViewport(viewport, screenshotName) {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.setTimeout = () => 0;
  });
  await page.goto(
    `${baseUrl}/buy/?offer=item&utm_source=integration_guides&utm_medium=seo_guide&utm_campaign=rpg_json_schema_design&utm_content=schema_item_catalog`,
    { waitUntil: "networkidle" }
  );

  check(await page.locator("h1").innerText() === "Item Catalog & Economy Kit", "Item title drift");
  check(await page.locator(".store-option").count() === 1, "One verified store expected");
  check(
    await page.locator(".store-option strong").innerText() === "itch.io",
    "Current verified store label drift"
  );
  check(
    await page.locator(".store-option").getAttribute("data-offer-id") === "item",
    "Store option offer identity missing"
  );
  check(
    await page.locator(".store-option").getAttribute("data-store-id") === "itch",
    "Store option storefront identity missing"
  );
  const href = new URL(await page.locator(".store-option").getAttribute("href"));
  check(href.searchParams.get("utm_source") === "integration_guides", "Source attribution lost");
  check(href.searchParams.get("utm_medium") === "seo_guide", "Medium attribution lost");
  check(
    href.searchParams.get("utm_campaign") === "rpg_json_schema_design",
    "Campaign attribution lost"
  );
  check(
    href.searchParams.get("utm_content") === "schema_item_catalog",
    "Content attribution lost"
  );
  check(href.searchParams.get("utm_term") === "itch", "Store attribution lost");
  check(pageErrors.length === 0, `Browser errors: ${pageErrors.join("; ")}`);

  await page.screenshot({
    path: path.join(os.tmpdir(), screenshotName),
    fullPage: true
  });
  await page.close();
}

try {
  await inspectViewport({ width: 1440, height: 900 }, "checkout-router-desktop-v1.png");
  await inspectViewport({ width: 390, height: 844 }, "checkout-router-mobile-v1.png");

  const blockedPage = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await blockedPage.goto(`${baseUrl}/buy/?offer=unknown&utm_source=test`, {
    waitUntil: "networkidle"
  });
  check(await blockedPage.locator("h1").innerText() === "Checkout request blocked", "Blocked title drift");
  check(await blockedPage.locator(".store-option").count() === 0, "Blocked route exposed a store");
  check(
    await blockedPage.locator("#checkout-status").getAttribute("data-state") === "blocked",
    "Blocked route status missing"
  );
  await blockedPage.close();

  console.log(
    `Validated marketplace checkout browser v1: ${checks} checks across desktop, mobile, and fail-closed states.`
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
