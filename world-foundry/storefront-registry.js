(function initStorefrontRegistry(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.LTWStorefrontRegistry = api;
})(typeof window !== "undefined" ? window : globalThis, function createStorefrontRegistry() {
  "use strict";

  const ATTRIBUTION = Object.freeze({
    utm_source: "world_foundry_hub",
    utm_medium: "storefront_selector",
    utm_campaign: "standalone_modules"
  });

  const STORE_POLICIES = Object.freeze({
    itch: Object.freeze({
      label: "itch.io",
      host: "loot-table-works.itch.io",
      hostMode: "exact",
      approvedCanonicalUrls: Object.freeze([
        "https://loot-table-works.itch.io/original-fantasy-item-data-pack",
        "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit",
        "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit",
        "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit",
        "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit",
        "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit",
        "https://loot-table-works.itch.io/gullwatch-harbor"
      ])
    }),
    gumroad: Object.freeze({
      label: "Gumroad",
      host: "loottableworks.gumroad.com",
      hostMode: "exact",
      approvedCanonicalUrls: Object.freeze([])
    }),
    kofi: Object.freeze({
      label: "Ko-fi",
      host: "ko-fi.com",
      hostMode: "exact",
      approvedCanonicalUrls: Object.freeze([])
    }),
    payhip: Object.freeze({
      label: "Payhip",
      host: "payhip.com",
      hostMode: "root-or-subdomain",
      approvedCanonicalUrls: Object.freeze([])
    }),
    amazon_kdp: Object.freeze({
      label: "Amazon",
      host: "www.amazon.com",
      hostMode: "exact",
      approvedCanonicalUrls: Object.freeze([])
    }),
    google_play_books: Object.freeze({
      label: "Google Play Books",
      host: "play.google.com",
      hostMode: "exact",
      allowedCanonicalSearchParams: Object.freeze(["id"]),
      requiredCanonicalSearchParams: Object.freeze(["id"]),
      approvedCanonicalUrls: Object.freeze([])
    }),
    apple_books: Object.freeze({
      label: "Apple Books",
      host: "books.apple.com",
      hostMode: "exact",
      approvedCanonicalUrls: Object.freeze([])
    }),
    barnes_noble: Object.freeze({
      label: "Barnes & Noble",
      host: "www.barnesandnoble.com",
      hostMode: "exact",
      approvedCanonicalUrls: Object.freeze([])
    }),
    artstation: Object.freeze({
      label: "ArtStation",
      host: "www.artstation.com",
      hostMode: "exact",
      approvedCanonicalUrls: Object.freeze([])
    }),
    etsy: Object.freeze({
      label: "Etsy",
      host: "www.etsy.com",
      hostMode: "exact",
      approvedCanonicalUrls: Object.freeze([])
    }),
    unity_asset_store: Object.freeze({
      label: "Unity Asset Store",
      host: "assetstore.unity.com",
      hostMode: "exact",
      approvedCanonicalUrls: Object.freeze([])
    }),
    fab: Object.freeze({
      label: "Fab",
      host: "www.fab.com",
      hostMode: "exact",
      approvedCanonicalUrls: Object.freeze([])
    })
  });

  const OFFER_DEFINITIONS = Object.freeze({
    item: Object.freeze({
      label: "Item Catalog & Economy Kit",
      priceUsd: 3,
      attributionContent: "item_catalog",
      stores: Object.freeze({
        itch: Object.freeze({
          status: "public",
          url: "https://loot-table-works.itch.io/original-fantasy-item-data-pack"
        }),
        gumroad: Object.freeze({ status: "pending", url: null }),
        kofi: Object.freeze({ status: "pending", url: null }),
        payhip: Object.freeze({ status: "pending", url: null }),
        amazon_kdp: Object.freeze({ status: "not_applicable", url: null }),
        google_play_books: Object.freeze({ status: "not_applicable", url: null }),
        apple_books: Object.freeze({ status: "not_applicable", url: null }),
        barnes_noble: Object.freeze({ status: "not_applicable", url: null }),
        artstation: Object.freeze({ status: "pending", url: null }),
        etsy: Object.freeze({ status: "pending", url: null }),
        unity_asset_store: Object.freeze({ status: "pending", url: null }),
        fab: Object.freeze({ status: "pending", url: null })
      })
    }),
    merchant: Object.freeze({
      label: "Merchant & Shop Kit",
      priceUsd: 3,
      attributionContent: "merchant_shop",
      stores: Object.freeze({
        itch: Object.freeze({
          status: "public",
          url: "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit"
        }),
        gumroad: Object.freeze({ status: "pending", url: null }),
        kofi: Object.freeze({ status: "pending", url: null }),
        payhip: Object.freeze({ status: "pending", url: null }),
        amazon_kdp: Object.freeze({ status: "not_applicable", url: null }),
        google_play_books: Object.freeze({ status: "not_applicable", url: null }),
        apple_books: Object.freeze({ status: "not_applicable", url: null }),
        barnes_noble: Object.freeze({ status: "not_applicable", url: null }),
        artstation: Object.freeze({ status: "not_applicable", url: null }),
        etsy: Object.freeze({ status: "not_applicable", url: null }),
        unity_asset_store: Object.freeze({ status: "not_applicable", url: null }),
        fab: Object.freeze({ status: "not_applicable", url: null })
      })
    }),
    recipe: Object.freeze({
      label: "Crafting & Recipe Kit",
      priceUsd: 3,
      attributionContent: "crafting_recipes",
      stores: Object.freeze({
        itch: Object.freeze({
          status: "public",
          url: "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit"
        }),
        gumroad: Object.freeze({ status: "pending", url: null }),
        kofi: Object.freeze({ status: "pending", url: null }),
        payhip: Object.freeze({ status: "pending", url: null }),
        amazon_kdp: Object.freeze({ status: "not_applicable", url: null }),
        google_play_books: Object.freeze({ status: "not_applicable", url: null }),
        apple_books: Object.freeze({ status: "not_applicable", url: null }),
        barnes_noble: Object.freeze({ status: "not_applicable", url: null }),
        artstation: Object.freeze({ status: "not_applicable", url: null }),
        etsy: Object.freeze({ status: "not_applicable", url: null }),
        unity_asset_store: Object.freeze({ status: "not_applicable", url: null }),
        fab: Object.freeze({ status: "not_applicable", url: null })
      })
    }),
    loot: Object.freeze({
      label: "Enemy Loot & Reward Kit",
      priceUsd: 3,
      attributionContent: "enemy_loot",
      stores: Object.freeze({
        itch: Object.freeze({
          status: "public",
          url: "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit"
        }),
        gumroad: Object.freeze({ status: "pending", url: null }),
        kofi: Object.freeze({ status: "pending", url: null }),
        payhip: Object.freeze({ status: "pending", url: null }),
        amazon_kdp: Object.freeze({ status: "not_applicable", url: null }),
        google_play_books: Object.freeze({ status: "not_applicable", url: null }),
        apple_books: Object.freeze({ status: "not_applicable", url: null }),
        barnes_noble: Object.freeze({ status: "not_applicable", url: null }),
        artstation: Object.freeze({ status: "not_applicable", url: null }),
        etsy: Object.freeze({ status: "not_applicable", url: null }),
        unity_asset_store: Object.freeze({ status: "not_applicable", url: null }),
        fab: Object.freeze({ status: "not_applicable", url: null })
      })
    }),
    quest: Object.freeze({
      label: "Quest, Contract & Reward Kit",
      priceUsd: 3,
      attributionContent: "quest_contracts",
      stores: Object.freeze({
        itch: Object.freeze({
          status: "public",
          url: "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit"
        }),
        gumroad: Object.freeze({ status: "pending", url: null }),
        kofi: Object.freeze({ status: "pending", url: null }),
        payhip: Object.freeze({ status: "pending", url: null }),
        amazon_kdp: Object.freeze({ status: "not_applicable", url: null }),
        google_play_books: Object.freeze({ status: "not_applicable", url: null }),
        apple_books: Object.freeze({ status: "not_applicable", url: null }),
        barnes_noble: Object.freeze({ status: "not_applicable", url: null }),
        artstation: Object.freeze({ status: "not_applicable", url: null }),
        etsy: Object.freeze({ status: "not_applicable", url: null }),
        unity_asset_store: Object.freeze({ status: "not_applicable", url: null }),
        fab: Object.freeze({ status: "not_applicable", url: null })
      })
    }),
    encounter: Object.freeze({
      label: "Encounter & Threat Kit",
      priceUsd: 3,
      attributionContent: "encounter_threats",
      stores: Object.freeze({
        itch: Object.freeze({
          status: "public",
          url: "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit"
        }),
        gumroad: Object.freeze({ status: "pending", url: null }),
        kofi: Object.freeze({ status: "pending", url: null }),
        payhip: Object.freeze({ status: "pending", url: null }),
        amazon_kdp: Object.freeze({ status: "not_applicable", url: null }),
        google_play_books: Object.freeze({ status: "not_applicable", url: null }),
        apple_books: Object.freeze({ status: "not_applicable", url: null }),
        barnes_noble: Object.freeze({ status: "not_applicable", url: null }),
        artstation: Object.freeze({ status: "not_applicable", url: null }),
        etsy: Object.freeze({ status: "not_applicable", url: null }),
        unity_asset_store: Object.freeze({ status: "not_applicable", url: null }),
        fab: Object.freeze({ status: "not_applicable", url: null })
      })
    }),
    gullwatch_harbor: Object.freeze({
      label: "Gullwatch Harbor",
      priceUsd: 2.99,
      attributionContent: "gullwatch_harbor_campaign_book",
      attributionCampaign: "gullwatch_harbor_book_v1",
      stores: Object.freeze({
        itch: Object.freeze({
          status: "public",
          url: "https://loot-table-works.itch.io/gullwatch-harbor"
        }),
        gumroad: Object.freeze({ status: "pending", url: null }),
        kofi: Object.freeze({ status: "pending", url: null }),
        payhip: Object.freeze({ status: "pending", url: null }),
        amazon_kdp: Object.freeze({ status: "pending", url: null }),
        google_play_books: Object.freeze({ status: "pending", url: null }),
        apple_books: Object.freeze({ status: "pending", url: null }),
        barnes_noble: Object.freeze({ status: "pending", url: null }),
        artstation: Object.freeze({ status: "not_applicable", url: null }),
        etsy: Object.freeze({ status: "not_applicable", url: null }),
        unity_asset_store: Object.freeze({ status: "not_applicable", url: null }),
        fab: Object.freeze({ status: "not_applicable", url: null })
      })
    })
  });

  const SUSPICIOUS_PATH = /(?:^|[-_/])(draft|private|secret|preview|edit)(?:$|[-_/])/i;

  function isAllowedHost(hostname, policy) {
    const normalized = String(hostname || "").toLowerCase();
    if (policy.hostMode === "root-or-subdomain") {
      return normalized === policy.host || normalized.endsWith(`.${policy.host}`);
    }
    return normalized === policy.host;
  }

  function validatePublicUrl(value, storeId, policies) {
    const policyRegistry = policies || STORE_POLICIES;
    const policy = policyRegistry[storeId];
    if (!policy) throw new Error(`Unknown storefront: ${storeId}`);

    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`${storeId}: public URL is invalid`);
    }

    if (parsed.protocol !== "https:") throw new Error(`${storeId}: HTTPS is required`);
    if (parsed.username || parsed.password) throw new Error(`${storeId}: credentials are forbidden`);
    if (!isAllowedHost(parsed.hostname, policy)) throw new Error(`${storeId}: host is not allowlisted`);
    if (parsed.hash) throw new Error(`${storeId}: canonical URL must be fragment free`);
    const allowedSearchParams = policy.allowedCanonicalSearchParams || [];
    if (parsed.search && allowedSearchParams.length === 0) {
      throw new Error(`${storeId}: canonical URL must be query free`);
    }
    for (const key of parsed.searchParams.keys()) {
      if (!allowedSearchParams.includes(key)) {
        throw new Error(`${storeId}: canonical URL contains an unapproved query parameter`);
      }
    }
    for (const key of policy.requiredCanonicalSearchParams || []) {
      if (!parsed.searchParams.get(key)) {
        throw new Error(`${storeId}: canonical URL is missing required query parameter ${key}`);
      }
    }
    if (SUSPICIOUS_PATH.test(parsed.pathname)) throw new Error(`${storeId}: draft-like path is forbidden`);
    if (parsed.pathname === "/" || parsed.pathname.length < 3) {
      throw new Error(`${storeId}: product path is required`);
    }
    const canonical = parsed.toString().replace(/\/$/, "");
    if (!Array.isArray(policy.approvedCanonicalUrls)) {
      throw new Error(`${storeId}: canonical URL allowlist is required`);
    }
    const approvedCanonicalUrls = policy.approvedCanonicalUrls.map((approved) =>
      new URL(approved).toString().replace(/\/$/, "")
    );
    if (!approvedCanonicalUrls.includes(canonical)) {
      throw new Error(`${storeId}: product identity is not approved`);
    }

    return canonical;
  }

  function validateRegistry(offers, policies) {
    const policyRegistry = policies || STORE_POLICIES;
    const offerEntries = Object.entries(offers || {});
    if (offerEntries.length !== 7) throw new Error("Exactly seven paid offers are required");

    for (const [offerId, offer] of offerEntries) {
      const expectedPrice = offerId === "gullwatch_harbor" ? 2.99 : 3;
      if (!offer || offer.priceUsd !== expectedPrice) {
        throw new Error(`${offerId}: price must remain $${expectedPrice}`);
      }
      if (!offer.attributionContent) throw new Error(`${offerId}: attribution content is required`);

      const storeIds = Object.keys(offer.stores || {});
      if (storeIds.length !== Object.keys(policyRegistry).length) {
        throw new Error(`${offerId}: every storefront state must be explicit`);
      }

      for (const storeId of Object.keys(policyRegistry)) {
        const state = offer.stores[storeId];
        if (!state || !["public", "pending", "not_applicable"].includes(state.status)) {
          throw new Error(
            `${offerId}/${storeId}: status must be public, pending, or not_applicable`
          );
        }
        if (state.status !== "public" && state.url !== null) {
          throw new Error(`${offerId}/${storeId}: non-public storefront must not expose a URL`);
        }
        if (
          Object.prototype.hasOwnProperty.call(state, "priceUsd") &&
          (!Number.isFinite(state.priceUsd) || state.priceUsd <= 0)
        ) {
          throw new Error(`${offerId}/${storeId}: price override must be positive`);
        }
        if (state.status === "public") validatePublicUrl(state.url, storeId, policyRegistry);
      }
    }

    return true;
  }

  function sanitizeAttribution(value, fallback) {
    const normalized = String(value || "").trim();
    return /^[a-z0-9][a-z0-9_.-]{0,79}$/i.test(normalized) ? normalized : fallback;
  }

  function buildAttributedUrl(offerId, storeId, offers, policies, attributionOverrides) {
    const registry = offers || OFFER_DEFINITIONS;
    const policyRegistry = policies || STORE_POLICIES;
    const offer = registry[offerId];
    const state = offer && offer.stores && offer.stores[storeId];
    if (!offer || !state || state.status !== "public") return null;

    const canonical = validatePublicUrl(state.url, storeId, policyRegistry);
    const destination = new URL(canonical);
    const overrides = attributionOverrides || {};
    const attribution = {
      utm_source: sanitizeAttribution(overrides.utm_source, ATTRIBUTION.utm_source),
      utm_medium: sanitizeAttribution(overrides.utm_medium, ATTRIBUTION.utm_medium),
      utm_campaign: sanitizeAttribution(
        overrides.utm_campaign,
        offer.attributionCampaign || ATTRIBUTION.utm_campaign
      ),
      utm_content: sanitizeAttribution(overrides.utm_content, offer.attributionContent)
    };
    for (const [key, value] of Object.entries(attribution)) {
      destination.searchParams.set(key, value);
    }
    destination.searchParams.set("utm_term", storeId);
    return destination.toString();
  }

  function resolvePublicStores(offerId, offers, policies, attributionOverrides) {
    const registry = offers || OFFER_DEFINITIONS;
    const policyRegistry = policies || STORE_POLICIES;
    const offer = registry[offerId];
    if (!offer) return [];

    return Object.keys(policyRegistry)
      .filter((storeId) => offer.stores[storeId].status === "public")
      .map((storeId) => ({
        id: storeId,
        label: policyRegistry[storeId].label,
        priceUsd: offer.stores[storeId].priceUsd || offer.priceUsd,
        url: buildAttributedUrl(
          offerId,
          storeId,
          registry,
          policyRegistry,
          attributionOverrides
        )
      }));
  }

  function findOfferIdByUrl(value, offers, policies) {
    const registry = offers || OFFER_DEFINITIONS;
    const policyRegistry = policies || STORE_POLICIES;
    let parsed;
    try {
      parsed = new URL(value, "https://loottableworks.github.io/");
    } catch {
      return null;
    }
    parsed.search = "";
    parsed.hash = "";
    const candidate = parsed.toString().replace(/\/$/, "");

    for (const [offerId, offer] of Object.entries(registry)) {
      for (const [storeId, state] of Object.entries(offer.stores)) {
        if (state.status !== "public") continue;
        const canonical = validatePublicUrl(state.url, storeId, policyRegistry);
        if (canonical === candidate) return offerId;
      }
    }
    return null;
  }

  validateRegistry(OFFER_DEFINITIONS);

  return Object.freeze({
    ATTRIBUTION,
    STORE_POLICIES,
    offers: OFFER_DEFINITIONS,
    validatePublicUrl,
    validateRegistry,
    buildAttributedUrl,
    resolvePublicStores,
    findOfferIdByUrl
  });
});
