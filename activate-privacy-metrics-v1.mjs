import crypto from "node:crypto";
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
  "press-kit/index.html",
  "run-one-shot-tonight/index.html",
  "one-shot-forge/index.html",
  "campaign-workspace/index.html",
  "buy/index.html"
];
const manifestBindings = [
  {
    page: "world-foundry/index.html",
    manifest: "world-foundry/MANIFEST.json",
    record: "index.html"
  },
  {
    page: "one-shot-forge/index.html",
    manifest: "one-shot-forge/MANIFEST.json",
    record: "index.html"
  },
  {
    page: "campaign-workspace/index.html",
    manifest: "campaign-workspace/PACKAGE-MANIFEST.json",
    record: "index.html"
  },
  {
    page: "buy/index.html",
    manifest: "buy/MANIFEST.json",
    record: "index.html"
  }
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

function fileRecord(relativePath, bytes) {
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex")
  };
}

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

const preparedByPath = new Map(
  prepared.map((record) => [record.relativePath, record])
);
const preparedManifests = [];

for (const binding of manifestBindings) {
  const page = preparedByPath.get(binding.page);
  const manifestPath = path.join(root, binding.manifest);
  if (!page || !fs.existsSync(manifestPath)) {
    fail(`Manifest binding is incomplete: ${binding.manifest} -> ${binding.page}`);
  }

  const manifestSource = fs.readFileSync(manifestPath, "utf8");
  let manifest;
  try {
    manifest = JSON.parse(manifestSource);
  } catch {
    fail(`Manifest is not valid JSON: ${binding.manifest}`);
  }

  const records = Array.isArray(manifest.files)
    ? manifest.files.filter((record) => record.path === binding.record)
    : [];
  if (records.length !== 1) {
    fail(
      `${binding.manifest} must contain exactly one ${binding.record} record; found ${records.length}.`
    );
  }

  const currentRecord = fileRecord(
    binding.record,
    Buffer.from(page.source, "utf8")
  );
  if (
    records[0].bytes !== currentRecord.bytes ||
    records[0].sha256 !== currentRecord.sha256
  ) {
    fail(
      `${binding.manifest} does not match ${binding.page}; no files were changed.`
    );
  }

  if (page.source === page.updated) continue;
  const nextRecord = fileRecord(
    binding.record,
    Buffer.from(page.updated, "utf8")
  );
  manifest.files = manifest.files.map((record) =>
    record.path === binding.record ? nextRecord : record
  );
  preparedManifests.push({
    filePath: manifestPath,
    relativePath: binding.manifest,
    source: manifestSource,
    updated: `${JSON.stringify(manifest, null, 2)}\n`
  });
}

const changed = prepared.filter(({ source, updated }) => source !== updated);
const writes = [...changed, ...preparedManifests];
if (!dryRun) {
  const staged = [];
  const replaced = [];
  try {
    for (const record of writes) {
      const temporaryPath = `${record.filePath}.privacy-activation.tmp`;
      fs.writeFileSync(temporaryPath, record.updated, "utf8");
      staged.push({ ...record, temporaryPath });
    }
    for (const record of staged) {
      fs.renameSync(record.temporaryPath, record.filePath);
      replaced.push(record);
    }
  } catch (error) {
    for (const record of replaced.reverse()) {
      const rollbackPath = `${record.filePath}.privacy-activation.rollback.tmp`;
      fs.writeFileSync(rollbackPath, record.source, "utf8");
      fs.renameSync(rollbackPath, record.filePath);
    }
    for (const record of staged) {
      if (fs.existsSync(record.temporaryPath)) fs.rmSync(record.temporaryPath);
    }
    fail(`Activation failed and was rolled back: ${error.message}`);
  }
}

console.log(
  `${dryRun ? "Dry run passed" : "Privacy measurement endpoint activated"}: ` +
    `${changed.length} changed, ${prepared.length - changed.length} already exact, ` +
    `${measuredPages.length} measured pages and ${manifestBindings.length} package manifests checked.`
);
