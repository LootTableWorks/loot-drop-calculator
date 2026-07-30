import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const workflowPath = path.join(
  root,
  ".github",
  "workflows",
  "publish-gullwatch-release.yml",
);
const notesPath = path.join(root, "releases", "gullwatch-beacon-v1.0.0.md");
const archivePath = path.join(
  root,
  "downloads",
  "gullwatch-beacon-play-tonight-kit-v1.zip",
);
const termsPath = path.join(root, "gullwatch-beacon", "USAGE-TERMS.md");

for (const requiredPath of [
  workflowPath,
  notesPath,
  archivePath,
  termsPath,
]) {
  assert.ok(fs.existsSync(requiredPath), `Missing required file: ${requiredPath}`);
}

const workflow = fs.readFileSync(workflowPath, "utf8").replaceAll("\r\n", "\n");
const notes = fs.readFileSync(notesPath, "utf8").replaceAll("\r\n", "\n");
const terms = fs.readFileSync(termsPath, "utf8").replaceAll("\r\n", "\n");
const archive = fs.readFileSync(archivePath);

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

check(
  archive.length === 16_231_801,
  `Archive size drift: ${archive.length}`,
);
check(
  crypto.createHash("sha256").update(archive).digest("hex") ===
    "f4a364fc9c3f181844c46dc746aa1f6cda47cca92db3c92c087c064c2f21ebba",
  "Archive hash drift.",
);
check(
  workflow.includes('tags:\n      - "gullwatch-beacon-v1.0.0"'),
  "Workflow tag trigger drift.",
);
check(
  workflow.includes("permissions:\n  contents: write"),
  "Workflow release permission drift.",
);
check(
  workflow.includes("runs-on: ubuntu-latest"),
  "Workflow runner drift.",
);
check(
  !workflow.includes("uses:"),
  "Release workflow must not depend on third-party actions.",
);
check(
  workflow.includes(
    "git fetch --depth=1 \"$GITHUB_SERVER_URL/$GITHUB_REPOSITORY.git\" \"refs/tags/$TAG_NAME\"",
  ),
  "Tagged-file fetch drift.",
);
check(
  workflow.includes(
    "test \"$(stat -c%s downloads/gullwatch-beacon-play-tonight-kit-v1.zip)\" = \"16231801\"",
  ),
  "Workflow archive-size gate drift.",
);
check(
  workflow.includes(
    "f4a364fc9c3f181844c46dc746aa1f6cda47cca92db3c92c087c064c2f21ebba  downloads/gullwatch-beacon-play-tonight-kit-v1.zip",
  ),
  "Workflow archive-hash gate drift.",
);
check(
  workflow.includes('gh release view "$TAG_NAME"'),
  "Duplicate release gate is missing.",
);
check(
  workflow.includes(
    'echo "::error::A release already exists for $TAG_NAME. Refusing to overwrite or duplicate it."',
  ),
  "Existing-release failure message drift.",
);
check(
  workflow.includes(
    'gh release view "$TAG_NAME" --repo "$GITHUB_REPOSITORY" >/dev/null 2>&1; then\n' +
      '            echo "::error::A release already exists for $TAG_NAME. Refusing to overwrite or duplicate it."\n' +
      "            exit 1",
  ),
  "Existing release must fail closed.",
);
check(
  !workflow.includes("Release already exists; no duplicate release created."),
  "Existing release must not be treated as a successful no-op.",
);
check(
  workflow.includes('gh release create "$TAG_NAME"'),
  "Release command is missing.",
);
check(
  workflow.includes("--verify-tag"),
  "Remote tag verification is missing.",
);
check(
  workflow.includes(
    '--title "Gullwatch Beacon: Free Play Tonight Kit v1.0.0"',
  ),
  "Release title drift.",
);
check(
  workflow.includes(
    '--notes-file "releases/gullwatch-beacon-v1.0.0.md"',
  ),
  "Release notes path drift.",
);
check(
  workflow.includes(
    '"downloads/gullwatch-beacon-play-tonight-kit-v1.zip#Gullwatch Beacon Play Tonight Kit v1.0.0"',
  ),
  "Release asset label drift.",
);

const expectedClaims = [
  "system-neutral fantasy one-shot",
  "10 minutes of preparation",
  "eight-page adventure",
  "one-page GM run sheet",
  "Six individual VTT tokens",
  "Three player handouts",
  "3-6 players",
  "3-4 hours",
  "No paid product is required",
];
for (const claim of expectedClaims) {
  check(notes.includes(claim), `Release claim missing: ${claim}`);
}

const expectedRoutes = [
  "https://loottableworks.github.io/loot-drop-calculator/gullwatch-beacon/?utm_source=github&utm_medium=release&utm_campaign=gullwatch_release_v1&utm_content=free_kit_page",
  "https://loottableworks.github.io/loot-drop-calculator/campaign-workspace/?utm_source=github&utm_medium=release&utm_campaign=gullwatch_release_v1&utm_content=campaign_workspace",
  "https://loottableworks.github.io/loot-drop-calculator/choose-world-foundry-module/?utm_source=github&utm_medium=release&utm_campaign=gullwatch_release_v1&utm_content=paid_module_selector",
];
for (const route of expectedRoutes) {
  check(notes.includes(route), `Tracked route missing: ${route}`);
  check(new URL(route).hostname === "loottableworks.github.io", "Route host drift.");
}
check((notes.match(/utm_source=github/g) ?? []).length === 3, "Tracked route count drift.");
check((notes.match(/\$3/g) ?? []).length === 1, "Optional paid offer count drift.");
check(!notes.toLowerCase().includes("bundle"), "Bundle reference is not allowed.");
check(!notes.toLowerCase().includes("open source"), "Open-source claim is not allowed.");
check(
  notes.includes("The archive includes the complete usage terms."),
  "Usage-terms disclosure is missing.",
);
check(
  notes.includes(
    "original, AI-assisted text and artwork that received human-directed editorial, visual, packaging, and technical review",
  ),
  "AI-assistance disclosure drift.",
);
check(
  notes.includes(
    "not affiliated with or endorsed by any tabletop game publisher or virtual tabletop platform",
  ),
  "Affiliation disclaimer drift.",
);
check(
  terms.includes(
    "Stream or record sessions using the kit, including monetized actual-play content.",
  ),
  "Actual-play permission drift.",
);
check(
  terms.includes(
    "Resell, repackage, mirror, or redistribute the source files or modified versions.",
  ),
  "Redistribution boundary drift.",
);

console.log(
  `PASS validate-gullwatch-github-release-v1.mjs (${checks} checks): exact archive, fail-closed workflow, grounded release claims, tracked funnel, and commercial boundaries verified.`,
);
