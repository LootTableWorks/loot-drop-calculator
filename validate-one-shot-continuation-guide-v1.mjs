import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.dirname(fileURLToPath(import.meta.url));
const route = "/turn-one-shot-into-campaign/";
const expectedTitle =
  "How to Turn a One-Shot into a Campaign | Free TTRPG Planner";
const expectedH1 = "Turn one ending into the next session";
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
  ".png": "image/png",
  ".xml": "application/xml; charset=utf-8"
};

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

function meta(html, kind, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(
    new RegExp(
      `<meta\\s+${kind}="${escaped}"\\s+content="([^"]+)"`,
      "i"
    )
  )?.[1];
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

const html = read("turn-one-shot-into-campaign/index.html");
const app = read("turn-one-shot-into-campaign/app.js");
const styles = read("turn-one-shot-into-campaign/styles.css");
const sitemap = read("sitemap.xml");
const runTonight = read("run-one-shot-tonight/index.html");
const freeTools = read("free-rpg-tools/index.html");
const manifest = JSON.parse(
  read("turn-one-shot-into-campaign/MANIFEST.json")
);
const schemas = [
  ...html.matchAll(
    /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi
  )
].map((match) => JSON.parse(match[1]));
const faqEntries = [
  {
    question:
      "Does the one-shot need an unresolved ending to become a campaign?",
    answer:
      "No. A complete victory still changes relationships, advances pressures elsewhere, and creates obligations or opportunities that can open the next session."
  },
  {
    question: "How many facts should I keep after a one-shot?",
    answer:
      "Keep five: the ending truth, one changed relationship, one advanced pressure, one unresolved promise, and the players' next intention."
  },
  {
    question:
      "Does the Continuation Planner store or upload campaign notes?",
    answer:
      "No. The planner runs in the current browser page, does not use an account, and only copies or downloads a brief when you explicitly choose that action."
  }
];
const faqQuestions = faqEntries.map((entry) => entry.question);

assert(
  html.includes(`<title>${expectedTitle}</title>`),
  "Exact search title is missing"
);
assert(
  html.includes(
    '<link rel="canonical" href="https://loottableworks.github.io/loot-drop-calculator/turn-one-shot-into-campaign/">'
  ),
  "Canonical URL is missing"
);
assert(
  meta(html, "name", "description")?.startsWith(
    "Turn any TTRPG one-shot ending into a campaign"
  ) && !meta(html, "name", "description")?.includes("ready-to-run"),
  "Search description drifted"
);
assert(
  meta(html, "property", "og:image") ===
    "https://loottableworks.github.io/loot-drop-calculator/world-foundry/assets/campaign-workspace-preview-v1.png",
  "Open Graph image is not the real product preview"
);
assert(
  meta(html, "property", "og:image:width") === "1425" &&
    meta(html, "property", "og:image:height") === "891",
  "Open Graph image dimensions drifted"
);
assert(
  meta(html, "property", "og:image:alt")?.includes("Campaign Workspace"),
  "Open Graph image alt text is not grounded"
);
assert(schemas.length === 3, "Structured data script count drifted");
assert(
  schemas.some(
    (schema) => schema["@type"] === "HowTo" && schema.step?.length === 5
  ),
  "Five-step HowTo schema is missing"
);
assert(
  schemas.some(
    (schema) =>
      schema["@type"] === "WebApplication" &&
      schema.isAccessibleForFree === true &&
      schema.offers?.price === "0" &&
      schema.featureList?.length === 5
  ),
  "Free local planner schema is incomplete"
);
assert(
  schemas.some(
    (schema) =>
      schema["@type"] === "FAQPage" && schema.mainEntity?.length === 3
  ),
  "Three-question FAQ schema is missing"
);
for (const { question, answer } of faqEntries) {
  assert(
    html.split(question).length - 1 === 2,
    `${question}: FAQ schema and visible copy are not in exact parity`
  );
  assert(
    html.split(answer).length - 1 === 2,
    `${question}: FAQ answer schema and visible copy are not in exact parity`
  );
}
assert(
  html.includes(
    '<pre id="brief-text" tabindex="0" aria-labelledby="brief-title"></pre>'
  ),
  "Generated brief is not keyboard focusable and labeled"
);
assert(
  (html.match(/name="[^"]+"/g) ?? []).filter((name) =>
    name.includes("ending-truth") ||
    name.includes("changed-relationship") ||
    name.includes("advanced-pressure") ||
    name.includes("unresolved-promise") ||
    name.includes("next-intention")
  ).length === 5,
  "Five planner fields are not present"
);
assert(
  (html.match(/required maxlength="240"/g) ?? []).length === 5,
  "Planner field bounds drifted"
);
assert(
  (html.match(/utm_source=one_shot_to_campaign_guide/g) ?? []).length === 6,
  "Tracked handoff coverage is incomplete"
);
assert(!html.includes("itch.io"), "The guide bypasses the post-value selector");
assert(
  !/href="[^"]*(?:bundle|collection)[^"]*"/i.test(html),
  "The guide exposes a bundle destination"
);
assert(
  app.includes("Nothing") === false &&
    app.includes("localStorage") === false &&
    app.includes("fetch(") === false,
  "Planner runtime added storage or background transmission"
);
assert(
  app.includes('link.download = "one-shot-next-session-brief.md"'),
  "Markdown download contract drifted"
);
assert(
  styles.includes('@import url("../run-one-shot-tonight/styles.css");') &&
    styles.includes("@media (max-width: 760px)"),
  "Shared design system or mobile override is missing"
);
assert(
  sitemap.includes(
    "<loc>https://loottableworks.github.io/loot-drop-calculator/turn-one-shot-into-campaign/</loc>\n    <lastmod>2026-07-30</lastmod>"
  ),
  "Sitemap route is missing"
);
assert(
  runTonight.includes("../turn-one-shot-into-campaign/"),
  "Existing guide does not link to the continuation planner"
);
assert(
  freeTools.includes('"numberOfItems": 12') &&
    freeTools.includes("Twelve free") &&
    !freeTools.includes("Eleven free") &&
    !freeTools.includes("all eleven tools"),
  "Free RPG Tools count drifted"
);
assert(
  freeTools.includes(
    "turn-one-shot-into-campaign/?utm_source=free_rpg_tools"
  ) &&
    freeTools.includes("One-Shot Continuation Planner"),
  "Free RPG Tools directory handoff is missing"
);
assert(
  sitemap.includes(
    "<loc>https://loottableworks.github.io/loot-drop-calculator/free-rpg-tools/</loc>\n    <lastmod>2026-07-30</lastmod>"
  ),
  "Free RPG Tools sitemap date drifted"
);
assert(
  manifest.release_id === "one-shot-continuation-guide-v1" &&
    manifest.file_count === 3 &&
    manifest.files.length === 3 &&
    manifest.background_analytics === false &&
    manifest.local_storage === false,
  "Release manifest contract drifted"
);
for (const file of manifest.files) {
  const workingBytes = fs.readFileSync(
    path.join(root, "turn-one-shot-into-campaign", file.path)
  );
  const stagedBytes = execFileSync(
    "git",
    ["show", `:turn-one-shot-into-campaign/${file.path}`],
    { cwd: root, encoding: null }
  );
  assert(
    workingBytes.length === file.bytes,
    `${file.path}: working byte size drifted`
  );
  assert(
    crypto.createHash("sha256").update(workingBytes).digest("hex") ===
      file.sha256,
    `${file.path}: working SHA-256 drifted`
  );
  assert(
    stagedBytes.length === file.bytes,
    `${file.path}: staged byte size drifted`
  );
  assert(
    crypto.createHash("sha256").update(stagedBytes).digest("hex") ===
      file.sha256,
    `${file.path}: staged SHA-256 drifted`
  );
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
const internalHrefs = [
  ...new Set(
    [...html.matchAll(/<a[^>]+href="([^"]+)"/gi)]
      .map((match) => match[1].replaceAll("&amp;", "&"))
      .filter((href) => !href.startsWith("#") && !href.startsWith("mailto:"))
  )
];
for (const href of internalHrefs) {
  const response = await fetch(new URL(href, `${baseUrl}${route}`), {
    redirect: "manual",
    signal: AbortSignal.timeout(5000)
  });
  assert(response.status === 200, `${href}: internal handoff is unavailable`);
}
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
});

