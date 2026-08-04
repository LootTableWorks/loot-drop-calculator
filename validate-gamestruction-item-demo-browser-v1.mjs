import assert from "node:assert/strict";
import crypto from "node:crypto";
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
  "gamestruction-item-demo-v1",
);
fs.mkdirSync(screenshotRoot, { recursive: true });

const mimeTypes = {
  ".cs": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".gd": "text/plain; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".ts": "text/plain; charset=utf-8",
  ".zip": "application/zip",
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
  const stat = fs.statSync(filePath);
  response.writeHead(200, {
    "Content-Length": stat.size,
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

const expectedPaid =
  "https://loottableworks.github.io/loot-drop-calculator/choose-world-foundry-module/" +
  "?utm_source=gamestruction&utm_medium=tool_directory" +
  "&utm_campaign=ltw_data_pack_discovery_v1" +
  "&utm_content=item_catalog_demo_upgrade";
const basePaid =
  "https://loottableworks.github.io/loot-drop-calculator/choose-world-foundry-module/" +
  "?utm_source=item_catalog_demo&utm_medium=product_launchpad" +
  "&utm_campaign=paid_catalog_feature_v1&utm_content=upgrade_to_500";

try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
    narrow: { width: 320, height: 760 },
  })) {
    const page = await browser.newPage({ viewport });
    const browserIssues = [];
    page.on("pageerror", (error) => browserIssues.push(`pageerror:${error.message}`));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        browserIssues.push(`${message.type()}:${message.text()}`);
      }
    });
    const response = await page.goto(
      `${baseUrl}/item-catalog-demo/?utm_source=gamestruction&utm_medium=tool_directory&utm_campaign=ltw_data_pack_discovery_v1&utm_content=item_catalog_demo`,
      { waitUntil: "networkidle" },
    );
    check(response?.status() === 200, `${name}: launchpad did not return 200`);

    const result = await page.evaluate(() => {
      const download = document.querySelector(
        'a[download="world-foundry-item-catalog-demo-v2-rc7.zip"]',
      );
      const paid = document.querySelector("#paid-upgrade");
      const iconImages = [...document.querySelectorAll(".icon-preview img")];
      const downloadRect = download?.getBoundingClientRect();
      const textNodes = [
        ...document.querySelectorAll(
          ".action strong,.action span,.upgrade p,.upgrade a,.footer",
        ),
      ];
      return {
        horizontalOverflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        downloadVisible:
          Boolean(download) && downloadRect.width > 0 && downloadRect.height > 0,
        downloadHref: download?.getAttribute("href") || "",
        paidHref: paid?.href || "",
        imageCount: iconImages.length,
        loadedImages: iconImages.filter(
          (image) => image.complete && image.naturalWidth > 0,
        ).length,
        textOverflowCount: textNodes.filter(
          (element) => element.scrollWidth > element.clientWidth + 1,
        ).length,
      };
    });

    check(!result.horizontalOverflow, `${name}: horizontal overflow`);
    check(result.downloadVisible, `${name}: complete demo download is not visible`);
    check(
      result.downloadHref ===
        "downloads/world-foundry-item-catalog-demo-v2-rc7.zip",
      `${name}: complete demo download changed`,
    );
    check(result.paidHref === expectedPaid, `${name}: paid attribution changed`);
    check(result.imageCount === 10, `${name}: icon preview count changed`);
    check(result.loadedImages === 10, `${name}: preview image failed to load`);
    check(result.textOverflowCount === 0, `${name}: visible text overflow`);
    check(browserIssues.length === 0, `${name}: ${browserIssues.join(" | ")}`);

    await page.screenshot({
      path: path.join(screenshotRoot, `${name}.png`),
      fullPage: true,
    });
    await page.close();
  }

  for (const inheritedSource of ["constructor", "toString", "__proto__"]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(
      `${baseUrl}/item-catalog-demo/?utm_source=${encodeURIComponent(inheritedSource)}`,
      { waitUntil: "networkidle" },
    );
    check(
      (await page.locator("#paid-upgrade").getAttribute("href")) === basePaid,
      `Inherited source ${inheritedSource} escaped the allowlist`,
    );
    await page.close();
  }

  const request = await browser.newPage();
  const archiveResponse = await request.request.get(
    `${baseUrl}/item-catalog-demo/downloads/world-foundry-item-catalog-demo-v2-rc7.zip`,
  );
  const archive = await archiveResponse.body();
  check(archiveResponse.status() === 200, "Complete demo archive did not return 200");
  check(archive.length === 3715503, "Complete demo archive byte count changed");
  check(
    crypto.createHash("sha256").update(archive).digest("hex") ===
      "63737e1a18aa4d05cac3603d1808773f613dce1f1aba0e878d75c9618adb995d",
    "Complete demo archive SHA-256 changed",
  );
  await request.close();

  console.log(
    `Gamestruction Item Catalog browser QA passed ${checks} desktop, mobile, narrow, attribution, media, and download checks. Screenshots: ${screenshotRoot}`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
