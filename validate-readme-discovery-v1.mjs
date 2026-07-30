import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const readme = fs.readFileSync(new URL("./README.md", import.meta.url), "utf8");
const directory = fs.readFileSync(new URL("./free-rpg-tools/index.html", import.meta.url), "utf8");
const campaignWorkspace = fs.readFileSync(new URL("./campaign-workspace/app.js", import.meta.url), "utf8");
let checks = 0;

function includes(value, message) {
  assert.ok(readme.includes(value), message);
  checks += 1;
}

includes("**Run tonight. Continue next week.**", "Primary campaign promise is missing");
includes("## Game Master Workflow", "Game Master workflow is missing");
includes("## 12 Free Browser Tools", "Exact free-tool count is missing");
includes("No account is required.", "No-account boundary is missing");
includes("nothing is transmitted to Loot Table Works", "Data-transmission boundary is missing");
includes("may write that save to browser storage", "Optional local-storage disclosure is missing");
includes("[Choose the right $3 World Foundry module]", "Paid selector handoff is missing");
includes(
  "[Choose from 12 original one-shot ideas](https://loottableworks.github.io/loot-drop-calculator/run-one-shot-tonight/?utm_source=github&utm_medium=repository_readme&utm_campaign=one_shot_ideas_v1&utm_content=readme_ideas)",
  "Primary one-shot ideas handoff is missing or untracked",
);
includes(
  "utm_campaign=one_shot_ideas_v1&utm_content=workflow_choose_idea",
  "One-shot ideas workflow handoff is missing or untracked",
);
includes(
  "utm_campaign=one_shot_ideas_v1&utm_content=workflow_generate",
  "One-Shot Forge workflow handoff is missing or untracked",
);

const imageMatch = readme.match(/!\[[^\]]+\]\(([^)]+)\)/);
assert.ok(imageMatch, "README preview image is missing");
checks += 1;
assert.ok(fs.existsSync(path.join(root, imageMatch[1])), `README preview image is missing: ${imageMatch[1]}`);
checks += 1;

assert.ok(campaignWorkspace.includes("localStorage.setItem"), "Campaign Workspace no longer writes local saves");
checks += 1;
assert.ok(campaignWorkspace.includes("localStorage.getItem"), "Campaign Workspace no longer reads local saves");
checks += 1;
assert.ok(!readme.includes("not written to persistent browser storage"), "README contains the rejected storage claim");
checks += 1;

const tools = [
  ["Campaign Workspace", "campaign-workspace", "campaign_workspace"],
  ["One-Shot Continuation Planner", "turn-one-shot-into-campaign", "continuation_planner"],
  ["Campaign Launchpad", "campaign-launchpad", "campaign_launchpad"],
  ["Campaign Arc Forge", "campaign-arc-forge", "campaign_arc_forge"],
  ["One-Shot Forge", "one-shot-forge", "one_shot_forge"],
  ["Player Chronicle", "player-chronicle", "player_chronicle"],
  ["Character Foundry", "character-foundry", "character_foundry"],
  ["World Seed Studio", "world-seed-studio", "world_seed_studio"],
  ["Shop Inventory Generator", "shop-inventory-generator", "shop_inventory_generator"],
  ["RPG Game Data Doctor", "rpg-data-doctor", "rpg_data_doctor"],
  ["RPG Data Bridge", "rpg-data-bridge", "rpg_data_bridge"],
  ["Loot Drop Probability Calculator", "loot-odds", "loot_drop_probability"],
];

const itemListMatch = directory.match(/"itemListElement":\s*\[(.*?)\]\s*\n\s*}/s);
assert.ok(itemListMatch, "Free-tools ItemList is missing");
checks += 1;
const itemListTools = [...itemListMatch[1].matchAll(/"position":\s*(\d+),\s*"name":\s*"([^"]+)",\s*"url":\s*"https:\/\/loottableworks\.github\.io\/loot-drop-calculator\/([^/]+)\//g)]
  .map((match) => [Number(match[1]), match[2], match[3]]);
assert.equal(itemListTools.length, 12, `Expected 12 ItemList entries, found ${itemListTools.length}`);
checks += 1;

for (const [name, route, content] of tools) {
  const position = tools.findIndex((tool) => tool[0] === name) + 1;
  assert.deepEqual(
    itemListTools[position - 1],
    [position, name, route],
    `${name} does not match the canonical ItemList entry`,
  );
  checks += 1;
  const exactUrl = `https://loottableworks.github.io/loot-drop-calculator/${route}/?utm_source=github&utm_medium=repository_readme&utm_campaign=free_tools_v1&utm_content=${content}`;
  includes(`| [${name}](${exactUrl})`, `${name} is missing or its attribution changed`);
}

const tableRows = readme
  .split(/\r?\n/)
  .filter((line) => line.startsWith("| [") && line.includes("loottableworks.github.io"));
assert.equal(tableRows.length, 12, `Expected 12 tool rows, found ${tableRows.length}`);
checks += 1;

assert.equal(
  (readme.match(/utm_campaign=free_tools_v1&utm_content=/g) ?? []).length,
  13,
  "The directory and each free tool must have one exact campaign attribution",
);
checks += 1;

assert.ok(!readme.includes("bundle"), "README must not expose a bundle before the sales gate");
checks += 1;

const paidRoutes = [
  ["itch_profile", "https://loot-table-works.itch.io/"],
  ["item_catalog", "https://loot-table-works.itch.io/original-fantasy-item-data-pack"],
  ["merchant_shop", "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit"],
  ["crafting_recipe", "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit"],
  ["enemy_loot", "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit"],
  ["quest_contract", "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit"],
  ["encounter_threat", "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit"],
];

for (const [content, baseUrl] of paidRoutes) {
  includes(
    `${baseUrl}?utm_source=github&utm_medium=repository_readme&utm_campaign=paid_catalog_v1&utm_content=${content}`,
    `Paid route ${content} is missing or untracked`,
  );
}

assert.equal(
  (readme.match(/utm_campaign=paid_catalog_v1&utm_content=/g) ?? []).length,
  7,
  "Expected one profile route and six direct paid-module routes",
);
checks += 1;

console.log(`PASS validate-readme-discovery-v1.mjs (${checks} checks): canonical 12-tool catalog, one-shot idea acquisition path, valid preview, accurate storage disclosure, and attributed free and paid routes.`);
