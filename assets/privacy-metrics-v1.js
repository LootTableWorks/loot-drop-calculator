(function () {
  "use strict";

  var script = document.currentScript;
  var endpoint = script && script.dataset
    ? String(script.dataset.goatcounterEndpoint || "").trim()
    : "";
  var productionHost = "loottableworks.github.io";
  var sitePrefix = "/loot-drop-calculator";
  var vendorSource = "https://gc.zgo.at/count.v5.js";
  var vendorIntegrity =
    "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ";
  var eventQueue = [];
  var active = false;

  var measuredRoutes = Object.freeze({
    "/loot-drop-calculator/": "front-door",
    "/loot-drop-calculator/world-foundry/": "world-foundry",
    "/loot-drop-calculator/gullwatch-beacon/": "gullwatch-beacon",
    "/loot-drop-calculator/gullwatch-aftermath/": "gullwatch-aftermath",
    "/loot-drop-calculator/choose-world-foundry-module/": "module-selector",
    "/loot-drop-calculator/connected-record-proof/": "connected-record-proof",
    "/loot-drop-calculator/press-kit/": "press-kit",
    "/loot-drop-calculator/run-one-shot-tonight/": "run-one-shot-guide",
    "/loot-drop-calculator/one-shot-forge/": "one-shot-forge",
    "/loot-drop-calculator/campaign-workspace/": "campaign-workspace",
    "/loot-drop-calculator/buy/": "checkout"
  });

  var allowedSources = Object.freeze({
    aftermath_preview: "aftermath-preview",
    awesome_dnd: "awesome-dnd",
    bluesky: "bluesky",
    campaign_workspace: "campaign-workspace",
    community: "community",
    connected_record_proof: "connected-record-proof",
    data_pack_finder: "data-pack-finder",
    free_rpg_tools: "free-rpg-tools",
    gamestruction: "gamestruction",
    gamingtrend: "gamingtrend",
    github: "github",
    github_pages: "github-pages",
    gm_test: "gm-test",
    groupfinder: "groupfinder",
    gullwatch_aftermath: "gullwatch-aftermath",
    gullwatch_beacon: "gullwatch-beacon",
    gullwatch_kit: "gullwatch-kit",
    ig: "instagram",
    instagram: "instagram",
    integration_guides: "integration-guides",
    itch_io: "itch-io",
    itchio: "itch-io",
    loot_drop_calculator: "loot-drop-calculator",
    mastodon: "mastodon",
    module_selector: "module-selector",
    one_shot_forge: "one-shot-forge",
    organic_search: "organic-search",
    owlcat_learning: "owlcat-learning",
    owned_site: "owned-site",
    owned_web: "owned-web",
    owned_workspace: "owned-workspace",
    play_tonight_page: "play-tonight-page",
    pinterest: "pinterest",
    press_kit: "press-kit",
    rpggen_dev: "rpggen-dev",
    run_one_shot_guide: "run-one-shot-guide",
    shop_inventory_generator: "shop-inventory-generator",
    tabletop_gaming_news: "tabletop-gaming-news",
    the_compendium: "the-compendium",
    tiktok: "tiktok",
    tinytools: "tinytools",
    tribality: "tribality",
    user_share: "user-share",
    world_foundry_hub: "world-foundry-hub",
    world_foundry_selector: "world-foundry-selector",
    youtube: "youtube"
  });

  var allowedCampaigns = Object.freeze({
    audience_split: "audience-split",
    campaign_workspace_v1: "campaign-workspace-v1",
    connected_record_proof_v1: "connected-record-proof-v1",
    cw_gullwatch_demand_2026_07: "cw-gullwatch-demand-2026-07",
    free_tools: "free-tools",
    free_tools_v1: "free-tools-v1",
    game_economy_shop_data_integration: "game-economy-shop-data-integration",
    fantasy_rpg_data_packs_v1: "fantasy-rpg-data-packs-v1",
    godot_4_resource_data_import: "godot-4-resource-data-import",
    gullwatch_harbor_book_v1: "gullwatch-harbor-book-v1",
    gullwatch_v1: "gullwatch-v1",
    gullwatch_campaign_workspace_v1: "gullwatch-campaign-workspace-v1",
    ltw_data_pack_discovery_v1: "ltw-data-pack-discovery-v1",
    ltw_free_tool_directory_v1: "ltw-free-tool-directory-v1",
    ltw_instagram_7d_v1: "ltw-instagram-7d-v1",
    ltw_one_shot_intent_v1: "ltw-one-shot-intent-v1",
    ltw_paid_catalog_proof_v1: "ltw-paid-catalog-proof-v1",
    ltw_pinterest_launch_v1: "ltw-pinterest-launch-v1",
    ltw_recovery_2026_07: "ltw-recovery-2026-07",
    ltw_rpg_data_learning_v1: "ltw-rpg-data-learning-v1",
    ltw_youtube_editorial_batch_v1: "ltw-youtube-editorial-batch-v1",
    item_catalog_demo_v1: "item-catalog-demo-v1",
    integration_guides_index: "integration-guides-index",
    item_catalog: "item-catalog",
    loot_table_validation: "loot-table-validation",
    module_selector_v1: "module-selector-v1",
    one_shot_ideas_v1: "one-shot-ideas-v1",
    one_shot_value_launch: "one-shot-value-launch",
    one_shot_continuity_v1: "one-shot-continuity-v1",
    one_shot_forge_share: "one-shot-forge-share",
    paid_catalog_feature_v1: "paid-catalog-feature-v1",
    play_tonight_gullwatch_v1: "play-tonight-gullwatch-v1",
    press_creator_kit_v1: "press-creator-kit-v1",
    run_tonight_continue_next_week: "run-tonight-continue-next-week",
    rpg_json_schema_design: "rpg-json-schema-design",
    standalone_modules: "standalone-modules",
    typescript_rpg_data_models: "typescript-rpg-data-models",
    unity_jsonutility_stable_id_import: "unity-jsonutility-stable-id-import",
    wf14d_v1: "wf14d-v1",
    wf4w_revenue_v1: "wf4w-revenue-v1",
    world_foundry_proof_v1: "world-foundry-proof-v1",
    world_foundry_traffic_test: "world-foundry-traffic-test"
  });

  function allowlist(values) {
    var output = {};
    values.forEach(function (value) {
      output[value] = value.replace(/_/g, "-");
    });
    return Object.freeze(output);
  }

  var oneShotAttributionOrigins = Object.freeze([
    "awesome_dnd", "bluesky", "gamingtrend", "github", "instagram",
    "itch_io", "mastodon", "organic_search", "owned_site", "pinterest",
    "press_kit", "rpggen_dev", "run_one_shot_guide", "the_compendium",
    "tiktok", "tinytools", "tribality", "user_share", "youtube"
  ]);
  var oneShotCheckoutContentBases = Object.freeze([
    "gullwatch_harbor_featured_campaign", "quests_recommended",
    "encounters_recommended", "loot_profiles_recommended",
    "items_recommended", "merchants_recommended", "recipes_recommended"
  ]);
  var oneShotCheckoutContents = [];
  oneShotCheckoutContentBases.forEach(function (base) {
    oneShotCheckoutContents.push(base);
    oneShotAttributionOrigins.forEach(function (origin) {
      oneShotCheckoutContents.push(base + "_origin_" + origin);
    });
  });

  var allowedContents = allowlist([
    "adventure_pdf", "aftermath_story_handoff", "builder_choose_module",
    "builder_connected_trace", "campaign_arc_forge", "campaign_book",
    "campaign_continuity_tool", "campaign_launchpad", "campaign_workspace",
    "character_foundry", "compare_modules", "complete_kit",
    "complete_one_shot_generator", "connected_record_proof_owned_route", "connected_record_six_module_trace",
    "continue_four_session_campaign", "continuity_campaign_book",
    "continuity_field_test", "continuity_workspace", "crafting_recipes",
    "crafting_recipes_compare", "d04_one_shot_forge", "download_demo_zip",
    "economy_crafting_recipes", "economy_encounter_threats",
    "economy_enemy_loot", "economy_item_catalog", "economy_merchant_shop",
    "economy_quest_contracts", "encounter", "encounter_threats",
    "encounter_threats_compare",
    "ending_public_reckoning_workspace_from_direct", "enemy_loot",
    "enemy_loot_compare", "fact_sheet_download", "field_test_private_route",
    "footer_catalog", "footer_full_campaign", "footer_press",
    "footer_start_free_from_direct", "footer_workspace_field_test_from_direct",
    "generated_one_shot", "godot_crafting_recipes", "godot_encounter_threats",
    "godot_enemy_loot", "godot_item_catalog", "godot_merchant_shop",
    "godot_quest_contracts", "gullwatch_download",
    "gullwatch_harbor_featured_campaign",
    "gullwatch_harbor_campaign", "gullwatch_harbor_sample",
    "gullwatch_harbor_preview", "gullwatch_release", "hero",
    "hero_full_campaign", "hero_generate_one_shot", "hero_prep_guide",
    "header", "hero_shop_modules", "hero_start_free_from_direct",
    "hub_connected_trace", "index_crafting_recipes", "index_encounter_threats",
    "index_enemy_loot", "index_item_catalog", "index_merchant_shop",
    "index_quest_contracts",
    "idea_band", "idea_contract_bell", "idea_drowned_bell_ledger",
    "idea_flooded_safe_road", "idea_ownership_vault", "idea_reef_tithe",
    "idea_reported_convoy", "idea_tomorrows_water", "idea_two_maker_prototype",
    "idea_two_names_one_tomb", "idea_two_norths", "idea_two_seal_caravan",
    "idea_wrong_harbor", "inspect_100_free_records", "item_catalog", "item_catalog_compare",
    "item_catalog_demo", "item_catalog_demo_upgrade", "loot", "loot_calculator",
    "loot_crafting_recipes",
    "loot_encounter_threats", "loot_enemy_loot", "loot_item_catalog",
    "loot_merchant_shop", "loot_odds", "loot_quest_contracts",
    "merchant_shop", "merchant_shop_compare", "module_selector", "module_tool",
    "nav_campaign_workspace_from_direct", "nav_continue", "nav_developer_tools",
    "nav_free_gullwatch_from_direct", "nav_ideas", "nav_play",
    "one_shot_field_test", "one_shot_forge", "one_shot_forge_generator",
    "open_browser_demo", "paid_encounter", "paid_kit", "paid_loot", "paid_quest",
    "pin09_encounter_reference_closure", "pin10_six_system_trace",
    "player_chronicle", "primary_start", "proof_crafting_recipe",
    "proof_encounter_threat", "proof_enemy_loot", "proof_footer_choose_module",
    "proof_header_choose_module", "proof_hero_choose_module", "proof_item_catalog",
    "proof_merchant_shop", "proof_quest_contract", "quest", "quest_contracts",
    "quest_contracts_compare", "recommendation_proof_trace", "relationship_proof",
    "results", "schema_crafting_recipes", "schema_encounter_threats",
    "schema_enemy_loot", "schema_item_catalog", "schema_merchant_shop",
    "schema_quest_contracts",
    "route_campaign_workspace", "route_continuation_planner", "route_gullwatch",
    "route_one_shot_forge", "rpg_data_bridge", "rpg_data_doctor",
    "shop_inventory", "shop_modules", "tool_directory", "tools_platforms_listing",
    "typescript_crafting_recipes", "typescript_encounter_threats",
    "typescript_enemy_loot", "typescript_item_catalog", "typescript_merchant_shop",
    "typescript_quest_contracts", "unity_crafting_recipes",
    "unity_encounter_threats", "unity_enemy_loot", "unity_item_catalog",
    "unity_merchant_shop", "unity_quest_contracts", "utility_index",
    "w1_free_rpg_tools", "w1_guides", "w1_gullwatch_kit",
    "w1_workspace_field_test", "worked_example_gullwatch", "world_seed_studio",
    "ytb1_short_01_gullwatch_ready_tonight",
    "ytb1_short_02_connected_record_trace"
  ].concat(oneShotCheckoutContents));

  var referrerSources = Object.freeze({
    "bsky.app": "bluesky",
    "gamestruction.com": "gamestruction",
    "github.com": "github",
    "instagram.com": "instagram",
    "www.instagram.com": "instagram",
    "www.gamestruction.com": "gamestruction",
    "mastodon.social": "mastodon",
    "pinterest.com": "pinterest",
    "www.pinterest.com": "pinterest",
    "rpggen.dev": "rpggen-dev",
    "www.rpggen.dev": "rpggen-dev",
    "tiktok.com": "tiktok",
    "tinytools.directory": "tinytools",
    "www.tiktok.com": "tiktok",
    "www.tinytools.directory": "tinytools",
    "youtube.com": "youtube",
    "www.youtube.com": "youtube"
  });

  function normalizePath(pathname) {
    var raw = String(pathname || "/");
    if (/[?#]/.test(raw)) {
      return null;
    }
    var path = raw.replace(/\/index\.html$/, "/");
    if (!path.endsWith("/")) {
      path += "/";
    }
    return path;
  }

  function routeId(pathname) {
    var normalized = normalizePath(pathname);
    return normalized ? measuredRoutes[normalized] || null : null;
  }

  function pagePath(pathname) {
    var normalized = normalizePath(pathname);
    if (!normalized || !measuredRoutes[normalized]) {
      return null;
    }
    var relative = normalized.slice(sitePrefix.length);
    return relative || "/";
  }

  function fixedAttribution(search, referrer) {
    var params = new URLSearchParams(String(search || ""));
    var rawSource = String(params.get("utm_source") || "").toLowerCase();
    var source = allowedSources[rawSource] || null;

    if (!source && referrer) {
      try {
        var hostname = new URL(referrer).hostname.toLowerCase();
        source = referrerSources[hostname] ||
          (hostname && hostname !== productionHost ? "external" : null);
      } catch (_error) {
        source = "external";
      }
    }

    source = source || "direct";
    var labels = ["source." + source];
    var campaign = allowedCampaigns[
      String(params.get("utm_campaign") || "").toLowerCase()
    ];
    var content = allowedContents[
      String(params.get("utm_content") || "").toLowerCase()
    ];
    if (campaign) {
      labels.push("campaign." + campaign);
    }
    if (content) {
      labels.push("content." + content);
    }
    return labels.join("/");
  }

  function registryApi(explicitRegistry) {
    return explicitRegistry || window.LTWStorefrontRegistry || null;
  }

  function storeIdentity(url, registry) {
    var offerId;
    try {
      offerId = registry.findOfferIdByUrl(url.toString());
    } catch (_error) {
      return null;
    }
    if (!offerId || !registry.offers[offerId]) {
      return null;
    }

    var candidate = new URL(url.toString());
    candidate.search = "";
    candidate.hash = "";
    var canonicalCandidate = candidate.toString().replace(/\/$/, "");
    var stores = registry.offers[offerId].stores || {};
    for (var storeId in stores) {
      if (!Object.prototype.hasOwnProperty.call(stores, storeId)) {
        continue;
      }
      var state = stores[storeId];
      if (state.status !== "public" || !state.url) {
        continue;
      }
      var canonicalStore = new URL(state.url).toString().replace(/\/$/, "");
      if (canonicalStore === canonicalCandidate) {
        return { offerId: offerId, storeId: storeId };
      }
    }
    return null;
  }

  function classifyLink(href, currentPathname, explicitRegistry) {
    var currentRoute = routeId(currentPathname);
    if (!currentRoute) {
      return null;
    }

    var url;
    try {
      url = new URL(href, "https://" + productionHost + currentPathname);
    } catch (_error) {
      return null;
    }

    var registry = registryApi(explicitRegistry);
    var normalized = normalizePath(url.pathname);
    if (
      url.hostname === productionHost &&
      normalized === "/loot-drop-calculator/buy/"
    ) {
      var requestedOffer = String(url.searchParams.get("offer") || "");
      if (!registry || !registry.offers || !registry.offers[requestedOffer]) {
        return null;
      }
      return {
        event: "paid-intent." + requestedOffer + ".from." + currentRoute,
        title: "Paid intent: " + requestedOffer
      };
    }

    if (registry && url.hostname !== productionHost) {
      var identity = storeIdentity(url, registry);
      if (!identity) {
        return null;
      }
      return {
        event:
          "store-outbound." + identity.storeId + "." + identity.offerId +
          ".from." + currentRoute,
        title: "Store outbound: " + identity.storeId + " / " + identity.offerId
      };
    }

    if (url.hostname !== productionHost) {
      return null;
    }

    if (
      normalized ===
      "/loot-drop-calculator/downloads/gullwatch-beacon-play-tonight-kit-v1.zip/"
    ) {
      return {
        event: "download.gullwatch-beacon.from." + currentRoute,
        title: "Download: Gullwatch Beacon"
      };
    }
    if (
      normalized ===
      "/loot-drop-calculator/press-kit/loot-table-works-press-facts.txt/"
    ) {
      return {
        event: "download.press-facts.from." + currentRoute,
        title: "Download: press facts"
      };
    }
    if (normalized === "/loot-drop-calculator/campaign-workspace/") {
      return {
        event: "handoff.campaign-workspace.from." + currentRoute,
        title: "Workflow handoff: Campaign Workspace"
      };
    }
    if (normalized === "/loot-drop-calculator/choose-world-foundry-module/") {
      return {
        event: "handoff.module-selector.from." + currentRoute,
        title: "Workflow handoff: module selector"
      };
    }
    if (normalized === "/loot-drop-calculator/connected-record-proof/") {
      return {
        event: "handoff.connected-record-proof.from." + currentRoute,
        title: "Proof handoff: connected record"
      };
    }
    return null;
  }

  function markFixedEvents(source) {
    var links = document.querySelectorAll("a[href]");
    Array.prototype.forEach.call(links, function (link) {
      var eventRecord = classifyLink(link.href, location.pathname);
      if (!eventRecord) {
        return;
      }
      link.setAttribute("data-goatcounter-click", eventRecord.event);
      link.setAttribute("data-goatcounter-title", eventRecord.title);
      link.setAttribute("data-goatcounter-referrer", source);
    });
  }

  function ownerOptedOut() {
    try {
      return localStorage.getItem("ltw_metrics_opt_out") === "1";
    } catch (_error) {
      return true;
    }
  }

  function appearsAutomated() {
    var userAgent = navigator && navigator.userAgent
      ? String(navigator.userAgent)
      : "";
    return /bot|crawler|spider|headless|lighthouse|pagespeed|slurp|preview/i.test(
      userAgent
    );
  }

  function shouldLoad() {
    if (!/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(endpoint)) {
      return false;
    }
    if (location.hostname !== productionHost || !routeId(location.pathname)) {
      return false;
    }
    if (new URLSearchParams(location.search).get("ltw_qa") === "1") {
      return false;
    }
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") {
      return false;
    }
    return !ownerOptedOut() && !appearsAutomated();
  }

  function sendEvent(eventRecord) {
    return new Promise(function (resolve) {
      if (!active || !eventRecord || !/^[-_a-z0-9.]+$/.test(eventRecord.event)) {
        resolve(false);
        return;
      }
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        try {
          window.goatcounter.count({
            path: eventRecord.event,
            title: eventRecord.title,
            event: true,
            referrer: fixedAttribution(location.search, document.referrer)
          });
          resolve(true);
        } catch (_error) {
          resolve(false);
        }
        return;
      }
      eventQueue.push({ eventRecord: eventRecord, resolve: resolve });
    });
  }

  function flushEvents(success) {
    var pending = eventQueue.splice(0);
    pending.forEach(function (queued) {
      if (!success) {
        queued.resolve(false);
        return;
      }
      sendEvent(queued.eventRecord).then(queued.resolve);
    });
  }

  function recordCheckoutRedirect(storeId, offerId, explicitRegistry) {
    var registry = registryApi(explicitRegistry);
    var offer = registry && registry.offers ? registry.offers[offerId] : null;
    var state = offer && offer.stores ? offer.stores[storeId] : null;
    if (!state || state.status !== "public") {
      return Promise.resolve(false);
    }
    return sendEvent({
      event: "checkout-redirect." + storeId + "." + offerId,
      title: "Checkout redirect: " + storeId + " / " + offerId
    });
  }

  var api = Object.freeze({
    classifyLink: classifyLink,
    fixedAttribution: fixedAttribution,
    pagePath: pagePath,
    recordCheckoutRedirect: recordCheckoutRedirect,
    routeId: routeId,
    shouldLoad: shouldLoad
  });
  window.LTWPrivacyMetrics = api;

  active = shouldLoad();
  if (!active) {
    return;
  }

  var source = fixedAttribution(location.search, document.referrer);
  markFixedEvents(source);
  if (typeof document.addEventListener === "function") {
    document.addEventListener("click", function (event) {
      var target = event.target && typeof event.target.closest === "function"
        ? event.target.closest("a[href]")
        : null;
      if (!target) {
        return;
      }
      var eventRecord = classifyLink(target.href, location.pathname);
      if (eventRecord) {
        sendEvent(eventRecord);
      }
    }, true);
  }

  window.goatcounter = {
    path: pagePath(location.pathname),
    referrer: source,
    no_events: true
  };

  var vendor = document.createElement("script");
  vendor.async = true;
  vendor.src = vendorSource;
  vendor.crossOrigin = "anonymous";
  vendor.integrity = vendorIntegrity;
  vendor.dataset.goatcounter = endpoint;
  vendor.onload = function () { flushEvents(true); };
  vendor.onerror = function () { flushEvents(false); };
  document.head.appendChild(vendor);
})();
