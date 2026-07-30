import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = path.join(root, "artifacts", "privacy-metrics-v1");
fs.mkdirSync(artifactDir, { recursive: true });

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
  ".zip": "application/zip"
};

const routes = [
  "/",
  "/world-foundry/",
  "/gullwatch-beacon/",
  "/gullwatch-aftermath/",
  "/choose-world-foundry-module/",
  "/connected-record-proof/",
  "/press-kit/",
  "/privacy/"
];

const viewports = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 }
};

let checks = 0;
function assert(condition, message) {
  checks += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function resolveRequest(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname);
  const requested = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const fullPath = path.resolve(root, `.${requested}`);
  if (!fullPath.startsWith(root) || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
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
    "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
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
      const externalMeasurementRequests = [];
      const missingResources = [];

      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });
      page.on("request", (request) => {
        const hostname = new URL(request.url()).hostname;
        if (hostname === "gc.zgo.at" || hostname.endsWith(".goatcounter.com")) {
          externalMeasurementRequests.push(request.url());
        }
      });
      page.on("response", (response) => {
        if (response.status() === 404) {
          missingResources.push(response.url());
        }
      });

      const qaUrl =
        route === "/privacy/" ? `${baseUrl}${route}` : `${baseUrl}${route}?ltw_qa=1`;
      const response = await page.goto(qaUrl, {
        waitUntil: "networkidle"
      });
      assert(response && response.status() === 200, `${viewportName} ${route} did not return HTTP 200`);

      const layout = await page.evaluate(() => ({
        bodyWidth: document.body.scrollWidth,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        title: document.title,
        brokenImages: Array.from(document.images)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.getAttribute("src"))
      }));
      assert(layout.title.length > 0, `${viewportName} ${route} has no title`);
      assert(
        Math.max(layout.bodyWidth, layout.documentWidth) <= layout.viewportWidth + 1,
        `${viewportName} ${route} has horizontal overflow`
      );
      assert(
        layout.brokenImages.length === 0,
        `${viewportName} ${route} has broken images: ${layout.brokenImages.join(", ")}`
      );
      assert(
        consoleErrors.length === 0,
        `${viewportName} ${route} has console errors: ${consoleErrors.join(" | ")}; missing: ${missingResources.join(", ")}`
      );
      assert(
        externalMeasurementRequests.length === 0,
        `${viewportName} ${route} contacted analytics during the QA exclusion`
      );

      if (route !== "/privacy/") {
        assert(
          (await page.locator('a[href$="privacy/"]').count()) >= 1,
          `${viewportName} ${route} does not expose the privacy link`
        );
      }

      if (route === "/" || route === "/privacy/") {
        const slug = route === "/" ? "front-door" : "privacy";
        await page.screenshot({
          path: path.join(artifactDir, `${slug}-${viewportName}.png`),
          fullPage: true
        });
      }
      await page.close();
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: viewports.desktop });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/privacy/`, { waitUntil: "networkidle" });
  assert(
    (await page.locator("#metrics-status").textContent())?.includes("allows aggregate"),
    "Privacy control initial state is incorrect"
  );
  await page.locator("#disable-metrics").click();
  assert(
    (await page.locator("#metrics-status").textContent())?.includes("excluded"),
    "Privacy opt-out control did not update"
  );
  assert(
    (await page.evaluate(() => localStorage.getItem("ltw_metrics_opt_out"))) === "1",
    "Privacy opt-out was not stored locally"
  );
  await page.locator("#enable-metrics").click();
  assert(
    (await page.evaluate(() => localStorage.getItem("ltw_metrics_opt_out"))) === null,
    "Privacy opt-in control did not remove the local exclusion"
  );
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(
  `Privacy measurement browser QA passed: ${checks} checks across 16 desktop/mobile page renders plus control-state verification.`
);
