(function attachOneShotCore(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.OneShotCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createOneShotCore() {
  "use strict";

  const PRODUCTS = Object.freeze([
    Object.freeze({ id: "items", offer: "item", title: "Item Catalog & Economy Kit", proof: "500 items", url: "https://loottableworks.github.io/loot-drop-calculator/buy/?offer=item" }),
    Object.freeze({ id: "merchants", offer: "merchant", title: "Merchant & Shop Kit", proof: "150 merchants", url: "https://loottableworks.github.io/loot-drop-calculator/buy/?offer=merchant" }),
    Object.freeze({ id: "recipes", offer: "recipe", title: "Crafting & Recipe Kit", proof: "300 recipes", url: "https://loottableworks.github.io/loot-drop-calculator/buy/?offer=recipe" }),
    Object.freeze({ id: "loot_profiles", offer: "loot", title: "Enemy Loot & Reward Kit", proof: "250 profiles", url: "https://loottableworks.github.io/loot-drop-calculator/buy/?offer=loot" }),
    Object.freeze({ id: "quests", offer: "quest", title: "Quest, Contract & Reward Kit", proof: "240 quests", url: "https://loottableworks.github.io/loot-drop-calculator/buy/?offer=quest" }),
    Object.freeze({ id: "encounters", offer: "encounter", title: "Encounter & Threat Kit", proof: "180 encounters", url: "https://loottableworks.github.io/loot-drop-calculator/buy/?offer=encounter" })
  ]);

  const TONES = Object.freeze({
    heroic: Object.freeze({ label: "Heroic", framing: "Protect people first, then secure the objective.", pressure: "Every delay exposes another civilian route.", contentNotes: ["fantasy peril", "combat", "environmental danger"] }),
    mystery: Object.freeze({ label: "Mystery", framing: "Treat every record as evidence and every claimant as incomplete.", pressure: "Each false conclusion strengthens the wrong claimant.", contentNotes: ["deception", "fantasy peril", "uncertain ownership"] }),
    peril: Object.freeze({ label: "Peril", framing: "Resources are thin, the route is failing, and retreat has a cost.", pressure: "The location degrades whenever the party yields ground.", contentNotes: ["heightened danger", "combat", "environmental collapse"] })
  });

  const THREATS = Object.freeze({
    forgiving: Object.freeze({ label: "Forgiving", countDelta: -1, clockSegments: 4, guidance: "Telegraph every hazard and offer a clean retreat." }),
    standard: Object.freeze({ label: "Standard", countDelta: 0, clockSegments: 5, guidance: "Mix one direct threat with one objective pressure." }),
    dangerous: Object.freeze({ label: "Dangerous", countDelta: 1, clockSegments: 6, guidance: "Advance the clock when the party ignores a telegraphed cost." })
  });

  const REGIONS = Object.freeze({
    any: Object.freeze({ label: "Any region", biome: null }),
    coastal: Object.freeze({ label: "Saltglass Coast", biome: "coastal" }),
    desert: Object.freeze({ label: "Emberroad Expanse", biome: "desert" }),
    marsh: Object.freeze({ label: "Reedlight Marsh", biome: "marsh" }),
    ruins: Object.freeze({ label: "Ashen Index Ruins", biome: "ruins" }),
    tundra: Object.freeze({ label: "Whiteglass Frontier", biome: "tundra" }),
    urban: Object.freeze({ label: "Brass Bell City", biome: "urban" })
  });

  const CHARACTER_ROLES = Object.freeze([
    Object.freeze({ id: "trail-reader", label: "Trail Reader", edge: "Reads routes, weather, and unsafe ground before anyone commits.", burden: "Will take a worse path to keep another traveler out of danger." }),
    Object.freeze({ id: "warden", label: "Warden", edge: "Holds a threatened position and creates room for others to act.", burden: "Treats every abandoned post as a personal failure." }),
    Object.freeze({ id: "broker", label: "Broker", edge: "Finds the promise, debt, or price that changes a negotiation.", burden: "Owes a favor to someone connected to the disputed cargo." }),
    Object.freeze({ id: "scholar", label: "Field Scholar", edge: "Connects physical evidence to provenance, craft, and local history.", burden: "Cannot leave a useful record undocumented." }),
    Object.freeze({ id: "scoundrel", label: "Scoundrel", edge: "Gets through guarded spaces and spots the shortcut others miss.", burden: "A former associate recognizes their methods." }),
    Object.freeze({ id: "adept", label: "Elemental Adept", edge: "Turns wind, water, flame, and pressure into a temporary advantage.", burden: "Their strongest technique always leaves visible evidence." })
  ]);

  const GIVEN_NAMES = Object.freeze(["Alder", "Brin", "Caro", "Dessa", "Eris", "Fenn", "Gale", "Hollis", "Iven", "Jori", "Kest", "Lio", "Mara", "Neris", "Orin", "Perrin", "Quill", "Rhea", "Sable", "Tamsin", "Vale", "Wren"]);
  const BYNAMES = Object.freeze(["Ashwake", "Bell", "Cairn", "Dovetail", "Farrow", "Glass", "Hale", "Knot", "Morrow", "North", "Reed", "Shore", "Venn", "West"]);
  const DRIVES = Object.freeze([
    "Prove that careful preparation beats inherited authority.",
    "Return something that was taken from the region without consent.",
    "Make sure the contract protects workers as well as property.",
    "Expose the person profiting from the route failure.",
    "Earn a place in the guild without accepting its worst customs.",
    "Keep a promise made to someone who never returned from the site."
  ]);
  const BONDS = Object.freeze([
    "I trust {name} with evidence I would hide from anyone else.",
    "{name} once got me home through impossible weather.",
    "I think {name} is wrong about the claimant, but I will hear them out.",
    "{name} knows the real reason I accepted this contract.",
    "I promised to keep {name} from making the same sacrifice twice.",
    "{name} and I disagree about who deserves the reward."
  ]);

  function hash(text) {
    let value = 2166136261;
    for (let index = 0; index < String(text).length; index += 1) {
      value ^= String(text).charCodeAt(index);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function hexHash(text) {
    return hash(text).toString(16).padStart(8, "0");
  }

  function ordered(rows, seed, keyOf) {
    return [...rows].sort((left, right) => {
      const leftKey = keyOf(left);
      const rightKey = keyOf(right);
      return hash(`${seed}|${leftKey}`) - hash(`${seed}|${rightKey}`) || String(leftKey).localeCompare(String(rightKey));
    });
  }

  function pick(rows, seed, slot) {
    if (!rows.length) return null;
    return rows[hash(`${seed}|${slot}`) % rows.length];
  }

  function normalizeOptions(input = {}) {
    const seed = String(input.seed || "beacon-47").trim().slice(0, 64) || "beacon-47";
    const tone = input.tone || "heroic";
    const threat = input.threat || "standard";
    const region = input.region || "any";
    const durationMinutes = Number(input.durationMinutes || 180);
    const partySize = Number(input.partySize || 4);
    const maximumTier = Number(input.maximumTier || 3);
    if (!TONES[tone]) throw new Error(`Unsupported tone: ${tone}`);
    if (!THREATS[threat]) throw new Error(`Unsupported threat: ${threat}`);
    if (!REGIONS[region]) throw new Error(`Unsupported region: ${region}`);
    if (![120, 180, 240].includes(durationMinutes)) throw new Error("durationMinutes must be 120, 180, or 240");
    if (!Number.isInteger(partySize) || partySize < 3 || partySize > 6) throw new Error("partySize must be an integer from 3 through 6");
    if (!Number.isInteger(maximumTier) || maximumTier < 1 || maximumTier > 5) throw new Error("maximumTier must be an integer from 1 through 5");
    return { seed, tone, threat, region, durationMinutes, partySize, maximumTier };
  }

  function sentenceFragment(value) {
    const text = String(value || "").trim().replace(/[.!?]+$/, "");
    return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : "complete the documented objective";
  }

  function capitalizeSentence(value) {
    const text = String(value || "").trim().replace(/[.!?]+$/, "");
    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "";
  }

  function asSentence(value) {
    const text = capitalizeSentence(value);
    return text ? `${text}.` : "";
  }

  function displayEnemyName(value) {
    const words = String(value || "Opposition").trim().split(/\s+/);
    if (words.length < 2) return words.join(" ");
    const last = words.at(-1).toLowerCase();
    const prior = words.at(-2).toLowerCase().replace(/s$/, "");
    if (last === prior || last.startsWith(prior)) words.splice(-2, 1);
    return words.join(" ");
  }

  function objectiveSummary(quest, location) {
    const action = sentenceFragment(quest.objective.action || "Complete");
    const quantity = Number(quest.objective.quantity || 1);
    const target = quest.objective.target_item_name || "the documented objective";
    return `${action} ${quantity > 1 ? `${quantity} ` : ""}${target} at ${location.name}`;
  }

  function evidenceSceneTitle(quest) {
    const titles = {
      crafting: "The materials fail inspection",
      delivery: "The route terms change",
      escort: "Custody of the objective is challenged",
      procurement: "The agreed price no longer holds",
      recovery: "Two claims, one objective",
      secure: "Control of the site is disputed",
      survey: "The records contradict the site"
    };
    return titles[quest.quest_type] || "The contract changes under pressure";
  }

  function encounterHeading(encounter, location) {
    if (/^Protection\s+/i.test(encounter.encounter_name)) {
      const room = String(encounter.room_type || "site");
      return `Guarded ${room.charAt(0).toUpperCase()}${room.slice(1)} at ${location.name}`;
    }
    const prefix = `${location.name}: `;
    const room = encounter.encounter_name.startsWith(prefix)
      ? encounter.encounter_name.slice(prefix.length)
      : encounter.room_name || encounter.encounter_name;
    return `${room} at ${location.name}`;
  }

  function buildIndex(source) {
    if (!source?.validation?.valid || !source.data || !source.relationships) throw new Error("A valid World Foundry source is required");
    const maps = {
      items: new Map(source.data.items.map((row) => [row.id, row])),
      merchants: new Map(source.data.merchants.map((row) => [row.merchant_id, row])),
      recipes: new Map(source.data.recipes.map((row) => [row.recipe_id, row])),
      quests: new Map(source.data.quests.map((row) => [row.quest_id, row])),
      locations: new Map(source.data.locations.map((row) => [row.location_id, row])),
      loot_profiles: new Map(source.data.loot_profiles.map((row) => [row.profile_id, row])),
      encounters: new Map(source.data.encounters.map((row) => [row.encounter_id, row]))
    };
    return { maps, nodes: new Map(source.relationships.nodes.map((node) => [node.id, node])) };
  }

  function sceneBudgets(durationMinutes) {
    const weights = [0.12, 0.17, 0.18, 0.38];
    const minutes = weights.map((weight) => Math.max(10, Math.round((durationMinutes * weight) / 5) * 5));
    minutes.push(durationMinutes - minutes.reduce((total, value) => total + value, 0));
    return minutes;
  }

  function enemyScale(encounter, options) {
    const partyDelta = options.partySize <= 3 ? -1 : options.partySize >= 5 ? 1 : 0;
    return encounter.enemy_groups.map((group) => ({
      ...group,
      enemy_name: displayEnemyName(group.enemy_name),
      base_count: group.count,
      count: Math.max(1, group.count + partyDelta + THREATS[options.threat].countDelta)
    }));
  }

  function buildScenes(context, options) {
    const { encounter, quest, location, merchant, enemyGroups, rewardProfile } = context;
    const budgets = sceneBudgets(options.durationMinutes);
    const tone = TONES[options.tone];
    const primaryEnemy = enemyGroups[0];
    const secondaryEnemy = enemyGroups[1];
    return [
      {
        id: "opening-contract",
        order: 1,
        minutes: budgets[0],
        title: "The contract arrives under pressure",
        purpose: `Put ${quest.objective.target_item_name || encounter.reward_connection_item_name} and the route to ${location.name} in front of the party immediately.`,
        read_aloud: `${merchant?.proprietor || quest.giver_name} sets a weather-marked contract on the table. The route to ${location.name} is failing, and the first deadline has already passed.`,
        gm_moves: [tone.framing, `State the verified reward: ${quest.reward_currency} currency${quest.reward_item_name ? ` and ${quest.reward_item_name}` : ""}.`, "Ask each character why this contract cannot wait until morning."],
        exit: "The party names its approach and one precaution."
      },
      {
        id: "evidence-and-claimants",
        order: 2,
        minutes: budgets[1],
        title: evidenceSceneTitle(quest),
        purpose: "Make the contract's complication actionable without deciding the party's response for them.",
        read_aloud: asSentence(quest.complication),
        gm_moves: [quest.alternate_resolution, `Surface the location pressure: ${location.local_hazard}.`, "On a weak result, reveal the clue but attach a social or time cost."],
        exit: "The party chooses which evidence to preserve and whose account to challenge."
      },
      {
        id: "hazardous-approach",
        order: 3,
        minutes: budgets[2],
        title: `Reach ${location.name}`,
        purpose: "Make preparation matter before the confrontation begins.",
        read_aloud: `${asSentence(location.description)} ${asSentence(encounter.hazard.telegraph)}`,
        gm_moves: [location.access_condition, encounter.hazard.mitigation, "If the party spends gear or accepts delay, carry that choice forward as a concrete advantage."],
        exit: "The party reaches the objective zone and the clock has not filled."
      },
      {
        id: "confrontation",
        order: 4,
        minutes: budgets[3],
        title: encounter.encounter_name,
        purpose: encounter.tactical_purpose,
        read_aloud: `${asSentence(encounter.hazard.telegraph)} ${primaryEnemy?.enemy_name || "The opposition"} controls the ${String(encounter.room_name || encounter.room_type || "objective zone").toLowerCase()}, and the objective cannot be completed while the route remains contested.`,
        gm_moves: [
          `${primaryEnemy?.count || 1} ${primaryEnemy?.enemy_name || "opponents"} pressure the objective${secondaryEnemy ? ` while ${secondaryEnemy.count} ${secondaryEnemy.enemy_name} threaten the alternate route` : ""}.`,
          encounter.hazard.encounter_hazard,
          THREATS[options.threat].guidance,
          `Nonviolent exit: ${encounter.alternate_resolution}`
        ],
        exit: encounter.exit_condition
      },
      {
        id: "aftermath",
        order: 5,
        minutes: budgets[4],
        title: "Account for the cost",
        purpose: "Resolve ownership, reward the party, and leave one usable campaign thread.",
        read_aloud: quest.world_impact,
        gm_moves: [quest.success_condition || quest.objective.success_condition, `If the objective was lost: ${quest.failure_consequence}`, rewardProfile ? `Reward evidence points to ${rewardProfile.reward_identity}.` : "Pay the documented contract reward.", "Ask which faction records the party's decision."],
        exit: "Record the changed relationship and one unresolved consequence."
      }
    ];
  }

  function buildClues(context) {
    const { encounter, quest, location, rewardProfile } = context;
    return [
      { id: "clue-provenance", clue: quest.objective.description, reveals: "What must remain intact for the contract to be honored.", fail_forward: "The party learns the requirement, but the rival claimant learns their route." },
      { id: "clue-hazard", clue: encounter.hazard.telegraph, reveals: encounter.hazard.mitigation, fail_forward: "The hazard is understood only after consuming time or equipment." },
      { id: "clue-opposition", clue: rewardProfile?.behavior || encounter.escalation, reveals: rewardProfile ? `The opposition values ${rewardProfile.reward_identity}.` : "The opposition is protecting an exit, not the site itself.", fail_forward: "The clue is recovered, but the encounter begins with the route already pressured." },
      { id: "clue-access", clue: location.access_condition, reveals: `How to approach ${location.name} without letting the local hazard dictate the party's position.`, fail_forward: "The approach works, but it fills one countdown segment." }
    ];
  }

  function buildCharacters(context, options, source) {
    const { quest, location } = context;
    const regionalItems = source.data.items.filter((item) =>
      item.tier <= options.maximumTier && item.biome === location.biome
    );
    const itemRows = ordered(
      regionalItems.length
        ? regionalItems
        : source.data.items.filter((item) => item.tier <= options.maximumTier),
      `${options.seed}|${location.biome}|party-items`,
      (item) => item.id
    );
    const roles = ordered(CHARACTER_ROLES, `${options.seed}|roles`, (role) => role.id).slice(0, options.partySize);
    const names = ordered(GIVEN_NAMES, `${options.seed}|given`, (name) => name);
    const bynames = ordered(BYNAMES, `${options.seed}|byname`, (name) => name);
    return roles.map((role, index) => {
      const nextName = `${names[(index + 1) % names.length]} ${bynames[(index + 2) % bynames.length]}`;
      const signatureItem = itemRows[index % itemRows.length];
      return {
        character_id: `pc-${hexHash(`${options.seed}|${index}|${role.id}`)}`,
        name: `${names[index]} ${bynames[index]}`,
        role: role.label,
        drive: pick(DRIVES, options.seed, `drive-${index}`),
        edge: role.edge,
        burden: role.burden,
        bond: BONDS[index % BONDS.length].replace("{name}", nextName),
        signature_item_id: signatureItem?.id || null,
        signature_item_name: signatureItem?.name || "Weatherproof field kit",
        adventure_tie: index % 2 === 0 ? `You have handled records from ${location.name} before, and one detail in this contract is wrong.` : `You know why ${quest.giver_name} cannot ask the local authorities to solve this openly.`,
        spotlight_prompt: index % 3 === 0 ? "What evidence do you notice first?" : index % 3 === 1 ? "What cost are you willing to absorb for the group?" : "Whose version of the contract do you distrust?"
      };
    });
  }

  function validateReferences(context, index) {
    const ids = new Set();
    const add = (id) => { if (id) ids.add(id); };
    add(context.encounter.encounter_id);
    add(context.quest.quest_id);
    add(context.location.location_id);
    add(context.merchant?.merchant_id);
    context.enemyGroups.forEach((group) => add(group.profile_id));
    add(context.rewardProfile?.profile_id);
    add(context.quest.objective?.target_item_id);
    add(context.quest.reward_item_id);
    add(context.encounter.reward_connection_item_id);
    add(context.quest.related_recipe_id);
    const missing = [...ids].filter((id) => !index.nodes.has(id));
    return { ids: [...ids].sort(), missing };
  }

  function generate(rawOptions, source) {
    const options = normalizeOptions(rawOptions);
    const index = buildIndex(source);
    const regionalEncounters = source.data.encounters.filter((encounter) =>
      options.region === "any" || encounter.biome === REGIONS[options.region].biome
    );
    const tierCandidates = regionalEncounters.filter((encounter) =>
      encounter.tier <= options.maximumTier
    );
    const candidates = tierCandidates.length ? tierCandidates : regionalEncounters;
    if (!candidates.length) throw new Error(`No encounters available for region: ${options.region}`);
    const encounter = ordered(
      candidates,
      `${options.seed}|${options.region}|encounter`,
      (row) => row.encounter_id
    )[0];
    const quest = index.maps.quests.get(encounter.quest_hook_id) || ordered(source.data.quests, `${options.seed}|quest`, (row) => row.quest_id)[0];
    const location = index.maps.locations.get(encounter.location_id) || index.maps.locations.get(quest.location_id) || source.data.locations[0];
    const merchant = index.maps.merchants.get(quest.giver_merchant_id) || null;
    const enemyGroups = enemyScale(encounter, options);
    const rewardProfile = index.maps.loot_profiles.get(encounter.reward_loot_profile_id) || index.maps.loot_profiles.get(enemyGroups[0]?.profile_id) || null;
    const context = { encounter, quest, location, merchant, enemyGroups, rewardProfile };
    const scenes = buildScenes(context, options);
    const clues = buildClues(context);
    const characters = buildCharacters(context, options, source);
    const references = validateReferences(context, index);
    const tone = TONES[options.tone];
    const threat = THREATS[options.threat];
    const patron = merchant?.proprietor || quest.giver_name;
    const primaryEnemyName = enemyGroups[0]?.enemy_name || "Contested Ground";
    const secondaryEnemyName = enemyGroups[1]?.enemy_name || null;
    const adventureTitle = encounterHeading(encounter, location);
    const oneShot = {
      schema_version: "1.0.0",
      generator: "Loot Table Works One-Shot Forge",
      adventure_id: `osf-${hexHash([options.seed, options.tone, options.threat, options.region, options.durationMinutes, options.partySize, options.maximumTier].join("|"))}`,
      seed: options.seed,
      title: adventureTitle,
      logline: `${patron} offers ${quest.reward_currency} currency to ${objectiveSummary(quest, location)}. ${primaryEnemyName} controls the approach${secondaryEnemyName ? ` while ${secondaryEnemyName} closes the alternate route` : ""}.`,
      tone: options.tone,
      threat: options.threat,
      region: encounter.biome,
      region_filter: options.region,
      duration_minutes: options.durationMinutes,
      party_size: options.partySize,
      maximum_tier: options.maximumTier,
      content_notes: tone.contentNotes,
      countdown: {
        segments: threat.clockSegments,
        label: `${location.name} crisis`,
        advances_when: ["the party abandons preserved evidence", "a telegraphed hazard is ignored", "the opposition controls the objective at a scene exit"],
        final_state: tone.pressure
      },
      scenes,
      clues,
      characters,
      opposition: enemyGroups,
      rewards: {
        currency: quest.reward_currency,
        item_id: quest.reward_item_id || encounter.reward_connection_item_id || null,
        item_name: quest.reward_item_name || encounter.reward_connection_item_name || null,
        expected_encounter_value: encounter.expected_reward_value,
        rationale: quest.reward_rationale
      },
      source_records: {
        quest,
        encounter,
        location,
        merchant,
        loot_profile: rewardProfile
      },
      reference_ledger: references.ids,
      validation: {
        valid: references.missing.length === 0 && encounter.biome === location.biome && (options.region === "any" || encounter.biome === REGIONS[options.region].biome) && scenes.reduce((total, scene) => total + scene.minutes, 0) === options.durationMinutes && new Set(characters.map((character) => character.character_id)).size === characters.length,
        missing_reference_count: references.missing.length,
        missing_references: references.missing,
        region_filter_honored: options.region === "any" || encounter.biome === REGIONS[options.region].biome,
        tier_fallback_used: tierCandidates.length === 0,
        scheduled_minutes: scenes.reduce((total, scene) => total + scene.minutes, 0),
        scene_count: scenes.length,
        character_count: characters.length
      }
    };
    if (!oneShot.validation.valid) throw new Error("Generated one-shot failed validation");
    return oneShot;
  }

  function toMarkdown(oneShot) {
    if (!oneShot?.validation?.valid) throw new Error("A valid one-shot is required");
    const lines = [
      `# ${oneShot.title}`,
      "",
      `**Seed:** ${oneShot.seed}  `,
      `**Run time:** ${oneShot.duration_minutes} minutes  `,
      `**Party:** ${oneShot.party_size} pregenerated characters  `,
      `**Region:** ${REGIONS[oneShot.region].label}  `,
      `**Tone / threat:** ${TONES[oneShot.tone].label} / ${THREATS[oneShot.threat].label}`,
      "",
      oneShot.logline,
      "",
      `## Countdown: ${oneShot.countdown.label} (${oneShot.countdown.segments} segments)`,
      "",
      ...oneShot.countdown.advances_when.map((entry) => `- Advance when ${entry}.`),
      `- Final state: ${oneShot.countdown.final_state}`,
      "",
      "## Run Sheet",
      ""
    ];
    for (const scene of oneShot.scenes) {
      lines.push(`### ${scene.order}. ${scene.title} (${scene.minutes} min)`, "", scene.read_aloud, "", `**Purpose:** ${scene.purpose}`, "", ...scene.gm_moves.map((move) => `- ${move}`), "", `**Exit:** ${scene.exit}`, "");
    }
    lines.push("## Clues", "");
    oneShot.clues.forEach((clue) => lines.push(`- **${clue.clue}** Reveals: ${clue.reveals} Fail forward: ${clue.fail_forward}`));
    lines.push("", "## Pregenerated Party", "");
    for (const character of oneShot.characters) {
      lines.push(`### ${character.name} - ${character.role}`, "", `- Drive: ${character.drive}`, `- Edge: ${character.edge}`, `- Burden: ${character.burden}`, `- Bond: ${character.bond}`, `- Signature item: ${character.signature_item_name} [${character.signature_item_id}]`, `- Adventure tie: ${character.adventure_tie}`, `- Spotlight: ${character.spotlight_prompt}`, "");
    }
    lines.push("## Reference Ledger", "", ...oneShot.reference_ledger.map((id) => `- ${id}`), "", `Generated by Loot Table Works One-Shot Forge. Build ${oneShot.adventure_id}.`);
    return lines.join("\n");
  }

  function recommendProducts(limit = 3) {
    const priority = ["quests", "encounters", "loot_profiles", "items", "merchants", "recipes"];
    return priority.slice(0, Math.max(0, Number(limit) || 0)).map((id) => PRODUCTS.find((product) => product.id === id));
  }

  return { PRODUCTS, TONES, THREATS, REGIONS, CHARACTER_ROLES, hash, displayEnemyName, normalizeOptions, generate, toMarkdown, recommendProducts };
});
