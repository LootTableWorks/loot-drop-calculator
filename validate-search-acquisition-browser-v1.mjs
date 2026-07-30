import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.dirname(fileURLToPath(import.meta.url));
const routes = [
  {
    path: "/",
    title: "Run Tonight. Continue Next Week. | Loot Table Works",
    h1: "Run tonight. Continue next week.",
    oneShotIdeasLink: true
  },
  {
    path: "/campaign-workspace/",
    title: "Free TTRPG Campaign Tracker | Gullwatch Workspace",
    h1: "Run tonight. Continue next week."
  },
  {
    path: "/gullwatch-beacon/",
    title: "Free System-Neutral TTRPG One-Shot | Gullwatch Beacon",
    h1: "Gullwatch Beacon"
  },
  {
    path: "/world-foundry/",
    title: "World Foundry Field Guide & Catalog | Loot Table Works",
    h1: "Run tonight. Remember what changes next week."
  }
];
const viewports = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 }
};
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
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

      const h1 = page.getByRole("heading", {
        level: 1,
        name: route.h1,
        exact: true
      });
      assert(
        (await h1.count()) === 1,
        `${viewportName} ${route.path} does not expose one exact H1`
      );

      const layout = await page.evaluate(() => ({
        bodyWidth: document.body.scrollWidth,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        brokenImages: Array.from(document.images)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.getAttribute("src"))
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
        consoleErrors.length === 0 && missingResources.length === 0,
        `${viewportName} ${route.path} has runtime errors: ${consoleErrors.join(" | ")} ${missingResources.join(" | ")}`
      );

      const screenshot = await page.screenshot({ fullPage: true });
      assert(
        screenshot.length > 30000,
        `${viewportName} ${route.path} screenshot is unexpectedly small`
      );

      if (route.oneShotIdeasLink) {
        const ideasLinks = page.locator(
          'a[href*="run-one-shot-tonight/"][href*="utm_campaign=one_shot_ideas_v1"]'
        );
        assert(
          (await ideasLinks.count()) === 2,
          `${viewportName} homepage must expose exactly two attributed one-shot idea links`
        );
        const ideaImage = page.locator(
          'img[src="one-shot-forge/assets/one-shot-forge-six-region-atlas-v1.jpg"]'
        );
        assert(
          (await ideaImage.count()) === 1,
          `${viewportName} homepage one-shot atlas count drifted`
        );
        const dimensions = await ideaImage.evaluate((image) => ({
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight
        }));
        assert(
          dimensions.naturalWidth > 1000 && dimensions.naturalHeight > 600,
          `${viewportName} homepage one-shot atlas did not decode at production resolution`
        );
      }

      if (route.path === "/world-foundry/") {
        const preview = page.locator(
          'img[src="assets/campaign-workspace-preview-v1.png"]'
        );
        assert(
          (await preview.count()) === 1,
          `${viewportName} World Foundry preview count drifted`
        );
        const dimensions = await preview.evaluate((image) => ({
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight
        }));
        assert(
          dimensions.naturalWidth === 1425 &&
            dimensions.naturalHeight === 891,
          `${viewportName} World Foundry preview did not decode at 1425x891`
        );
      }

      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(
  `Search acquisition browser QA passed ${checks} checks across eight desktop/mobile renders with exact titles, H1s, decoded images, runtime stability, and layout bounds.`
);
