"use strict";

const MODULES = {
  items: {
    code: "WF-01 / Foundation",
    title: "Item Catalog & Economy Kit",
    reason: {
      "game-developer": "Start with the stable records every other World Foundry system references.",
      "game-master": "Start with a searchable item library that can supply treasure, shops, crafting hooks, and quest rewards.",
      "tool-builder": "Start with the canonical schema and stable IDs used throughout the connected module line."
    },
    cover: "assets/item-catalog-cover.png",
    coverAlt: "World Foundry Item Catalog and Economy Kit cover.",
    proof: [["500", "items"], ["100", "mapped icons"], ["2", "offline tools"]],
    capabilities: [
      "Browse and filter complete item records.",
      "Build reproducible collections for loot, shops, crafting, or quests.",
      "Export JSON or CSV and load records into supported engines."
    ],
    dependency: "<strong>No other World Foundry module required.</strong> This is the canonical foundation for the connected module line.",
    boundary: "Structured item data, 100 mapped inventory icons, four sprite sheets, and offline workflow tools. No maps, audio, hosted service, or rules-specific stat blocks.",
    url: "../buy/?offer=item&utm_source=module_selector&utm_medium=owned_web&utm_campaign=standalone_modules&utm_content=item_catalog"
  },
  merchants: {
    code: "WF-02 / Commerce",
    title: "Merchant & Shop Kit",
    reason: {
      "game-developer": "Use this when shop inventory, regional identity, and inspectable pricing are the immediate production bottleneck.",
      "game-master": "Use this when you need complete sellers and reproducible stock instead of another list of disconnected shop prompts.",
      "tool-builder": "Use this for stable merchant-to-item relationships, transparent pricing inputs, and exportable stock records."
    },
    cover: "assets/merchant-shop-cover.png",
    coverAlt: "World Foundry Merchant and Shop Kit cover.",
    proof: [["150", "merchants"], ["1,500", "stock links"], ["2", "offline tools"]],
    capabilities: [
      "Browse complete merchant dossiers and region-matched stock.",
      "Simulate demand, reputation discounts, and restock scenarios.",
      "Export nested JSON, flattened CSV, or supported engine models."
    ],
    dependency: "<strong>Uses stable Item Catalog IDs.</strong> Pair with WF-01 for the complete item-and-shop workflow, or map the references to your own item system.",
    boundary: "Structured merchant and stock data. No merchant portraits, shop maps, interface art, audio, or rules-specific stat blocks.",
    url: "../buy/?offer=merchant&utm_source=module_selector&utm_medium=owned_web&utm_campaign=standalone_modules&utm_content=merchant_shop"
  },
  crafting: {
    code: "WF-03 / Crafting",
    title: "Crafting & Recipe Kit",
    reason: {
      "game-developer": "Use this when ingredients, outputs, costs, yields, and production balance need one inspectable contract.",
      "game-master": "Use this when crafting should create playable sourcing choices rather than remain background flavor.",
      "tool-builder": "Use this for normalized recipe records and stable ingredient/output joins across six disciplines."
    },
    cover: "assets/crafting-recipe-cover.png",
    coverAlt: "World Foundry Crafting and Recipe Kit cover.",
    proof: [["300", "recipes"], ["900", "ingredient links"], ["6", "disciplines"]],
    capabilities: [
      "Browse recipes across alchemy, artifice, enchanting, smithing, survival, and tailoring.",
      "Simulate cost, yield, failure rate, and expected output.",
      "Export JSON, CSV, or supported engine models."
    ],
    dependency: "<strong>Uses stable Item Catalog IDs.</strong> Pair with WF-01 for complete ingredients and outputs, or map those IDs to your own item records.",
    boundary: "Structured recipe data and workflow tools. No crafting icons, animations, interface art, audio, or rules-specific crafting mechanics.",
    url: "../buy/?offer=recipe&utm_source=module_selector&utm_medium=owned_web&utm_campaign=standalone_modules&utm_content=crafting_recipes"
  },
  loot: {
    code: "WF-04 / Rewards",
    title: "Enemy Loot & Reward Kit",
    reason: {
      "game-developer": "Use this when reward probabilities and tier progression must be testable before they reach players.",
      "game-master": "Use this when enemy rewards need repeatable logic, visible odds, and room to tune the campaign economy.",
      "tool-builder": "Use this for normalized weighted, guaranteed, and conditional reward records with deterministic simulation."
    },
    cover: "assets/enemy-loot-cover.png",
    coverAlt: "World Foundry Enemy Loot and Reward Kit cover.",
    proof: [["250", "profiles"], ["2,000", "rewards"], ["3", "offline tools"]],
    capabilities: [
      "Browse enemy profiles and every connected reward record.",
      "Run seeded drop simulations and inspect exact probabilities.",
      "Audit five-tier reward curves before integrating the data."
    ],
    dependency: "<strong>Uses stable Item Catalog IDs.</strong> Pair with WF-01 for complete reward records, or map the reward references to your own items.",
    boundary: "Structured loot and reward data. No enemy art, tokens, animations, audio, or rules-specific combat statistics.",
    url: "../buy/?offer=loot&utm_source=module_selector&utm_medium=owned_web&utm_campaign=standalone_modules&utm_content=enemy_loot"
  },
  quests: {
    code: "WF-05 / Campaigns",
    title: "Quest, Contract & Reward Kit",
    reason: {
      "game-developer": "Use this when quest continuity, branching consequences, and durable campaign state must survive beyond one prompt.",
      "game-master": "Use this when you need staged contracts, location arcs, alternative resolutions, and consequences ready for campaign preparation.",
      "tool-builder": "Use this for linked quest records, deterministic successor evidence, and machine-readable campaign state operations."
    },
    cover: "assets/quest-kit-cover.png",
    coverAlt: "World Foundry Quest, Contract and Reward Kit cover.",
    proof: [["240", "quests"], ["40", "location arcs"], ["720", "successor links"]],
    capabilities: [
      "Browse complete quest dossiers and their referenced evidence.",
      "Build deterministic three-to-five-step campaign chains.",
      "Track queued, active, resolved, and failed contract state."
    ],
    dependency: "<strong>Includes all 40 locations and cached reference summaries.</strong> Canonical item, merchant, stock, and recipe IDs remain external; pair modules or map them to your systems.",
    boundary: "Structured quest, location, and campaign-preparation data. No character art, maps, tokens, voice acting, encounter statistics, or protected game rules.",
    url: "../buy/?offer=quest&utm_source=module_selector&utm_medium=owned_web&utm_campaign=standalone_modules&utm_content=quest_contracts"
  },
  encounters: {
    code: "WF-06 / Play",
    title: "Encounter & Threat Kit",
    reason: {
      "game-developer": "Use this when encounter phases, threat evidence, outcomes, and state transitions need a consistent production model.",
      "game-master": "Use this when you need phase-based scenes and adjustable threats rather than isolated room prompts.",
      "tool-builder": "Use this for encounter state operations, threat-budget inputs, sequence evidence, and deterministic exports."
    },
    cover: "assets/encounter-kit-cover.png",
    coverAlt: "World Foundry Encounter and Threat Kit cover.",
    proof: [["180", "encounters"], ["540", "phases"], ["1,800", "state operations"]],
    capabilities: [
      "Browse three-phase encounters and complete reference evidence.",
      "Adjust enemy counts and recalculate threat budgets.",
      "Build and progress deterministic three-to-five-encounter sequences."
    ],
    dependency: "<strong>Complete encounter records are included.</strong> Canonical Item, Quest, Location, and Loot Profile IDs refer to other modules; pair them or map the references.",
    boundary: "Structured encounter and threat-preparation data. No maps, tiles, tokens, character art, animations, audio, hosted service, or rules-specific stat blocks.",
    url: "../buy/?offer=encounter&utm_source=module_selector&utm_medium=owned_web&utm_campaign=standalone_modules&utm_content=encounter_threats"
  }
};

