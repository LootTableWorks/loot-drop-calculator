import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(root, "item-catalog-demo", "index.html"), "utf8");
const scriptMatch = html.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*<\/body>/);
assert.ok(scriptMatch, "Hosted acquisition script missing");

const basePaidUrl =
  "https://loottableworks.github.io/loot-drop-calculator/choose-world-foundry-module/" +
  "?utm_source=item_catalog_demo&utm_medium=product_launchpad" +
  "&utm_campaign=paid_catalog_feature_v1&utm_content=upgrade_to_500";

function routedHref(search, referrer = "") {
  const upgrade = { href: basePaidUrl };
  const context = {
    URL,
    URLSearchParams,
    window: { location: { search } },
    document: {
      referrer,
      querySelector(selector) {
        assert.equal(selector, "#paid-upgrade");
        return upgrade;
      },
    },
  };
  vm.runInNewContext(scriptMatch[1], context);
  return upgrade.href;
}

const gamestructionExpected =
  "https://loottableworks.github.io/loot-drop-calculator/choose-world-foundry-module/" +
  "?utm_source=gamestruction&utm_medium=tool_directory" +
  "&utm_campaign=ltw_data_pack_discovery_v1" +
  "&utm_content=item_catalog_demo_upgrade";
const compendiumExpected =
  "https://loottableworks.github.io/loot-drop-calculator/choose-world-foundry-module/" +
  "?utm_source=the_compendium&utm_medium=referral_directory" +
  "&utm_campaign=ltw_free_tool_directory_v1" +
  "&utm_content=item_catalog_demo_upgrade";

assert.equal(
  routedHref("?utm_source=gamestruction&utm_content=item_catalog_demo"),
  gamestructionExpected,
  "Exact Gamestruction source did not route",
);
assert.equal(
  routedHref("", "https://gamestruction.com/tools/item-catalog"),
  gamestructionExpected,
  "Gamestruction apex referrer did not route",
);
assert.equal(
  routedHref("", "https://www.gamestruction.com/tools/item-catalog"),
  gamestructionExpected,
  "Gamestruction WWW referrer did not route",
);
assert.equal(
  routedHref("?utm_source=the_compendium&utm_content=item_catalog_demo"),
  compendiumExpected,
  "Existing Compendium source regressed",
);
assert.equal(
  routedHref("", "https://compendium.tools/tool/item-catalog"),
  compendiumExpected,
  "Existing Compendium referrer regressed",
);
assert.equal(
  routedHref("?utm_source=unknown&utm_content=private-user"),
  basePaidUrl,
  "Unknown source was not discarded",
);
assert.equal(
  routedHref("?utm_source=person%40example.com&utm_content=private-user"),
  basePaidUrl,
  "Email-like source was not discarded",
);
for (const inheritedSource of ["constructor", "toString", "__proto__"]) {
  assert.equal(
    routedHref(`?utm_source=${encodeURIComponent(inheritedSource)}`),
    basePaidUrl,
    `Inherited source ${inheritedSource} was not discarded`,
  );
}
for (const inheritedHost of ["constructor", "toString", "__proto__"]) {
  assert.equal(
    routedHref("", `https://${inheritedHost}/tool/item-catalog`),
    basePaidUrl,
    `Inherited referrer host ${inheritedHost} was not discarded`,
  );
}
assert.equal(
  routedHref("", "https://attacker.example/private/user/42"),
  basePaidUrl,
  "Unapproved referrer was not discarded",
);

console.log("Gamestruction attribution behavior passed 14 cases.");
