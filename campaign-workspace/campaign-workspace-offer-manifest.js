(function attachCampaignWorkspaceOfferManifest(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CampaignWorkspaceOfferManifest = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCampaignWorkspaceOfferManifest() {
  "use strict";

  const VERSION = "1.0.0";
  const MANIFEST_KEYS = new Set([
    "schema_version",
    "offer_id",
    "product_id",
    "title",
    "price_usd",
    "preview_url",
    "storefront_gate",
    "storefront_url",
    "tracking"
  ]);
  const TRACKING_KEYS = new Set(["source", "medium", "campaign", "preview_content", "paid_content"]);
  const PREVIEW_URL = "https://loottableworks.github.io/loot-drop-calculator/gullwatch-aftermath/";
  const TRACKING = deepFreeze({
    source: "campaign_workspace",
    medium: "web",
    campaign: "wf4w_revenue_v1",
    preview_content: "cw12_closeout_gullwatch_aftermath_preview",
    paid_content: "cw12_closeout_gullwatch_aftermath"
  });
  const DEFAULT_MANIFEST = deepFreeze({
    schema_version: VERSION,
    offer_id: "gullwatch-aftermath",
    product_id: "gullwatch-aftermath",
    title: "Gullwatch Aftermath",
    price_usd: 3,
    preview_url: PREVIEW_URL,
    storefront_gate: "closed",
    storefront_url: null,
    tracking: TRACKING
  });
  const PREVIEW = deepFreeze({
    excerpt_title: "Four endings become the next three sessions",
    excerpt_lines: [
      "Choose True Light, Carried Memory, Public Reckoning, or Broken Beacon.",
      "Carry forward faction posture, leverage, clocks, and unresolved pressure from the table.",
      "Prepare three linked sessions and fifteen scenes from the ending your group actually chose."
    ],
    immediate_outcome: "Turn the final Gullwatch choice into a coherent campaign continuation without discarding the consequences already recorded here.",
    compatibility_note: "Built as the direct Gullwatch Beacon continuation for Campaign Workspace."
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function isPlainObject(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || Object.getPrototypeOf(prototype) === null;
  }

  function assertExactKeys(value, allowed, label) {
    if (!isPlainObject(value)) throw new TypeError(`${label} must be a plain object.`);
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) throw new TypeError(`${label} contains prohibited or unknown field: ${key}.`);
    }
    for (const key of allowed) {
      if (!(key in value)) throw new TypeError(`${label} is missing field: ${key}.`);
    }
  }

  function assertExactToken(value, expected, label) {
    if (value !== expected) throw new TypeError(`${label} must be ${expected}.`);
  }

  function parseUrl(value, label) {
    if (typeof value !== "string" || value.length < 1 || value.length > 300) {
      throw new TypeError(`${label} must be a bounded absolute URL.`);
    }
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new TypeError(`${label} must be a valid absolute URL.`);
    }
    if (
      parsed.protocol !== "https:" ||
      parsed.username !== "" ||
      parsed.password !== "" ||
      parsed.hash !== ""
    ) {
      throw new TypeError(`${label} must be a credential-free HTTPS URL without a fragment.`);
    }
    return parsed;
  }

  function assertPreviewUrl(value) {
    const parsed = parseUrl(value, "manifest.preview_url");
    if (
      parsed.origin !== "https://loottableworks.github.io" ||
      parsed.pathname !== "/loot-drop-calculator/gullwatch-aftermath/" ||
      parsed.search !== ""
    ) {
      throw new TypeError("manifest.preview_url must be the exact query-free owned Gullwatch Aftermath preview.");
    }
  }

  function assertPublicStorefrontUrl(value) {
    const parsed = parseUrl(value, "manifest.storefront_url");
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    if (
      parsed.hostname !== "loot-table-works.itch.io" ||
      parsed.port !== "" ||
      parsed.search !== "" ||
      pathSegments.length !== 1 ||
      !/^[a-z0-9][a-z0-9-]{1,79}$/.test(pathSegments[0]) ||
      /(?:private|draft|secret|restricted|download)/i.test(pathSegments[0])
    ) {
      throw new TypeError("manifest.storefront_url must be a query-free public Loot Table Works itch.io project URL.");
    }
  }

  function validateManifest(manifest) {
    assertExactKeys(manifest, MANIFEST_KEYS, "manifest");
    assertExactToken(manifest.schema_version, VERSION, "manifest.schema_version");
    assertExactToken(manifest.offer_id, "gullwatch-aftermath", "manifest.offer_id");
    assertExactToken(manifest.product_id, "gullwatch-aftermath", "manifest.product_id");
    assertExactToken(manifest.title, "Gullwatch Aftermath", "manifest.title");
    if (manifest.price_usd !== 3) throw new TypeError("manifest.price_usd must be 3.");
    assertPreviewUrl(manifest.preview_url);
    assertExactKeys(manifest.tracking, TRACKING_KEYS, "manifest.tracking");
    for (const [key, expected] of Object.entries(TRACKING)) {
      assertExactToken(manifest.tracking[key], expected, `manifest.tracking.${key}`);
    }
    if (manifest.storefront_gate === "closed") {
      if (manifest.storefront_url !== null) {
        throw new TypeError("A closed storefront gate must not contain a storefront URL.");
      }
    } else if (manifest.storefront_gate === "public") {
      assertPublicStorefrontUrl(manifest.storefront_url);
    } else {
      throw new TypeError("manifest.storefront_gate must be closed or public.");
    }
    return true;
  }

  function trackedUrl(baseUrl, tracking, content) {
    const url = new URL(baseUrl);
    url.searchParams.set("utm_source", tracking.source);
    url.searchParams.set("utm_medium", tracking.medium);
    url.searchParams.set("utm_campaign", tracking.campaign);
    url.searchParams.set("utm_content", content);
    return url.toString();
  }

  function resolveOffer(manifest = DEFAULT_MANIFEST) {
    validateManifest(manifest);
    const purchaseAvailable = manifest.storefront_gate === "public";
    return deepFreeze({
      offer_id: manifest.offer_id,
      product_id: manifest.product_id,
      title: manifest.title,
      price_usd: manifest.price_usd,
      storefront_gate: manifest.storefront_gate,
      purchase_available: purchaseAvailable,
      url: trackedUrl(
        purchaseAvailable ? manifest.storefront_url : manifest.preview_url,
        manifest.tracking,
        purchaseAvailable ? manifest.tracking.paid_content : manifest.tracking.preview_content
      ),
      cta_label: purchaseAvailable
        ? "Get Gullwatch Aftermath - $3"
        : "Preview Gullwatch Aftermath",
      status_note: purchaseAvailable
        ? "Public storefront verified in the release manifest."
        : "Purchase is not available yet; this link opens the public non-purchase preview.",
      preview: PREVIEW
    });
  }

  validateManifest(DEFAULT_MANIFEST);

  return Object.freeze({
    VERSION,
    DEFAULT_MANIFEST,
    validateManifest,
    resolveOffer
  });
});