const WORKFLOW_NOTES = {
  offline: "Best fit for offline exploration and export. Everything runs locally with no account, network connection, subscription, or paid API.",
  engine: "Includes structured JSON and CSV plus integration starters for Unity, Godot 4, and TypeScript. Review the schema before production import.",
  tabletop: "Use the offline browser, simulator, studio, or state board during preparation. The content is system-neutral, so adapt mechanics to your table."
};

const CHECKOUT_OFFER_IDS = Object.freeze({
  items: "item",
  merchants: "merchant",
  crafting: "recipe",
  loot: "loot",
  quests: "quest",
  encounters: "encounter"
});

function safeAttributionValue(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function incomingAttributionTerm() {
  const query = new URLSearchParams(window.location.search);
  const source = safeAttributionValue(query.get("utm_source"));
  const content = safeAttributionValue(query.get("utm_content"));

  if (!source || source === "module_selector") {
    return "";
  }

  return `origin_${[source, content].filter(Boolean).join("_")}`;
}

const attributionTerm = incomingAttributionTerm();

function attributedPaidUrl(rawUrl) {
  const url = new URL(rawUrl, window.location.href);
  if (attributionTerm) {
    url.searchParams.set("utm_term", attributionTerm);
  }
  return url.toString();
}

const elements = {
  code: document.querySelector("#result-code"),
  title: document.querySelector("#result-title"),
  reason: document.querySelector("#result-reason"),
  cover: document.querySelector("#result-cover"),
  proof: document.querySelector("#result-proof"),
  capabilities: document.querySelector("#result-capabilities"),
  dependency: document.querySelector("#result-dependency"),
  workflow: document.querySelector("#result-workflow"),
  boundary: document.querySelector("#result-boundary"),
  link: document.querySelector("#result-link"),
  itemDemo: document.querySelector("#item-demo-callout")
};

function selectedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function renderRecommendation() {
  const moduleId = selectedValue("problem");
  const module = MODULES[moduleId];
  const audience = selectedValue("audience");
  const workflow = selectedValue("workflow");

  elements.code.textContent = module.code;
  elements.title.textContent = module.title;
  elements.reason.textContent = module.reason[audience];
  elements.cover.src = module.cover;
  elements.cover.alt = module.coverAlt;
  elements.proof.replaceChildren(...module.proof.map(([value, label]) => {
    const item = document.createElement("span");
    const strong = document.createElement("strong");
    strong.textContent = value;
    item.append(strong, ` ${label}`);
    return item;
  }));
  elements.capabilities.replaceChildren(...module.capabilities.map((capability) => {
    const item = document.createElement("li");
    item.textContent = capability;
    return item;
  }));
  elements.dependency.innerHTML = module.dependency;
  elements.workflow.textContent = WORKFLOW_NOTES[workflow];
  elements.boundary.textContent = module.boundary;
  elements.link.href = attributedPaidUrl(module.url);
  elements.link.dataset.offerId = CHECKOUT_OFFER_IDS[moduleId];
  elements.itemDemo.hidden = selectedValue("problem") !== "items";
}

document.querySelectorAll('#compare a[data-link-kind="marketplace-checkout"]').forEach((link) => {
  link.href = attributedPaidUrl(link.href);
});
document.querySelector(".selector-controls").addEventListener("change", renderRecommendation);
renderRecommendation();