try {
  for (const [viewportName, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const consoleErrors = [];
    const missingResources = [];
    const requests = [];
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
    page.on("request", (request) =>
      requests.push({
        method: request.method(),
        resourceType: request.resourceType(),
        url: request.url()
      })
    );

    const response = await page.goto(`${baseUrl}${route}`, {
      waitUntil: "networkidle"
    });
    assert(response?.status() === 200, `${viewportName}: HTTP status drifted`);
    assert((await page.title()) === expectedTitle, `${viewportName}: title drifted`);
    assert(
      (await page.getByRole("heading", {
        level: 1,
        name: expectedH1,
        exact: true
      }).count()) === 1,
      `${viewportName}: exact H1 drifted`
    );

    for (const image of await page.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => element.decode());
    }
    await page.locator("h1").scrollIntoViewIfNeeded();

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
      `${viewportName}: horizontal overflow`
    );
    assert(
      layout.brokenImages.length === 0,
      `${viewportName}: broken images ${layout.brokenImages.join(", ")}`
    );
    assert(
      consoleErrors.length === 0 && missingResources.length === 0,
      `${viewportName}: runtime errors ${consoleErrors.join(" | ")} ${missingResources.join(" | ")}`
    );

    const fields = {
      "#ending-truth": "The beacon broadcasts the true harbor code again.",
      "#changed-relationship":
        "Harbormaster Vale trusts the party but owes the council an explanation.",
      "#advanced-pressure":
        "Flood damage isolates the northern villages before relief can arrive.",
      "#unresolved-promise":
        "The stolen relief ledger still names a hidden buyer.",
      "#next-intention":
        "Travel north with the first relief convoy and identify who diverted the supplies."
    };
    for (const [selector, value] of Object.entries(fields)) {
      await page.locator(selector).fill(value);
    }
    const requestsBeforeBuild = requests.length;
    await page.getByRole("button", {
      name: "Build next-session brief",
      exact: true
    }).click();
    const output = page.locator("#brief-output");
    assert(await output.isVisible(), `${viewportName}: brief did not render`);
    const generated = await page.locator("#brief-text").textContent();
    assert(
      generated.includes("# Next-Session Brief") &&
        generated.includes("## Five Scene Beats") &&
        generated.includes(fields["#next-intention"]),
      `${viewportName}: generated brief drifted`
    );
    assert(
      await page.locator("#brief-text").evaluate(
        (element) => document.activeElement === element
      ),
      `${viewportName}: generated brief did not receive focus`
    );
    const briefScrollState = await page.locator("#brief-text").evaluate(
      (element) => ({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight
      })
    );
    if (briefScrollState.scrollHeight > briefScrollState.clientHeight) {
      await page.keyboard.press("PageDown");
      assert(
        (await page.locator("#brief-text").evaluate(
          (element) => element.scrollTop
        )) > 0,
        `${viewportName}: keyboard cannot scroll the generated brief`
      );
      await page.keyboard.press("Home");
    }
    for (const question of faqQuestions) {
      assert(
        (await page.getByRole("heading", {
          level: 3,
          name: question,
          exact: true
        }).count()) === 1,
        `${viewportName}: visible FAQ question drifted`
      );
    }
    const buildRequests = requests.slice(requestsBeforeBuild);
    assert(
      buildRequests.every(
        (request) =>
          request.method === "GET" &&
          !["fetch", "xhr"].includes(request.resourceType)
      ),
      `${viewportName}: planner transmitted data while building`
    );

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", {
      name: "Download Markdown",
      exact: true
    }).click();
    const download = await downloadPromise;
    assert(
      download.suggestedFilename() === "one-shot-next-session-brief.md",
      `${viewportName}: download filename drifted`
    );
    assert(
      (await fs.promises.readFile(await download.path(), "utf8")).includes(
        "## Campaign State"
      ),
      `${viewportName}: downloaded Markdown drifted`
    );

    await page.getByRole("button", { name: "Clear", exact: true }).click();
    assert(!(await output.isVisible()), `${viewportName}: reset did not hide output`);
    assert(
      (await page.screenshot({ fullPage: true })).length > 40000,
      `${viewportName}: screenshot is unexpectedly small`
    );

    await page.close();
    await context.close();

    const directoryContext = await browser.newContext({ viewport });
    const directoryPage = await directoryContext.newPage();
    const directoryResponse = await directoryPage.goto(
      `${baseUrl}/free-rpg-tools/`,
      { waitUntil: "networkidle" }
    );
    assert(
      directoryResponse?.status() === 200,
      `${viewportName}: Free RPG Tools HTTP status drifted`
    );
    assert(
      (await directoryPage.getByText("One-Shot Continuation Planner", {
        exact: true
      }).count()) === 1,
      `${viewportName}: directory continuation entry drifted`
    );
    const directoryLayout = await directoryPage.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    }));
    assert(
      Math.max(directoryLayout.bodyWidth, directoryLayout.documentWidth) <=
        directoryLayout.viewportWidth + 1,
      `${viewportName}: Free RPG Tools horizontal overflow`
    );
    assert(
      (await directoryPage.locator('a[data-link-kind="free-tool"]').count()) ===
        12,
      `${viewportName}: directory free-tool count drifted`
    );
    await directoryPage.close();
    await directoryContext.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(
  `One-shot continuation guide v1 passed ${checks} static, privacy, functional, download, and responsive browser checks across two renders.`
);
