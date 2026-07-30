import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateFeed } from "./validate-updates-feed-v1.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(root, "feed.xml"), "utf8");
const pages = {
  homepage: fs.readFileSync(path.join(root, "index.html"), "utf8"),
  directory: fs.readFileSync(path.join(root, "free-rpg-tools", "index.html"), "utf8"),
};

function fails(feed = source, candidatePages = pages) {
  assert.throws(() => validateFeed(feed, candidatePages));
}

test("approved feed passes", () => {
  assert.equal(validateFeed(source, pages).result, "PASS");
});

test("missing feed close fails", () => {
  fails(source.replace("</feed>", ""));
});

test("unescaped ampersand fails", () => {
  fails(source.replace("source-checked facts and artwork", "source-checked facts & artwork"));
});

test("invalid feed timestamp fails", () => {
  fails(source.replace("2026-07-30T15:30:00Z", "not-a-date"));
});

test("missing entry title fails", () => {
  fails(source.replace("<title>One-Shot Forge:", "<name>One-Shot Forge:"));
});

test("duplicate feed title fails", () => {
  fails(source.replace(
    "<title>Loot Table Works Updates</title>",
    "<title>Loot Table Works Updates</title><title>Unreviewed title</title>",
  ));
});

test("duplicate entry summary fails", () => {
  fails(source.replace(
    "</summary>\n  </entry>",
    "</summary><summary>Unreviewed summary</summary>\n  </entry>",
  ));
});

test("extra feed alternate link fails", () => {
  fails(source.replace(
    "<updated>2026-07-30T15:30:00Z</updated>",
    '<link rel="alternate" type="text/html" href="https://example.com/"/><updated>2026-07-30T15:30:00Z</updated>',
  ));
});

test("mixed feed text fails", () => {
  fails(source.replace(
    "<title>Loot Table Works Updates</title>",
    "Unreviewed mixed text<title>Loot Table Works Updates</title>",
  ));
});

test("unreviewed element attribute fails", () => {
  fails(source.replace(
    "<title>Loot Table Works Updates</title>",
    '<title data-unreviewed="true">Loot Table Works Updates</title>',
  ));
});

test("invented product claim fails", () => {
  fails(source.replace("four playable scenes", "forty playable scenes"));
});

test("direct paid listing fails", () => {
  fails(
    source.replace(
      "https://loottableworks.github.io/loot-drop-calculator/one-shot-forge/",
      "https://loot-table-works.itch.io/original-fantasy-item-data-pack",
    ),
  );
});

test("missing attribution fails", () => {
  fails(source.replace("utm_source=loot_table_works_feed&amp;", ""));
});

test("entry link child content fails", () => {
  fails(source.replace(
    'utm_content=updates_feed"/>',
    'utm_content=updates_feed"><span>Unreviewed</span></link>',
  ));
});

test("duplicate entry ID fails", () => {
  fails(
    source.replace(
      "https://loottableworks.github.io/loot-drop-calculator/free-rpg-tools/#outcome-directory-v1",
      "https://loottableworks.github.io/loot-drop-calculator/gullwatch-beacon/#play-tonight-v1",
    ),
  );
});

test("protected brand shorthand fails", () => {
  fails(source.replace("system-neutral", "D&amp;D"));
});

test("wrong autodiscovery destination fails", () => {
  fails(source, {
    ...pages,
    homepage: pages.homepage.replace('href="feed.xml"', 'href="missing-feed.xml"'),
  });
});

test("unreviewed autodiscovery attribute fails", () => {
  fails(source, {
    ...pages,
    homepage: pages.homepage.replace(
      'title="Loot Table Works Updates" href="feed.xml"',
      'title="Loot Table Works Updates" data-extra="true" href="feed.xml"',
    ),
  });
});

test("case-variant duplicate autodiscovery fails", () => {
  fails(source, {
    ...pages,
    homepage: pages.homepage.replace(
      "</head>",
      '<link rel="ALTERNATE" type="Application/Atom+XML" title="Duplicate" href="feed.xml"></head>',
    ),
  });
});

test("existing paid-route drift fails", () => {
  fails(source, {
    ...pages,
    directory: pages.directory.replace(
      "https://loot-table-works.itch.io/original-fantasy-item-data-pack",
      "https://loottableworks.github.io/loot-drop-calculator/world-foundry/",
    ),
  });
});

test("same-count paid-route substitution fails", () => {
  fails(source, {
    ...pages,
    directory: pages.directory.replace(
      "https://loot-table-works.itch.io/original-fantasy-item-data-pack",
      "https://loot-table-works.itch.io/world-foundry-six-module-fantasy-data-collection",
    ),
  });
});

test("script paid redirect fails", () => {
  fails(source, {
    ...pages,
    homepage: pages.homepage.replace(
      "</body>",
      '<script>location.href="https://loot-table-works.itch.io/unreviewed-listing";</script></body>',
    ),
  });
});

test("form paid action fails", () => {
  fails(source, {
    ...pages,
    homepage: pages.homepage.replace(
      "</body>",
      '<form action="https://loot-table-works.itch.io/unreviewed-listing"></form></body>',
    ),
  });
});

test("protocol-relative paid route fails", () => {
  fails(source, {
    ...pages,
    homepage: pages.homepage.replace(
      "</body>",
      '<a href="//loot-table-works.itch.io/unreviewed-listing">Unreviewed</a></body>',
    ),
  });
});

test("concatenated script paid redirect fails", () => {
  fails(source, {
    ...pages,
    homepage: pages.homepage.replace(
      "</body>",
      '<script>location.href="https://loot-table-works" + ".itch.io/unreviewed-listing";</script></body>',
    ),
  });
});

test("bundle route fails", () => {
  fails(source, {
    ...pages,
    directory: pages.directory.replace(
      "https://loot-table-works.itch.io/original-fantasy-item-data-pack",
      "https://loot-table-works.itch.io/world-foundry-bundle",
    ),
  });
});

test("lowercase prohibited business name fails", () => {
  fails(source.replace(
    "<updated>2026-07-30T15:30:00Z</updated>",
    "<rights>all faze electric</rights><updated>2026-07-30T15:30:00Z</updated>",
  ));
});

test("homepage prohibited business name fails", () => {
  fails(source, {
    ...pages,
    homepage: pages.homepage.replace("</footer>", "<span>ALL FAZE ELECTRIC</span></footer>"),
  });
});

test("directory protected brand claim fails", () => {
  fails(source, {
    ...pages,
    directory: pages.directory.replace("</footer>", "<span>DnD compatible</span></footer>"),
  });
});

test("HTML-encoded protected brand claim fails", () => {
  fails(source, {
    ...pages,
    directory: pages.directory.replace("</footer>", "<span>D&amp;D compatible</span></footer>"),
  });
});

test("element-split protected brand claim fails", () => {
  fails(source, {
    ...pages,
    directory: pages.directory.replace("</footer>", "<span>Dn</span><span>D compatible</span></footer>"),
  });
});
