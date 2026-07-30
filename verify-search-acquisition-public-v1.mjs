import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const siteBase = "https://loottableworks.github.io/loot-drop-calculator/";
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8"
}).trim();
const records = [
  {
    local: "campaign-workspace/index.html",
    remote: "campaign-workspace/",
    contentType: "text/html",
    includes: "Free TTRPG Campaign Tracker | Gullwatch Workspace"
  },
  {
    local: "campaign-workspace/PACKAGE-MANIFEST.json",
    remote: "campaign-workspace/PACKAGE-MANIFEST.json",
    contentType: "application/json",
    manifestRecord: {
      path: "index.html",
      bytes: 8019,
      sha256:
        "248632e7f88851a6c72748d1b90819a76774ac665456e9710c700d2e2e2400af"
    }
  },
  {
    local: "gullwatch-beacon/index.html",
    remote: "gullwatch-beacon/",
    contentType: "text/html",
    includes: "Free System-Neutral TTRPG One-Shot | Gullwatch Beacon"
  },
  {
    local: "world-foundry/index.html",
    remote: "world-foundry/",
    contentType: "text/html",
    includes: 'content="1425"'
  },
  {
    local: "world-foundry/MANIFEST.json",
    remote: "world-foundry/MANIFEST.json",
    contentType: "application/json",
    manifestRecord: {
      path: "index.html",
      bytes: 36501,
      sha256:
        "1ce8646a3b9ab27f54d0a187912b01c3deff4bb3f3537bd8cfa3f2e3a36880f3"
    }
  },
  {
    local: "world-foundry/assets/campaign-workspace-preview-v1.png",
    remote: "world-foundry/assets/campaign-workspace-preview-v1.png",
    contentType: "image/png"
  },
  {
    local: "sitemap.xml",
    remote: "sitemap.xml",
    contentType: "application/xml",
    includes:
      "<loc>https://loottableworks.github.io/loot-drop-calculator/gullwatch-beacon/</loc>\n    <lastmod>2026-07-30</lastmod>"
  }
];

let checks = 0;
function assert(condition, message) {
  checks += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function committedBlob(relativePath) {
  return execFileSync("git", ["show", `HEAD:${relativePath}`], {
    cwd: root,
    encoding: null,
    maxBuffer: 20 * 1024 * 1024
  });
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

for (const record of records) {
  const expected = committedBlob(record.local);
  const response = await fetch(
    `${siteBase}${record.remote}?qa=${commit}`,
    {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      headers: {
        "Cache-Control": "no-cache",
        "User-Agent": "LootTableWorks-QA"
      }
    }
  );
  const actual = Buffer.from(await response.arrayBuffer());
  assert(response.status === 200, `${record.remote} did not return HTTP 200`);
  assert(!response.redirected, `${record.remote} unexpectedly redirected`);
  assert(
    response.headers.get("content-type")?.startsWith(record.contentType),
    `${record.remote} content type drifted`
  );
  assert(
    actual.equals(expected),
    `${record.remote} differs from committed blob: public ${sha256(actual)}, expected ${sha256(expected)}`
  );
  if (record.includes) {
    assert(
      actual.toString("utf8").includes(record.includes),
      `${record.remote} is missing its exact acquisition contract`
    );
  }
  if (record.manifestRecord) {
    const manifest = JSON.parse(actual.toString("utf8"));
    const manifestRecord = manifest.files?.find(
      (entry) => entry.path === record.manifestRecord.path
    );
    assert(
      manifestRecord?.bytes === record.manifestRecord.bytes &&
        manifestRecord?.sha256 === record.manifestRecord.sha256,
      `${record.remote} is missing its exact deployed-blob record`
    );
  }
}

console.log(
  `Public search acquisition v1 verified ${checks} checks across ${records.length} exact committed roundtrips at ${commit}.`
);
