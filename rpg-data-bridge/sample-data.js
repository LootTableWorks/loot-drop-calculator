(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RpgDataBridgeSample = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const data = {
    world_meta: {
      world_id: "world-emberline",
      "display-name": "The Emberline Marches",
      class: "frontier_fantasy",
      "3d_model": null,
      release: 1
    },
    items: [
      {
        item_id: "item-emberglass-vial",
        name: "Emberglass Vial",
        rarity: "uncommon",
        tags: ["alchemy", "heat"],
        effects: [
          { effect_id: "effect-warmth", duration_turns: 3, magnitude: 2.5 },
          { effect_id: "effect-glow", duration_turns: null, magnitude: 1 }
        ],
        power_rating: 3,
        "max-value": 18
      },
      {
        item_id: "item-rimehook",
        name: "Rimehook",
        rarity: "rare",
        tags: ["weapon", "frost"],
        effects: [{ effect_id: "effect-slow", duration_turns: 2, magnitude: 0.25 }],
        power_rating: "review",
        "max-value": 42
      },
      {
        item_id: "item-map-fragment",
        name: "Ash Coast Map Fragment",
        rarity: null,
        tags: [],
        effects: [],
        power_rating: null
      }
    ],
    factions: [
      {
        faction_id: "faction-lantern-guild",
        name: "Lantern Guild",
        signal: "three-lights",
        allies: [{ faction_id: "faction-tidewardens", trust: 0.65 }],
        "display name": "Lantern Guild Field Office"
      },
      {
        faction_id: "faction-tidewardens",
        name: "Tidewardens",
        signal: "blue-cord",
        allies: [],
        "display-name": "Tidewarden Survey Corps"
      }
    ],
    quests: [
      {
        quest_id: "quest-cold-lantern",
        title: "The Cold Lantern",
        for: "level-2-party",
        issuer_faction_id: "faction-lantern-guild",
        requirements: [
          { kind: "item", target_id: "item-emberglass-vial", quantity: 1 },
          { kind: "faction", target_id: "faction-tidewardens", quantity: null }
        ],
        rewards: {
          currency: { code: "crown", amount: 75 },
          item_ids: ["item-map-fragment"]
        }
      }
    ]
  };

  return Object.freeze({
    name: "emberline-bridge-sample.json",
    description: "Original multi-collection sample with nested records, stable IDs, nullable and mixed fields, and hostile identifiers.",
    text: JSON.stringify(data, null, 2)
  });
});
