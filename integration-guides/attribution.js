(function preserveApprovedAcquisitionOrigin() {
  "use strict";

  const allowedCampaignOrigins = new Set(["owlcat_learning"]);
  const allowedReferrerOrigins = new Map([
    ["owlcat.games", "owlcat_learning"]
  ]);

  function token(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48);
  }

  function acquisitionOrigin() {
    const querySource = token(
      new URLSearchParams(window.location.search).get("utm_source")
    );
    if (allowedCampaignOrigins.has(querySource)) return querySource;

    try {
      const currentHost = window.location.hostname
        .replace(/^www\./, "")
        .toLowerCase();
      const referrerHost = new URL(document.referrer).hostname
        .replace(/^www\./, "")
        .toLowerCase();
      if (referrerHost && referrerHost !== currentHost) {
        return allowedReferrerOrigins.get(referrerHost) || "";
      }
    } catch {
      // Missing and malformed referrers are intentionally ignored.
    }
    return "";
  }

  const origin = acquisitionOrigin();
  if (!origin) return;

  document
    .querySelectorAll('a[href^="https://loot-table-works.itch.io/"]')
    .forEach((link) => {
      const url = new URL(link.href);
      if (url.hostname !== "loot-table-works.itch.io") return;
      url.searchParams.set("utm_term", `origin_${origin}`);
      link.href = url.toString();
    });
})();
