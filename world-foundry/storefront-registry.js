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
      hostMode: "exact"
    }),
    gumroad: Object.freeze({
      label: "Gumroad",
      host: "loottableworks.gumroad.com",
      hostMode: "exact"
    }),
    kofi: Object.freeze({
      label: "Ko-fi",
      host: "ko-fi.com",
      hostMode: "exact",
      approvedProductPaths: Object.freeze([])
    }),
    payhip: Object.freeze({
      label: "Payhip",
      host: "payhip.com",
      hostMode: "root-or-subdomain",
      approvedProductPaths: Object.freeze([])
    }),
    amazon_kdp: Object.freeze({
      label: "Amazon",
      host: "www.amazon.com",
      hostMode: "exact"
    }),
    google_play_books: Object.freeze({
      label: "Google Play Books",
      host: "play.google.com",
      hostMode: "exact",
      allowedCanonicalSearchParams: Object.freeze(["id"]),
      requiredCanonicalSearchParams: Object.freeze(["id"])
    }),
    apple_books: Object.freeze({
      label: "Apple Books",
      host: "books.apple.com",
      hostMode: "exact"
    }),
    barnes_noble: Object.freeze({
      label: "Barnes & Noble",
      host: "www.barnesandnoble.com",
      hostMode: "exact"
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
        barnes_noble: Object.freeze({ status: "not_applicable", url: null })
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
        barnes_noble: Object.freeze({ status: "not_applicable", url: null })
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
        barnes_noble: Object.freeze({ status: "not_applicable", url: null })
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
        barnes_noble: Object.freeze({ status: "not_applicable", url: null })
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
        barnes_noble: Object.freeze({ status: "not_applicable", url: null })
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
        barnes_noble: Object.freeze({ status: "not_applicable", url: null })
      })
    }),
    gullwatch_harbor: Object.freeze({
      label: "Gullwatch Harbor",
      priceUsd: 2.99,
      attributionContent: "gullwatch_harbor_campaign_book",
      attributionCampaign: "gullwatch_harbor_book_v1",
      stores: Object.freeze({
        itch: Object.freeze({ status: "not_applicable", url: null }),
        gumroad: Object.freeze({ status: "pending", url: null }),
        kofi: Object.freeze({ status: "pending", url: null }),
        payhip: Object.freeze({ status: "pending", url: null }),
        amazon_kdp: Object.freeze({ status: "pending", url: null }),
        google_play_books: Object.freeze({ status: "pending", url: null }),
        apple_books: Object.freeze({ status: "pending", url: null }),
        barnes_noble: Object.freeze({ status: "pending", url: null })
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

  function validatePublicUrl(value, storeId) {
    const policy = STORE_POLICIES[storeId];
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
    if (
      Array.isArray(policy.approvedProductPaths) &&
      !policy.approvedProductPaths.includes(parsed.pathname.replace(/\/$/, ""))
    ) {
      throw new Error(`${storeId}: product ownership is not approved`);
    }

    return parsed.toString().replace(/\/$/, "");
  }

  function validateRegistry(offers) {
    const offerEntries = Object.entries(offers || {});
    if (offerEntries.length !== 7) throw new Error("Exactly seven paid offers are required");

    for (const [offerId, offer] of offerEntries) {
      const expectedPrice = offerId === "gullwatch_harbor" ? 2.99 : 3;
      if (!offer || offer.priceUsd !== expectedPrice) {
        throw new Error(`${offerId}: price must remain $${expectedPrice}`);
      }
      if (!offer.attributionContent) throw new Error(`${offerId}: attribution content is required`);

      const storeIds = Object.keys(offer.stores || {});
      if (storeIds.length !== Object.keys(STORE_POLICIES).length) {
        throw new Error(`${offerId}: every storefront state must be explicit`);
      }

      for (const storeId of Object.keys(STORE_POLICIES)) {
        const state = offer.stores[storeId];
        if (!state || !["public", "pending", "not_applicable"].includes(state.status)) {
          throw new Error(
            `${offerId}/${storeId}: status must be public, pending, or not_applicable`
          );
        }
        if (state.status !== "public" && state.url !== null) {
          throw new Error(`${offerId}/${storeId}: non-public storefront must not expose a URL`);
        }
        if (state.status === "public") validatePublicUrl(state.url, storeId);
      }
    }

    return true;
  }

  function buildAttributedUrl(offerId, storeId, offers) {
    const registry = offers || OFFER_DEFINITIONS;
    const offer = registry[offerId];
    const state = offer && offer.stores && offer.stores[storeId];
    if (!offer || !state || state.status !== "public") return null;

    const canonical = validatePublicUrl(state.url, storeId);
    const destination = new URL(canonical);
    const attribution = {
      ...ATTRIBUTION,
      utm_campaign: offer.attributionCampaign || ATTRIBUTION.utm_campaign
    };
    for (const [key, value] of Object.entries(attribution)) {
      destination.searchParams.set(key, value);
    }
    destination.searchParams.set("utm_content", offer.attributionContent);
    destination.searchParams.set("utm_term", storeId);
    return destination.toString();
  }

  function resolvePublicStores(offerId, offers) {
    const registry = offers || OFFER_DEFINITIONS;
    const offer = registry[offerId];
    if (!offer) return [];

    return Object.keys(STORE_POLICIES)
      .filter((storeId) => offer.stores[storeId].status === "public")
      .map((storeId) => ({
        id: storeId,
        label: STORE_POLICIES[storeId].label,
        priceUsd: offer.priceUsd,
        url: buildAttributedUrl(offerId, storeId, registry)
      }));
  }

  validateRegistry(OFFER_DEFINITIONS);

  return Object.freeze({
    ATTRIBUTION,
    STORE_POLICIES,
    offers: OFFER_DEFINITIONS,
    validatePublicUrl,
    validateRegistry,
    buildAttributedUrl,
    resolvePublicStores
  });
});
