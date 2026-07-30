import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const origin =
  "https://loottableworks.github.io/loot-drop-calculator";
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8"
}).trim();
const contracts = [
  {
    path: "turn-one-shot-into-campaign/index.html",
    url: `${origin}/turn-one-shot-into-campaign/`,
    contentType: "text/html"
  },
  {
    path: "turn-one-shot-into-campaign/styles.css",
    url: `${origin}/turn-one-shot-into-campaign/styles.css`,
    contentType: "text/css"
  },
  {
    path: "turn-one-shot-into-campaign/app.js",
    url: `${origin}/turn-one-shot-into-campaign/app.js`,
    contentType: "application/javascript"
  },
  {
    path: "turn-one-shot-into-campaign/MANIFEST.json",
    url: `${origin}/turn-one-shot-into-campaign/MANIFEST.json`,
    contentType: "application/json"
  },
  {
    path: "run-one-shot-tonight/index.html",
    url: `${origin}/run-one-shot-tonight/`,
    contentType: "text/html"
  },
  {
    path: "free-rpg-tools/index.html",
    url: `${origin}/free-rpg-tools/`,
    contentType: "text/html"
  },
  {
    path: "sitemap.xml",
    url: `${origin}/sitemap.xml`,
    contentType: "application/xml"
  }
];

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

let checks = 0;
function assert(condition, message) {
  checks += 1;
  if (!condition) {
    throw new Error(message);
  }
}

for (const contract of contracts) {
  const committed = execFileSync("git", ["show", `HEAD:${contract.path}`], {
    cwd: root,
    encoding: null,
    maxBuffer: 20 * 1024 * 1024
  });
  const response = await fetch(`${contract.url}?qa=${commit}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
    headers: {
      "Cache-Control": "no-cache",
      "User-Agent": "LootTableWorks-QA"
    }
  });
  const publicBytes = Buffer.from(await response.arrayBuffer());
  const publicContentType = response.headers.get("content-type") ?? "";

  assert(response.status === 200, `${contract.url}: HTTP ${response.status}`);
  assert(
    !response.redirected &&
      new URL(response.url).pathname === new URL(contract.url).pathname,
    `${contract.url}: unexpected redirect or final path ${response.url}`
  );
  assert(
    publicContentType.includes(contract.contentType),
    `${contract.url}: content type ${publicContentType}`
  );
  assert(
    publicBytes.length === committed.length,
    `${contract.url}: ${publicBytes.length} public bytes != ${committed.length} committed bytes`
  );
  assert(
    sha256(publicBytes) === sha256(committed),
    `${contract.url}: public SHA-256 does not match HEAD`
  );
}

console.log(
  `One-shot continuation guide public verifier passed ${checks} checks across ${contracts.length} exact committed roundtrips.`
);
