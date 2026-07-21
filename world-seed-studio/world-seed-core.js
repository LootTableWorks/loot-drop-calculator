(function attachWorldSeedCore(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.WorldSeedCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createWorldSeedCore() {
  "use strict";

  const MODULES = ["items", "merchants", "recipes", "quests", "locations", "loot_profiles", "encounters"];
  const PRESETS = Object.freeze({
    full_world: Object.freeze({
      label: "Full world",
      modules: Object.freeze([...MODULES])
    }),
    town_economy: Object.freeze({
      label: "Town economy",
      modules: Object.freeze(["items", "merchants", "recipes", "locations"])
    }),
    quest_arc: Object.freeze({
      label: "Quest arc",
      modules: Object.freeze(["items", "merchants", "recipes", "quests", "locations", "loot_profiles"])
    }),
    encounter_loop: Object.freeze({
      label: "Encounter loop",
      modules: Object.freeze(["items", "quests", "locations", "loot_profiles", "encounters"])
    })
  });
  const PRODUCTS = Object.freeze([
    Object.freeze({
      id: "items",
      module: "items",
      title: "Item Catalog & Economy Kit",
      proof: "500 items",
      description: "Stable item IDs, economy fields, collection builder, JSON, CSV, and engine loaders.",
      url: "https://loot-table-works.itch.io/original-fantasy-item-data-pack"
    }),
    Object.freeze({
      id: "merchants",
      module: "merchants",
      title: "Merchant & Shop Kit",
      proof: "150 merchants",
      description: "1,500 canonical stock links, reproducible restocks, economy simulator, JSON, and CSV.",
      url: "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit"
    }),
    Object.freeze({
      id: "recipes",
      module: "recipes",
      title: "Crafting & Recipe Kit",
      proof: "300 recipes",
      description: "900 ingredient links, 300 outputs, cost and yield simulator, JSON, and CSV.",
      url: "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit"
    }),
    Object.freeze({
      id: "loot_profiles",
      module: "loot_profiles",
      title: "Enemy Loot & Reward Kit",
      proof: "250 profiles",
      description: "2,000 reward records, exact probabilities, Monte Carlo testing, and reward curves.",
      url: "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit"
    }),
    Object.freeze({
      id: "quests",
      module: "quests",
      title: "Quest, Contract & Reward Kit",
      proof: "240 quests",
      description: "40 six-quest arcs, state operations, campaign chain builder, JSON, and CSV.",
      url: "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit"
    }),
    Object.freeze({
      id: "encounters",
      module: "encounters",
      title: "Encounter & Threat Kit",
      proof: "180 encounters",
      description: "Three-phase encounters, threat budgets, state board, reward evidence, JSON, and CSV.",
      url: "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit"
    })
  ]);
  const PRODUCT_BY_MODULE = new Map(PRODUCTS.map((product) => [product.module, product]));
  const RECOMMENDATION_PRIORITY = ["encounters", "quests", "merchants", "recipes", "loot_profiles", "items"];
  const ID_FIELDS = {
    items: "id",
    merchants: "merchant_id",
    recipes: "recipe_id",
    quests: "quest_id",
    locations: "location_id",
    loot_profiles: "profile_id",
    encounters: "encounter_id"
  };
  const ENTITY_MODULE = {
    item: "items",
    merchant: "merchants",
    recipe: "recipes",
    quest: "quests",
    location: "locations",
    loot_profile: "loot_profiles",
    encounter: "encounters"
  };
  const SCALE_LIMITS = {
    outpost: { items: 10, merchants: 2, recipes: 2, quests: 2, locations: 1, loot_profiles: 3, encounters: 1 },
    district: { items: 20, merchants: 4, recipes: 3, quests: 4, locations: 1, loot_profiles: 6, encounters: 3 },
    region: Object.fromEntries(MODULES.map((moduleId) => [moduleId, Number.POSITIVE_INFINITY]))
  };
  const TITLE_PREFIXES = ["Saltwake", "Brineward", "Stormglass", "Tidewatch", "Gullward", "Lanternshore", "Reefbound", "Wavebreak"];
  const TITLE_SUFFIXES = ["Reach", "Coast", "Harbor", "March", "Shore", "Frontier", "Haven", "Sound"];

  function hash(text) {
    let value = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      value ^= text.charCodeAt(index);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function hexHash(text) {
    return hash(text).toString(16).padStart(8, "0");
  }

  function recordId(moduleId, record) {
    return record[ID_FIELDS[moduleId]];
  }

  function recordName(record) {
    return record.name || record.shop_name || record.recipe_name || record.title || record.enemy_name || record.encounter_name || "Unnamed record";
  }

  function tierFor(moduleId, record, itemMap) {
    if (moduleId === "recipes") return itemMap.get(record.output_item_id)?.tier || 5;
    return Number.isInteger(record.tier) ? record.tier : 1;
  }

  function deterministicRows(rows, moduleId, seed) {
    return [...rows].sort((left, right) => {
      const leftId = recordId(moduleId, left);
      const rightId = recordId(moduleId, right);
      return hash(`${seed}|${moduleId}|${leftId}`) - hash(`${seed}|${moduleId}|${rightId}`) || String(leftId).localeCompare(String(rightId));
    });
  }

  function normalizeOptions(options) {
    const seed = String(options.seed || "saltglass-31").trim() || "saltglass-31";
    const maximumTier = Number(options.maximumTier ?? options.tier ?? 5);
    const scale = options.scale || "district";
    const modules = [...new Set(options.modules || MODULES)];
    if (!Number.isInteger(maximumTier) || maximumTier < 1 || maximumTier > 5) throw new Error("maximumTier must be an integer from 1 through 5");
    if (!SCALE_LIMITS[scale]) throw new Error(`Unsupported scale: ${scale}`);
    if (!modules.length || modules.some((moduleId) => !MODULES.includes(moduleId))) throw new Error("modules must contain supported World Foundry modules");
    return { seed, maximumTier, scale, modules };
  }

  function makeMarkers(world) {
    const candidates = [];
    const add = (moduleId, record) => {
      if (!record) return;
      candidates.push({ module: moduleId, id: recordId(moduleId, record), label: recordName(record) });
    };
    add("locations", world.data.locations[0]);
    add("quests", deterministicRows(world.data.quests, "quests", world.world_seed)[0]);
    add("encounters", deterministicRows(world.data.encounters, "encounters", world.world_seed)[0]);
    deterministicRows(world.data.merchants, "merchants", world.world_seed).slice(0, 2).forEach((record) => add("merchants", record));
    return candidates.map((marker, index) => {
      const markerHash = hash(`${world.world_seed}|${marker.id}|marker`);
      const x = 16 + ((markerHash + index * 19) % 69);
      const y = 18 + (((markerHash >>> 8) + index * 23) % 63);
      return { ...marker, x, y };
    });
  }

  function assemble(rawOptions, source) {
    const options = normalizeOptions(rawOptions || {});
    if (!source || !source.data || !source.relationships) throw new Error("A World Foundry source dataset is required");

    const itemMap = new Map(source.data.items.map((item) => [item.id, item]));
    const nodeMap = new Map(source.relationships.nodes.map((node) => [node.id, node]));
    const outgoing = new Map();
    for (const edge of source.relationships.edges) {
      if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
      outgoing.get(edge.from).push(edge);
    }

    const selectedIds = new Set();
    const requestedSeedCounts = {};
    for (const moduleId of options.modules) {
      const candidates = source.data[moduleId].filter((record) => tierFor(moduleId, record, itemMap) <= options.maximumTier);
      const selected = deterministicRows(candidates, moduleId, options.seed).slice(0, SCALE_LIMITS[options.scale][moduleId]);
      requestedSeedCounts[moduleId] = selected.length;
      selected.forEach((record) => selectedIds.add(recordId(moduleId, record)));
    }

    const queue = [...selectedIds];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      for (const edge of outgoing.get(queue[cursor]) || []) {
        if (!nodeMap.has(edge.to) || selectedIds.has(edge.to)) continue;
        selectedIds.add(edge.to);
        queue.push(edge.to);
      }
    }

    const relationships = {
      nodes: source.relationships.nodes.filter((node) => selectedIds.has(node.id)),
      edges: source.relationships.edges.filter((edge) => selectedIds.has(edge.from) && selectedIds.has(edge.to))
    };
    const data = {};
    for (const moduleId of MODULES) data[moduleId] = source.data[moduleId].filter((record) => selectedIds.has(recordId(moduleId, record)));

    const nodeIds = new Set(relationships.nodes.map((node) => node.id));
    const missingReferences = relationships.edges.filter((edge) => !nodeIds.has(edge.from) || !nodeIds.has(edge.to));
    const duplicateIdCount = relationships.nodes.length - nodeIds.size;
    const titleHash = hash(options.seed);
    const title = `${TITLE_PREFIXES[titleHash % TITLE_PREFIXES.length]} ${TITLE_SUFFIXES[(titleHash >>> 8) % TITLE_SUFFIXES.length]}`;
    const counts = Object.fromEntries(MODULES.map((moduleId) => [moduleId, data[moduleId].length]));
    const world = {
      schema_version: "1.0.0",
      assembly_id: `wfs-coastal-${hexHash([options.seed, options.maximumTier, options.scale, options.modules.join(",")].join("|"))}`,
      title,
      world_seed: options.seed,
      biome: "coastal",
      maximum_tier: options.maximumTier,
      scale: options.scale,
      requested_modules: options.modules,
      resolved_modules: MODULES.filter((moduleId) => data[moduleId].length > 0),
      requested_seed_counts: requestedSeedCounts,
      counts,
      source_versions: source.source_versions || {},
      data,
      relationships,
      validation: {
        valid: missingReferences.length === 0 && duplicateIdCount === 0,
        missing_reference_count: missingReferences.length,
        missing_references: missingReferences,
        duplicate_id_count: duplicateIdCount
      }
    };
    world.recommended_start = {
      location_id: deterministicRows(data.locations, "locations", options.seed)[0]?.location_id || null,
      quest_id: deterministicRows(data.quests, "quests", options.seed)[0]?.quest_id || null,
      encounter_id: deterministicRows(data.encounters, "encounters", options.seed)[0]?.encounter_id || null
    };
    world.markers = makeMarkers(world);
    return world;
  }

  function findRecord(world, id) {
    for (const moduleId of MODULES) {
      const record = world.data[moduleId].find((entry) => recordId(moduleId, entry) === id);
      if (record) return { module: moduleId, record };
    }
    return null;
  }

  function recommendProducts(requestedModules, resolvedModules, limit = 3) {
    const requested = [...new Set(requestedModules || [])].filter((moduleId) => MODULES.includes(moduleId));
    const resolved = [...new Set(resolvedModules || requested)].filter((moduleId) => MODULES.includes(moduleId));
    const available = new Set([...requested, ...resolved]);
    if (available.has("locations")) available.add("quests");

    const primaryModule = RECOMMENDATION_PRIORITY.find((moduleId) => requested.includes(moduleId)) || (requested.includes("locations") ? "quests" : null);
    const orderedModules = [];
    const add = (moduleId) => {
      if (available.has(moduleId) && PRODUCT_BY_MODULE.has(moduleId) && !orderedModules.includes(moduleId)) orderedModules.push(moduleId);
    };

    add(primaryModule);
    if (primaryModule !== "items") add("items");
    RECOMMENDATION_PRIORITY.filter((moduleId) => requested.includes(moduleId)).forEach(add);
    if (requested.includes("locations")) add("quests");
    RECOMMENDATION_PRIORITY.forEach(add);
    PRODUCTS.forEach((product) => add(product.module));
    return orderedModules.slice(0, Math.max(0, Number(limit) || 0)).map((moduleId) => PRODUCT_BY_MODULE.get(moduleId));
  }

  function createGmBrief(world) {
    if (!world?.validation?.valid) throw new Error("A valid World Seed assembly is required");
    const location = findRecord(world, world.recommended_start.location_id);
    const quest = findRecord(world, world.recommended_start.quest_id);
    const encounter = findRecord(world, world.recommended_start.encounter_id);
    const merchant = world.data.merchants[0];
    const entry = (label, match) => `${label}: ${match ? `${recordName(match.record)} [${recordId(match.module, match.record)}]` : "Not resolved"}`;
    return [
      world.title.toUpperCase(),
      `Seed: ${world.world_seed} | Scale: ${world.scale} | Maximum tier: ${world.maximum_tier}`,
      "",
      entry("Start", location),
      entry("First contract", quest),
      entry("Escalation", encounter),
      `Local support: ${merchant ? `${recordName(merchant)} [${recordId("merchants", merchant)}]` : "Not resolved"}`,
      "",
      `Assembly: ${world.relationships.nodes.length} entities, ${world.relationships.edges.length} relationships, ${world.validation.missing_reference_count} unresolved references.`,
      `Build ID: ${world.assembly_id}`
    ].join("\n");
  }

  function worldToCsv(world) {
    if (!world?.validation?.valid) throw new Error("A valid World Seed assembly is required");
    const connectionCounts = new Map();
    for (const edge of world.relationships.edges) {
      connectionCounts.set(edge.from, (connectionCounts.get(edge.from) || 0) + 1);
      connectionCounts.set(edge.to, (connectionCounts.get(edge.to) || 0) + 1);
    }
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [["module", "id", "name", "tier", "connections"]];
    for (const moduleId of MODULES) {
      for (const record of world.data[moduleId]) {
        const id = recordId(moduleId, record);
        rows.push([moduleId, id, recordName(record), record.tier || "", connectionCounts.get(id) || 0]);
      }
    }
    return rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  }

  return { MODULES, PRESETS, PRODUCTS, ID_FIELDS, ENTITY_MODULE, SCALE_LIMITS, hash, recordId, recordName, assemble, findRecord, recommendProducts, createGmBrief, worldToCsv };
});
