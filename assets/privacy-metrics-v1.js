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

  var measuredRoutes = Object.freeze({
    "/loot-drop-calculator/": "front-door",
    "/loot-drop-calculator/world-foundry/": "world-foundry",
    "/loot-drop-calculator/gullwatch-beacon/": "gullwatch-beacon",
    "/loot-drop-calculator/gullwatch-aftermath/": "gullwatch-aftermath",
    "/loot-drop-calculator/choose-world-foundry-module/": "module-selector",
    "/loot-drop-calculator/connected-record-proof/": "connected-record-proof",
    "/loot-drop-calculator/press-kit/": "press-kit"
  });

  var allowedSources = Object.freeze({
    bluesky: "bluesky",
    github: "github",
    instagram: "instagram",
    mastodon: "mastodon",
    pinterest: "pinterest",
    press_kit: "press-kit",
    tabletop_gaming_news: "tabletop-gaming-news",
    tiktok: "tiktok",
    youtube: "youtube",
    owned_site: "owned-site",
    owned_web: "owned-web",
    free_rpg_tools: "free-rpg-tools",
    integration_guides: "integration-guides",
    world_foundry_hub: "world-foundry-hub",
    world_foundry_selector: "world-foundry-selector",
    run_one_shot_guide: "run-one-shot-guide"
  });

  var referrerSources = Object.freeze({
    "bsky.app": "bluesky",
    "github.com": "github",
    "instagram.com": "instagram",
    "www.instagram.com": "instagram",
    "mastodon.social": "mastodon",
    "pinterest.com": "pinterest",
    "www.pinterest.com": "pinterest",
    "tiktok.com": "tiktok",
    "www.tiktok.com": "tiktok",
    "youtube.com": "youtube",
    "www.youtube.com": "youtube"
  });

  var paidModules = Object.freeze({
    "/original-fantasy-item-data-pack": "item-catalog",
    "/fantasy-merchant-shop-generator-kit": "merchant-shop",
    "/fantasy-crafting-alchemy-recipe-kit": "crafting-recipe",
    "/enemy-loot-table-drop-profile-kit": "enemy-loot",
    "/fantasy-quest-contract-reward-data-kit": "quest-contract",
    "/fantasy-encounter-room-data-kit": "encounter-threat"
  });

  function normalizePath(pathname) {
    var path = String(pathname || "/").replace(/\/index\.html$/, "/");
    if (!path.endsWith("/")) {
      path += "/";
    }
    return path;
  }

  function routeId(pathname) {
    return measuredRoutes[normalizePath(pathname)] || null;
  }

  function pagePath(pathname) {
    var normalized = normalizePath(pathname);
    if (!measuredRoutes[normalized]) {
      return null;
    }
    var relative = normalized.slice(sitePrefix.length);
    return relative || "/";
  }

  function sourceLabel(search, referrer) {
    var params = new URLSearchParams(String(search || ""));
    var source = String(params.get("utm_source") || "").toLowerCase();
    if (allowedSources[source]) {
      return "source." + allowedSources[source];
    }

    if (referrer) {
      try {
        var hostname = new URL(referrer).hostname.toLowerCase();
        if (referrerSources[hostname]) {
          return "source." + referrerSources[hostname];
        }
        if (hostname && hostname !== productionHost) {
          return "source.external";
        }
      } catch (_error) {
        return "source.external";
      }
    }
    return "source.direct";
  }

  function classifyLink(href, currentPathname) {
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

    if (url.hostname === "loot-table-works.itch.io") {
      var moduleId = paidModules[url.pathname.replace(/\/$/, "")];
      if (!moduleId) {
        return null;
      }
      return {
        event: "paid." + moduleId + ".from." + currentRoute,
        title: "Paid listing: " + moduleId
      };
    }

    if (url.hostname !== productionHost) {
      return null;
    }

    var normalized = normalizePath(url.pathname);
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

  function shouldLoad() {
    if (
      !/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(endpoint)
    ) {
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
    return !ownerOptedOut();
  }

  var api = Object.freeze({
    classifyLink: classifyLink,
    pagePath: pagePath,
    routeId: routeId,
    sourceLabel: sourceLabel,
    shouldLoad: shouldLoad
  });
  window.LTWPrivacyMetrics = api;

  if (!shouldLoad()) {
    return;
  }

  var source = sourceLabel(location.search, document.referrer);
  markFixedEvents(source);
  window.goatcounter = {
    path: pagePath(location.pathname),
    referrer: source
  };

  var vendor = document.createElement("script");
  vendor.async = true;
  vendor.src = vendorSource;
  vendor.crossOrigin = "anonymous";
  vendor.integrity = vendorIntegrity;
  vendor.dataset.goatcounter = endpoint;
  document.head.appendChild(vendor);
})();
