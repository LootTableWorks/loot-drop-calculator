(function attachCampaignLaunchpadCore(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CampaignLaunchpadCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCampaignLaunchpadCore() {
  "use strict";

  const BASE = "https://loottableworks.github.io/loot-drop-calculator";
  const CAMPAIGN = "campaign_launchpad_v1";

  const PRODUCTS = Object.freeze({
    items: Object.freeze({ id: "items", code: "WF-01", title: "Item Catalog & Economy Kit", proof: "500 original items", value: "Equip rewards, shops, quests, and character signatures from one stable catalog.", url: "https://loot-table-works.itch.io/original-fantasy-item-data-pack" }),
    merchants: Object.freeze({ id: "merchants", code: "WF-02", title: "Merchant & Shop Kit", proof: "150 merchants", value: "Put witnesses, suppliers, rivals, and useful stock inside the party's route.", url: "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit" }),
    recipes: Object.freeze({ id: "recipes", code: "WF-03", title: "Crafting & Recipe Kit", proof: "300 recipes", value: "Turn salvage, field supplies, and scarce rewards into decisions between sessions.", url: "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit" }),
    loot: Object.freeze({ id: "loot", code: "WF-04", title: "Enemy Loot & Reward Kit", proof: "250 reward profiles", value: "Give dangerous opposition reproducible rewards with inspectable probabilities.", url: "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit" }),
    quests: Object.freeze({ id: "quests", code: "WF-05", title: "Quest, Contract & Reward Kit", proof: "240 quests", value: "Add patrons, objectives, complications, and rewards that connect to stable IDs.", url: "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit" }),
    encounters: Object.freeze({ id: "encounters", code: "WF-06", title: "Encounter & Threat Kit", proof: "180 encounters", value: "Drop in three-phase encounters with telegraphs, state changes, and threat evidence.", url: "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit" })
  });

  const SCOPES = Object.freeze({
    tonight: Object.freeze({ label: "One night", sessions: 3, duration: 120, pressure: "measured", threat: "forgiving", scale: "district", summary: "A focused opening session with a clean path into a short follow-up arc." }),
    full_evening: Object.freeze({ label: "Full evening", sessions: 3, duration: 180, pressure: "escalating", threat: "standard", scale: "district", summary: "A complete five-scene adventure with room for character and consequence beats." }),
    mini_arc: Object.freeze({ label: "Mini arc", sessions: 6, duration: 180, pressure: "escalating", threat: "standard", scale: "region", summary: "A six-session arc with three faction fronts and enough space for relationships to move." }),
    campaign: Object.freeze({ label: "Campaign", sessions: 9, duration: 240, pressure: "relentless", threat: "dangerous", scale: "region", summary: "A nine-session campaign frame with sustained pressure, evolving stakes, and long-form continuity." })
  });

  const SPOTLIGHTS = Object.freeze({
    exploration: Object.freeze({
      label: "Exploration",
      promise: "Cross unstable ground, protect a route, and bring back evidence before access closes.",
      oneShotTone: "heroic", campaignTone: "heroic", characterMode: "expedition", characterTone: "hopeful", cohesion: "trusted_company",
      products: ["encounters", "quests", "items"], modules: ["items", "quests", "encounters"]
    }),
    intrigue: Object.freeze({
      label: "Intrigue",
      promise: "Untangle competing claims, unreliable witnesses, and obligations that change who holds leverage.",
      oneShotTone: "mystery", campaignTone: "intrigue", characterMode: "intrigue", characterTone: "mysterious", cohesion: "uneasy_alliance",
      products: ["quests", "merchants", "items"], modules: ["items", "merchants", "quests"]
    }),
    survival: Object.freeze({
      label: "Survival",
      promise: "Manage a degrading route, scarce supplies, dangerous opposition, and the cost of getting home.",
      oneShotTone: "peril", campaignTone: "grounded", characterMode: "recovery", characterTone: "grounded", cohesion: "new_crew",
      products: ["encounters", "loot", "recipes"], modules: ["recipes", "loot_profiles", "encounters"]
    })
  });

  function clampInteger(value, minimum, maximum, fallback) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
  }

  function normalizeOptions(input = {}) {
    const seed = String(input.seed || "salt-road-27").trim().slice(0, 64) || "salt-road-27";
    const scope = SCOPES[input.scope] ? input.scope : "full_evening";
    const spotlight = SPOTLIGHTS[input.spotlight] ? input.spotlight : "exploration";
    const party = clampInteger(input.party, 3, 6, 4);
    const tier = clampInteger(input.tier, 1, 5, 2);
    return Object.freeze({ seed, scope, spotlight, party, tier });
  }

  function hash(text) {
    let value = 2166136261;
    for (const character of String(text)) {
      value ^= character.charCodeAt(0);
      value = Math.imul(value, 16777619);
    }
    return (value >>> 0).toString(16).padStart(8, "0");
  }

  function toolUrl(path, functional, content) {
    const url = new URL(`${BASE}/${path}`);
    for (const [key, value] of Object.entries(functional)) url.searchParams.set(key, String(value));
    url.searchParams.set("utm_source", "campaign_launchpad");
    url.searchParams.set("utm_medium", "guided_workflow");
    url.searchParams.set("utm_campaign", CAMPAIGN);
    url.searchParams.set("utm_content", content);
    return url.toString();
  }

  function productUrl(product, spotlight) {
    const url = new URL(product.url);
    url.searchParams.set("utm_source", "campaign_launchpad");
    url.searchParams.set("utm_medium", "guided_recommendation");
    url.searchParams.set("utm_campaign", CAMPAIGN);
    url.searchParams.set("utm_content", `${spotlight}_${product.id}`);
    return url.toString();
  }

  function buildTools(options, scope, spotlight) {
    const common = { seed: options.seed, party: options.party, tier: options.tier };
    return [
      Object.freeze({ step: 1, id: "world", title: "Frame the region", outcome: "A dependency-closed place, active pressure, and usable world brief.", cta: "Open World Seed Studio", url: toolUrl("world-seed-studio/", { seed: options.seed, scale: scope.scale, view: "gm", tier: options.tier, modules: spotlight.modules.join(",") }, "world_seed") }),
      Object.freeze({ step: 2, id: "party", title: "Forge the company", outcome: `${options.party} linked characters with stakes, bonds, burdens, and signature items.`, cta: "Open Character Foundry", url: toolUrl("character-foundry/", { ...common, campaign: spotlight.characterMode, tone: spotlight.characterTone, cohesion: spotlight.cohesion }, "character_foundry") }),
      Object.freeze({ step: 3, id: "session", title: "Prepare the opening session", outcome: `${scope.duration} minutes across five timed scenes with clues, opposition, rewards, and pregens.`, cta: "Open One-Shot Forge", url: toolUrl("one-shot-forge/", { ...common, tone: spotlight.oneShotTone, threat: scope.threat, duration: scope.duration }, "one_shot_forge") }),
      Object.freeze({ step: 4, id: "arc", title: "Extend the consequences", outcome: `${scope.sessions} linked sessions with three acts, faction clocks, character stakes, and outcomes.`, cta: "Open Campaign Arc Forge", url: toolUrl("campaign-arc-forge/", { ...common, sessions: scope.sessions, tone: spotlight.campaignTone, pressure: scope.pressure }, "campaign_arc_forge") }),
      Object.freeze({ step: 5, id: "chronicle", title: "Carry one character forward", outcome: "Track consequences, downtime, bonds, strain, reputation, and the next intention.", cta: "Open Player Chronicle", url: toolUrl("player-chronicle/", { seed: options.seed }, "player_chronicle") })
    ];
  }

  function generate(input = {}) {
    const options = normalizeOptions(input);
    const scope = SCOPES[options.scope];
    const spotlight = SPOTLIGHTS[options.spotlight];
    const products = spotlight.products.map((id) => {
      const product = PRODUCTS[id];
      return Object.freeze({ ...product, tracked_url: productUrl(product, options.spotlight) });
    });
    const tools = buildTools(options, scope, spotlight);
    return Object.freeze({
      generator: "Loot Table Works Campaign Launchpad",
      version: "1.0.0",
      plan_id: `CL-${hash(`${options.seed}|${options.scope}|${options.spotlight}|${options.party}|${options.tier}`)}`,
      options,
      title: `${spotlight.label} ${scope.label.toLowerCase()} for ${options.party} players`,
      promise: spotlight.promise,
      scope_summary: scope.summary,
      tools,
      products,
      paid_total_usd: products.length * 3,
      validation: Object.freeze({ valid: tools.length === 5 && products.length === 3 && new Set(products.map((product) => product.id)).size === 3, free_tool_routes: tools.length, paid_destinations: products.length, gated_destinations: 0 })
    });
  }

  function toMarkdown(plan) {
    const lines = [
      `# ${plan.title}`,
      "",
      `**Plan:** ${plan.plan_id}`,
      `**Seed:** ${plan.options.seed}`,
      `**Party / tier:** ${plan.options.party} players / tier ${plan.options.tier}`,
      "",
      plan.promise,
      "",
      "## Launch sequence",
      ""
    ];
    for (const tool of plan.tools) lines.push(`${tool.step}. [${tool.title}](${tool.url}) - ${tool.outcome}`);
    lines.push("", "## Optional production data", "");
    for (const product of plan.products) lines.push(`- [${product.title}](${product.tracked_url}) - ${product.proof}. ${product.value}`);
    lines.push("", "The free tools work without these purchases. Each optional module is a separate $3 standalone product.");
    return lines.join("\n");
  }

  return { PRODUCTS, SCOPES, SPOTLIGHTS, normalizeOptions, generate, toMarkdown };
});
