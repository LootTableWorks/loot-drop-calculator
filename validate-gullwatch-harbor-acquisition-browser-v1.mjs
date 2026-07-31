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
  "gullwatch-harbor-acquisition-v1"
);
fs.mkdirSync(screenshotRoot, { recursive: true });

const routes = [
  {
    slug: "front-door",
    path: "/",
    title: "Run Tonight. Continue Next Week. | Loot Table Works",
    h1: "Run tonight. Continue next week.",
    hrefs: [
      "gullwatch-harbor/?utm_source=owned_site&utm_medium=front_door&utm_campaign=gullwatch_harbor_book_v1&utm_content=continuity_campaign_book"
    ]
  },
  {
    slug: "gullwatch-beacon",
    path: "/gullwatch-beacon/",
    title: "Free System-Neutral TTRPG One-Shot | Gullwatch Beacon",
    h1: "Gullwatch Beacon",
    hrefs: [
      "../gullwatch-harbor/?utm_source=gullwatch_beacon&utm_medium=owned_page&utm_campaign=gullwatch_harbor_book_v1&utm_content=continue_four_session_campaign"
    ],
    campaignCover: true
  },
  {
    slug: "gullwatch-aftermath",
    path: "/gullwatch-aftermath/",
    title: "Gullwatch Aftermath | System-Neutral Campaign Continuation",
    h1: "Gullwatch Aftermath",
    hrefs: [
      "../gullwatch-harbor/?utm_source=gullwatch_aftermath&utm_medium=owned_page&utm_campaign=gullwatch_harbor_book_v1&utm_content=hero_full_campaign",
      "../gullwatch-harbor/?utm_source=gullwatch_aftermath&utm_medium=owned_page&utm_campaign=gullwatch_harbor_book_v1&utm_content=footer_full_campaign"
    ]
  },
  {
    slug: "free-rpg-tools",
    path: "/free-rpg-tools/",
    title:
      "Free RPG Tools for Sessions, Characters, Worlds, and Game Data | Loot Table Works",
    h1: "Free RPG Tools",
    hrefs: [
      "https://loottableworks.github.io/loot-drop-calculator/gullwatch-harbor/?utm_source=free_rpg_tools&utm_medium=playable_sample&utm_campaign=gullwatch_harbor_book_v1&utm_content=gullwatch_harbor_campaign_book"
    ]
  }
];
const viewports = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 }
};
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".epub": "application/epub+zip",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".xml": "application/xml; charset=utf-8",
  ".zip": "application/zip"
};

let checks = 0;
function assert(condition, message) {
  checks += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function resolveRequest(requestUrl) {
  const pathname = decodeURIComponent(
    new URL(requestUrl, "http://127.0.0.1").pathname
  );
  const relativePath = pathname.endsWith("/")
    ? `${pathname}index.html`
    : pathname;
  const fullPath = path.resolve(root, `.${relativePath}`);
  if (
    !fullPath.startsWith(root) ||
    !fs.existsSync(fullPath) ||
    !fs.statSync(fullPath).isFile()
  ) {
    return null;
  }
  return fullPath;
}

const server = http.createServer((request, response) => {
  if (request.url === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }
  const filePath = resolveRequest(request.url || "/");
  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type":
      mimeTypes[path.extname(filePath).toLowerCase()] ||
      "application/octet-stream"
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
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
});
const screenshots = [];

try {
  for (const [viewportName, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({ viewport });
    for (const route of routes) {
      const page = await context.newPage();
      const consoleErrors = [];
      const missingResources = [];
      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });
      page.on("response", (response) => {
        if (response.status() === 404) {
          missingResources.push(response.url());
        }
      });

      const response = await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: "networkidle"
      });
      assert(
        response?.status() === 200,
        `${viewportName} ${route.path} did not return HTTP 200`
      );
      assert(
        (await page.title()) === route.title,
        `${viewportName} ${route.path} title drifted`
      );
      const normalizedH1 = await page
        .locator("h1")
        .evaluate((element) => element.innerText.replace(/\s+/g, " ").trim());
      assert(
        normalizedH1 === route.h1,
        `${viewportName} ${route.path} H1 drifted`
      );

      const layout = await page.evaluate(() => ({
        bodyWidth: document.body.scrollWidth,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        brokenImages: Array.from(document.images)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.getAttribute("src")),
        overflowingButtons: Array.from(
          document.querySelectorAll("a.button, a.text-link, a.tool-row")
        )
          .filter((element) => element.scrollWidth > element.clientWidth + 1)
          .map((element) => element.textContent.trim())
      }));
      assert(
        Math.max(layout.bodyWidth, layout.documentWidth) <=
          layout.viewportWidth + 1,
        `${viewportName} ${route.path} has horizontal overflow`
      );
      assert(
        layout.brokenImages.length === 0,
        `${viewportName} ${route.path} has broken images: ${layout.brokenImages.join(", ")}`
      );
      assert(
        layout.overflowingButtons.length === 0,
        `${viewportName} ${route.path} has overflowing controls: ${layout.overflowingButtons.join(", ")}`
      );
      assert(
        consoleErrors.length === 0 && missingResources.length === 0,
        `${viewportName} ${route.path} has runtime errors: ${consoleErrors.join(" | ")} ${missingResources.join(" | ")}`
      );

      for (const href of route.hrefs) {
        const links = await page
          .locator("a")
          .evaluateAll(
            (anchors, expected) =>
              anchors
                .filter((anchor) => anchor.getAttribute("href") === expected)
                .map((anchor) => {
                  const rect = anchor.getBoundingClientRect();
                  return {
                    width: rect.width,
                    height: rect.height,
                    visible:
                      getComputedStyle(anchor).visibility !== "hidden" &&
                      getComputedStyle(anchor).display !== "none"
                  };
                }),
            href
          );
        assert(
          links.length === 1,
          `${viewportName} ${route.path} attributed route count drifted`
        );
        assert(
          links[0].visible && links[0].width > 24 && links[0].height > 16,
          `${viewportName} ${route.path} attributed route is not usable`
        );
      }

      if (route.campaignCover) {
        const cover = page.locator(
          'img[src="../gullwatch-harbor/assets/gullwatch-harbor-cover-v1.jpg"]'
        );
        assert(
          (await cover.count()) === 1,
          `${viewportName} Gullwatch Harbor cover count drifted`
        );
        const dimensions = await cover.evaluate((image) => ({
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          renderedWidth: image.getBoundingClientRect().width,
          renderedHeight: image.getBoundingClientRect().height
        }));
        assert(
          dimensions.naturalWidth === 1600 &&
            dimensions.naturalHeight === 2560,
          `${viewportName} Gullwatch Harbor cover did not decode at 1600x2560`
        );
        assert(
          dimensions.renderedHeight <= 430 &&
            Math.abs(
              dimensions.renderedHeight / dimensions.renderedWidth - 1.6
            ) < 0.02,
          `${viewportName} Gullwatch Harbor cover rendering drifted`
        );
      }

      const screenshotPath = path.join(
        screenshotRoot,
        `${viewportName}-${route.slug}.png`
      );
      const screenshot = await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      assert(
        screenshot.length > 30000,
        `${viewportName} ${route.path} screenshot is unexpectedly small`
      );
      screenshots.push(screenshotPath);
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(
  `Gullwatch Harbor acquisition browser QA passed ${checks} checks across eight desktop/mobile renders with exact attributed routes, decoded assets, usable controls, runtime stability, and layout bounds.`
);
console.log(JSON.stringify({ screenshots }, null, 2));
