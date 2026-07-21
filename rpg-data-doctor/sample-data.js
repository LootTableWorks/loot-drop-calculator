(function attachRpgDataDoctorSample(root) {
  "use strict";

  const sample = {
    schema_version: "1.0.0",
    items: [
      { id: "itm-brineglass", name: "Brineglass Shard", base_price: 18 },
      { id: "itm-brineglass", name: "Brineglass Sliver", base_price: 11 },
      { id: "itm-lantern-oil", name: "Lantern Oil", base_price: 7 },
      { id: "itm-signal-flare", name: "Signal Flare", base_price: 32 }
    ],
    locations: [
      { location_id: "loc-gullwatch", name: "Gullwatch Beacon" }
    ],
    merchants: [
      { merchant_id: "mrc-tideward", name: "Tideward Supply", buy_price: 12, sell_price: 20, location_id: "loc-gullwatch" }
    ],
    recipes: [
      {
        recipe_id: "rcp-signal-flare",
        name: "Signal Flare",
        output_item_id: "",
        ingredients: [{ item_id: "itm-missing-salt", quantity: 0 }]
      },
      { recipe_id: "rcp-clear-oil", name: "Clarified Lantern Oil", output_item_id: "itm-lantern-oil", ingredients: [] }
    ],
    loot_profiles: [
      {
        profile_id: "loot-tide-scavenger",
        name: "Tide Scavenger",
        rewards: [
          { item_id: "itm-brineglass", weight_bp: 6000 },
          { item_id: "itm-missing-token", weight_bp: 2500 }
        ]
      }
    ],
    quests: [
      {
        quest_id: "qst-dead-lantern",
        title: "The Dead Lantern",
        start_location_id: "loc-missing-jetty",
        end_location_id: "loc-gullwatch",
        reward_item_id: "itm-missing-token"
      },
      { quest_id: "qst-clear-channel", title: "Clear the Channel", start_location_id: "loc-gullwatch", end_location_id: "loc-gullwatch" }
    ],
    encounters: [
      { encounter_id: "enc-jetty-ambush", name: "Jetty Ambush", next_encounter_id: "enc-missing-vault" },
      { encounter_id: "enc-beacon-rush", name: "Beacon Rush", success_encounter_id: "enc-jetty-ambush" }
    ]
  };

  const api = Object.freeze({
    name: "loot-table-works-original-audit-sample.json",
    text: `${JSON.stringify(sample, null, 2)}\n`
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.RpgDataDoctorSample = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
