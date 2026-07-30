import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const placeholder = "__LTW_GOATCOUNTER_ENDPOINT__";
const endpointPattern = /^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/;
const measuredPages = [
  "index.html",
  "world-foundry/index.html",
  "gullwatch-beacon/index.html",
  "gullwatch-aftermath/index.html",
  "choose-world-foundry-module/index.html",
  "connected-record-proof/index.html",
  "press-kit/index.html"
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArguments(argv) {
  let root = scriptRoot;
  let dryRun = false;
  let endpoint = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (argument === "--root") {
      index += 1;
      if (!argv[index]) {
        fail("--root requires a directory path.");
      }
      root = path.resolve(argv[index]);
      continue;
    }
    if (argument.startsWith("--")) {
      fail(`Unknown option: ${argument}`);
    }
    if (endpoint !== null) {
      fail("Provide exactly one GoatCounter endpoint.");
    }
    endpoint = argument;
  }

  if (!endpointPattern.test(endpoint || "")) {
    fail(
      "Endpoint must match https://<account>.goatcounter.com/count using lowercase letters, digits, or hyphens."
    );
  }
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    fail(`Activation root is not a directory: ${root}`);
  }

  return { dryRun, endpoint, root };
}

const { dryRun, endpoint, root } = parseArguments(process.argv.slice(2));
const prepared = [];

for (const relativePath of measuredPages) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    fail(`Measured page is missing: ${relativePath}`);
  }

  const source = fs.readFileSync(filePath, "utf8");
  const matches = [
    ...source.matchAll(/data-goatcounter-endpoint="([^"]+)"/g)
  ];
  if (matches.length !== 1) {
    fail(
      `${relativePath} must contain exactly one data-goatcounter-endpoint attribute; found ${matches.length}.`
    );
  }

  const currentEndpoint = matches[0][1];
  if (currentEndpoint !== placeholder && currentEndpoint !== endpoint) {
    fail(
      `${relativePath} contains a conflicting endpoint (${currentEndpoint}); no files were changed.`
    );
  }

  prepared.push({
    filePath,
    relativePath,
    source,
    updated:
      currentEndpoint === endpoint
        ? source
        : source.replace(
            `data-goatcounter-endpoint="${currentEndpoint}"`,
            `data-goatcounter-endpoint="${endpoint}"`
          )
  });
}

const changed = prepared.filter(({ source, updated }) => source !== updated);
if (!dryRun) {
  for (const record of changed) {
    const temporaryPath = `${record.filePath}.privacy-activation.tmp`;
    fs.writeFileSync(temporaryPath, record.updated, "utf8");
    fs.renameSync(temporaryPath, record.filePath);
  }
}

console.log(
  `${dryRun ? "Dry run passed" : "Privacy measurement endpoint activated"}: ` +
    `${changed.length} changed, ${prepared.length - changed.length} already exact, ` +
    `${measuredPages.length} measured pages checked.`
);
