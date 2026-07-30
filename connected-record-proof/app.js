"use strict";

(() => {
  const clean = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60);

  const params = new URLSearchParams(window.location.search);
  const source = clean(params.get("utm_source"));
  const content = clean(params.get("utm_content"));
  if (!source && !content) return;

  const attributionTerm = `origin_${[source, content].filter(Boolean).join("_")}`;
  document.querySelectorAll('a[href*="loot-table-works.itch.io/"]').forEach((anchor) => {
    try {
      const url = new URL(anchor.href);
      if (url.hostname !== "loot-table-works.itch.io") return;
      url.searchParams.set("utm_term", attributionTerm);
      anchor.href = url.toString();
    } catch {
      // Leave a malformed destination unchanged; source QA verifies all release links.
    }
  });
})();
