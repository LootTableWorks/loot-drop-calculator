(function initCheckoutPage(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.LTWCheckoutPage = api;
  api.start(
    root.document,
    root.location,
    root.LTWStorefrontRegistry,
    root.setTimeout,
    root.LTWPrivacyMetrics
  );
})(typeof window !== "undefined" ? window : globalThis, function createCheckoutPage() {
  "use strict";

  const ATTRIBUTION_KEYS = Object.freeze([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content"
  ]);

  const ATTRIBUTION_ALLOWLISTS = Object.freeze({
    utm_source: new Set([
      "connected_record_proof",
      "data_pack_finder",
      "free_rpg_tools",
      "gamestruction",
      "gullwatch_kit",
      "integration_guides",
      "loot_drop_calculator",
      "module_selector",
      "one_shot_forge",
      "run_one_shot_guide",
      "shop_inventory_generator"
    ]),
    utm_medium: new Set(["catalog", "free_tool", "html", "owned_web", "seo_guide", "tool_directory"]),
    utm_campaign: new Set([
      "game_economy_shop_data_integration",
      "fantasy_rpg_data_packs_v1",
      "godot_4_resource_data_import",
      "integration_guides_index",
      "item_catalog",
      "ltw_data_pack_discovery_v1",
      "loot_table_validation",
      "one_shot_value_launch",
      "play_tonight_gullwatch_v1",
      "rpg_json_schema_design",
      "standalone_modules",
      "typescript_rpg_data_models",
      "unity_jsonutility_stable_id_import",
      "wf4w_revenue_v1",
      "world_foundry_proof_v1",
      "world_foundry_traffic_test"
    ]),
    utm_content: new Set([
      "crafting_recipes",
      "crafting_recipes_compare",
      "economy_crafting_recipes",
      "economy_encounter_threats",
      "economy_enemy_loot",
      "economy_item_catalog",
      "economy_merchant_shop",
      "economy_quest_contracts",
      "encounter",
      "encounter_threats",
      "encounter_threats_compare",
      "enemy_loot",
      "enemy_loot_compare",
      "godot_crafting_recipes",
      "godot_encounter_threats",
      "godot_enemy_loot",
      "godot_item_catalog",
      "godot_merchant_shop",
      "godot_quest_contracts",
      "gullwatch_harbor_featured_campaign",
      "gullwatch_harbor_campaign",
      "header",
      "index_crafting_recipes",
      "index_encounter_threats",
      "index_enemy_loot",
      "index_item_catalog",
      "index_merchant_shop",
      "index_quest_contracts",
      "item_catalog",
      "item_catalog_compare",
      "loot",
      "loot_crafting_recipes",
      "loot_encounter_threats",
      "loot_enemy_loot",
      "loot_item_catalog",
      "loot_merchant_shop",
      "loot_quest_contracts",
      "merchant_shop",
      "merchant_shop_compare",
      "paid_encounter",
      "paid_kit",
      "paid_loot",
      "paid_quest",
      "proof_crafting_recipe",
      "proof_encounter_threat",
      "proof_enemy_loot",
      "proof_item_catalog",
      "proof_merchant_shop",
      "proof_quest_contract",
      "quest",
      "quest_contracts",
      "quest_contracts_compare",
      "results",
      "schema_crafting_recipes",
      "schema_encounter_threats",
      "schema_enemy_loot",
      "schema_item_catalog",
      "schema_merchant_shop",
      "schema_quest_contracts",
      "typescript_crafting_recipes",
      "typescript_encounter_threats",
      "typescript_enemy_loot",
      "typescript_item_catalog",
      "typescript_merchant_shop",
      "typescript_quest_contracts",
      "unity_crafting_recipes",
      "unity_encounter_threats",
      "unity_enemy_loot",
      "unity_item_catalog",
      "unity_merchant_shop",
      "unity_quest_contracts"
    ])
  });

  function priceLabel(value) {
    const price = Number(value);
    return `$${price.toFixed(Number.isInteger(price) ? 0 : 2)}`;
  }

  function readRequest(locationRef) {
    const requestUrl = new URL(locationRef.href);
    const attribution = {};
    for (const key of ATTRIBUTION_KEYS) {
      const value = String(requestUrl.searchParams.get(key) || "")
        .trim()
        .toLowerCase();
      if (ATTRIBUTION_ALLOWLISTS[key].has(value)) attribution[key] = value;
    }
    return {
      offerId: requestUrl.searchParams.get("offer") || "",
      attribution
    };
  }

  function resolveRequest(locationRef, registry) {
    if (!registry) return { state: "blocked", reason: "Storefront registry unavailable." };

    try {
      registry.validateRegistry(registry.offers);
    } catch {
      return { state: "blocked", reason: "Storefront verification failed." };
    }

    const request = readRequest(locationRef);
    const offer = registry.offers[request.offerId];
    if (!offer) return { state: "blocked", reason: "Unknown product request." };

    const stores = registry.resolvePublicStores(
      request.offerId,
      undefined,
      undefined,
      request.attribution
    );
    if (stores.length === 0) {
      return {
        state: "unavailable",
        offerId: request.offerId,
        offer,
        stores,
        reason: "No verified public storefront is available for this product."
      };
    }

    return {
      state: stores.length === 1 ? "single" : "multiple",
      offerId: request.offerId,
      offer,
      stores
    };
  }

  function createStoreLink(documentRef, offerId, offer, store) {
    const link = documentRef.createElement("a");
    link.className = "store-option";
    link.href = store.url;
    link.rel = "noopener";
    link.dataset.storeId = store.id;
    link.dataset.offerId = offerId;
    link.setAttribute(
      "aria-label",
      `Continue to ${store.label} for ${offer.label}, ${priceLabel(store.priceUsd)}`
    );

    const copy = documentRef.createElement("span");
    const name = documentRef.createElement("strong");
    name.textContent = store.label;
    const detail = documentRef.createElement("small");
    detail.textContent = `Verified product page | ${priceLabel(store.priceUsd)}`;
    copy.append(name, detail);

    const arrow = documentRef.createElement("b");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "\u2197";
    link.append(copy, arrow);
    return link;
  }

  function render(documentRef, resolution) {
    const title = documentRef.querySelector("#checkout-title");
    const message = documentRef.querySelector("#checkout-message");
    const options = documentRef.querySelector("#store-options");
    const status = documentRef.querySelector("#checkout-status");

    options.replaceChildren();
    if (resolution.state === "blocked" || resolution.state === "unavailable") {
      title.textContent =
        resolution.state === "unavailable" && resolution.offer
          ? `${resolution.offer.label} is not available`
          : "Checkout request blocked";
      message.textContent = resolution.reason;
      status.textContent = "No destination was opened.";
      status.dataset.state = "blocked";
      return;
    }

    title.textContent = resolution.offer.label;
    message.textContent =
      resolution.state === "single"
        ? "One verified storefront is available. Opening its exact public product page."
        : "Choose a verified storefront. Prices shown are the current channel prices.";
    for (const store of resolution.stores) {
      options.append(
        createStoreLink(documentRef, resolution.offerId, resolution.offer, store)
      );
    }
    status.textContent = `${resolution.stores.length} verified storefront${
      resolution.stores.length === 1 ? "" : "s"
    } | allowlisted attribution preserved`;
    status.dataset.state = "verified";
  }

  function completeRedirect(measurement, locationRef, destination, schedule) {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      locationRef.replace(destination);
    };
    const timeout = typeof schedule === "function" ? schedule : setTimeout;
    timeout(finish, 600);
    if (measurement && typeof measurement.then === "function") {
      measurement.then(finish, finish);
    } else {
      finish();
    }
  }

  function start(documentRef, locationRef, registry, schedule, metrics) {
    if (!documentRef || !locationRef) return { state: "blocked", reason: "Page unavailable." };
    const resolution = resolveRequest(locationRef, registry);
    render(documentRef, resolution);

    if (resolution.state === "single" && typeof locationRef.replace === "function") {
      const redirect = typeof schedule === "function" ? schedule : (callback) => callback();
      redirect(() => {
        const store = resolution.stores[0];
        const measurement = metrics && typeof metrics.recordCheckoutRedirect === "function"
          ? metrics.recordCheckoutRedirect(store.id, resolution.offerId, registry)
          : null;
        completeRedirect(measurement, locationRef, store.url, schedule);
      }, 180);
    }
    return resolution;
  }

  return Object.freeze({
    ATTRIBUTION_KEYS,
    ATTRIBUTION_ALLOWLISTS,
    priceLabel,
    readRequest,
    resolveRequest,
    createStoreLink,
    render,
    completeRedirect,
    start
  });
});
