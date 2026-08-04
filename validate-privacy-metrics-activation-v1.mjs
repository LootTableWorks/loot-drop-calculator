import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(root, "activate-privacy-metrics-v1.mjs");
const placeholder = "__LTW_GOATCOUNTER_ENDPOINT__";
const endpoint = "https://loottableworks-test.goatcounter.com/count";
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
  ["world-foundry/MANIFEST.json", "world-foundry/index.html", "index.html"],
  ["one-shot-forge/MANIFEST.json", "one-shot-forge/index.html", "index.html"],
  ["campaign-workspace/PACKAGE-MANIFEST.json", "campaign-workspace/index.html", "index.html"],
  ["buy/MANIFEST.json", "buy/index.html", "index.html"]
];

let checks = 0;
function assert(condition, message) {
  checks += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function run(argumentsList) {
  return spawnSync(process.execPath, [scriptPath, ...argumentsList], {
    cwd: root,
    encoding: "utf8"
  });
}

function readPage(testRoot, relativePath) {
  return fs.readFileSync(path.join(testRoot, relativePath), "utf8");
}

function copyFile(testRoot, relativePath) {
  const destination = path.join(testRoot, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(root, relativePath), destination);
}

function manifestMatches(testRoot, manifestPath) {
  const directory = path.dirname(manifestPath);
  const manifest = JSON.parse(readPage(testRoot, manifestPath));
  return manifest.files.every((record) => {
    const bytes = fs.readFileSync(path.join(testRoot, directory, record.path));
    return (
      bytes.length === record.bytes &&
      crypto.createHash("sha256").update(bytes).digest("hex") === record.sha256
    );
  });
}

const testRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "ltw-privacy-activation-")
);

try {
  for (const relativePath of measuredPages) copyFile(testRoot, relativePath);
  for (const [manifestPath] of manifestBindings) {
    const manifest = JSON.parse(readPage(root, manifestPath));
    copyFile(testRoot, manifestPath);
    for (const record of manifest.files) {
      copyFile(testRoot, path.join(path.dirname(manifestPath), record.path));
    }
  }

  const invalid = run([
    "http://invalid.example/count",
    "--root",
    testRoot
  ]);
  assert(invalid.status !== 0, "Invalid endpoint was accepted");
  assert(
    measuredPages.every((relativePath) =>
      readPage(testRoot, relativePath).includes(placeholder)
    ),
    "Invalid activation changed a measured page"
  );

  const dryRun = run([endpoint, "--root", testRoot, "--dry-run"]);
  assert(dryRun.status === 0, `Dry run failed: ${dryRun.stderr}`);
  assert(
    measuredPages.every((relativePath) =>
      readPage(testRoot, relativePath).includes(placeholder)
    ),
    "Dry run changed a measured page"
  );

  const staleManifestPath = path.join(testRoot, "buy", "MANIFEST.json");
  const staleManifest = JSON.parse(fs.readFileSync(staleManifestPath, "utf8"));
  staleManifest.files.find((record) => record.path === "index.html").bytes += 1;
  fs.writeFileSync(staleManifestPath, `${JSON.stringify(staleManifest, null, 2)}\n`, "utf8");
  const staleManifestRun = run([endpoint, "--root", testRoot]);
  assert(staleManifestRun.status !== 0, "Stale manifest was accepted");
  assert(
    measuredPages.every((relativePath) =>
      readPage(testRoot, relativePath).includes(placeholder)
    ),
    "Manifest preflight failure partially activated pages"
  );
  copyFile(testRoot, "buy/MANIFEST.json");

  const conflictPath = path.join(testRoot, measuredPages.at(-1));
  const conflictSource = fs
    .readFileSync(conflictPath, "utf8")
    .replace(
      placeholder,
      "https://conflicting-account.goatcounter.com/count"
    );
  fs.writeFileSync(conflictPath, conflictSource, "utf8");
  const conflict = run([endpoint, "--root", testRoot]);
  assert(conflict.status !== 0, "Conflicting endpoint was accepted");
  assert(
    measuredPages.slice(0, -1).every((relativePath) =>
      readPage(testRoot, relativePath).includes(placeholder)
    ),
    "Preflight failure partially activated earlier pages"
  );

  fs.copyFileSync(path.join(root, measuredPages.at(-1)), conflictPath);
  const activation = run([endpoint, "--root", testRoot]);
  assert(activation.status === 0, `Activation failed: ${activation.stderr}`);
  assert(
    measuredPages.every((relativePath) => {
      const html = readPage(testRoot, relativePath);
      return (
        html.includes(`data-goatcounter-endpoint="${endpoint}"`) &&
        !html.includes(placeholder)
      );
    }),
    "Activation did not set the exact endpoint on every measured page"
  );
  assert(
    manifestBindings.every(([manifestPath]) => manifestMatches(testRoot, manifestPath)),
    "Activation invalidated a package manifest"
  );

  const secondActivation = run([endpoint, "--root", testRoot]);
  assert(
    secondActivation.status === 0 &&
      secondActivation.stdout.includes("0 changed, 11 already exact"),
    "Exact reactivation was not idempotent"
  );

  assert(
    measuredPages.every((relativePath) =>
      readPage(root, relativePath).includes(placeholder)
    ),
    "Activation tests changed the real locked candidate"
  );
} finally {
  fs.rmSync(testRoot, { recursive: true, force: true });
}

console.log(
  `Privacy measurement activation validator passed: ${checks} checks; invalid, dry-run, atomic-conflict, exact activation, and idempotency cases covered.`
);
