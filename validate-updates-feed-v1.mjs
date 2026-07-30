import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const structuralValidator = path.join(root, "validate-updates-feed-structure-v1.py");

export function validateFeed(feed, pages) {
  const result = spawnSync("python", [structuralValidator], {
    encoding: "utf8",
    input: JSON.stringify({
      feed,
      homepage: pages.homepage,
      directory: pages.directory,
    }),
  });
  assert.equal(
    result.status,
    0,
    `Structural feed validation failed: ${result.stderr || result.stdout}`,
  );
  return JSON.parse(result.stdout);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateFeed(
    fs.readFileSync(path.join(root, "feed.xml"), "utf8"),
    {
      homepage: fs.readFileSync(path.join(root, "index.html"), "utf8"),
      directory: fs.readFileSync(
        path.join(root, "free-rpg-tools", "index.html"),
        "utf8",
      ),
    },
  );
  console.log(
    `PASS validate-updates-feed-v1.mjs (${result.checks} checks): ${result.entries} exact Atom entries, ${result.owned_destinations} attributed owned destinations, ${result.autodiscovery_surfaces} discovery surfaces, and ${result.bundle_routes} bundle routes.`,
  );
}
