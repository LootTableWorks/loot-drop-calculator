(function attachCharacterFoundryCore(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CharacterFoundryCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCharacterFoundryCore() {
  "use strict";

  const PRODUCTS = Object.freeze([
    Object.freeze({ id: "items", title: "Item Catalog & Economy Kit", proof: "500 items", url: "https://loot-table-works.itch.io/original-fantasy-item-data-pack" }),
    Object.freeze({ id: "merchants", title: "Merchant & Shop Kit", proof: "150 merchants", url: "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit" }),
    Object.freeze({ id: "recipes", title: "Crafting & Recipe Kit", proof: "300 recipes", url: "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit" }),
    Object.freeze({ id: "loot_profiles", title: "Enemy Loot & Reward Kit", proof: "250 profiles", url: "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit" }),
    Object.freeze({ id: "quests", title: "Quest, Contract & Reward Kit", proof: "240 quests", url: "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit" }),
    Object.freeze({ id: "encounters", title: "Encounter & Threat Kit", proof: "180 encounters", url: "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit" })
  ]);

  const CAMPAIGN_MODES = Object.freeze({
    expedition: Object.freeze({ label: "Expedition", frame: "A prepared company crosses dangerous ground to recover evidence before the route closes.", question: "What does the party refuse to leave behind?" }),
    intrigue: Object.freeze({ label: "Intrigue", frame: "A contested contract forces the party to choose which claimant, record, and promise deserves protection.", question: "Whose version of events does the party distrust?" }),
    recovery: Object.freeze({ label: "Recovery", frame: "The party must return something lost without repeating the decision that lost it.", question: "What cost would make recovery feel like failure?" }),
    resistance: Object.freeze({ label: "Resistance", frame: "Local people need capable outsiders who can challenge a powerful interest without becoming its replacement.", question: "Who must retain control after the party leaves?" })
  });

  const TONES = Object.freeze({
    hopeful: Object.freeze({ label: "Hopeful", promise: "Competence and solidarity can improve a damaged place.", note: "Keep hard choices visible without making compassion naive." }),
    grounded: Object.freeze({ label: "Grounded", promise: "Every advantage has a material cost, owner, and consequence.", note: "Let preparation and relationships matter more than spectacle." }),
    mysterious: Object.freeze({ label: "Mysterious", promise: "Evidence is reliable, but no witness holds the entire truth.", note: "Reveal information even on failure, then attach a cost." })
  });

  const COHESION = Object.freeze({
    new_crew: Object.freeze({ label: "New Crew", extraBonds: 0, trust: "provisional", history: "The company formed around this contract and has not yet agreed what success means." }),
    trusted_company: Object.freeze({ label: "Trusted Company", extraBonds: 2, trust: "tested", history: "The company has survived a failed route together and knows who moves first under pressure." }),
    uneasy_alliance: Object.freeze({ label: "Uneasy Alliance", extraBonds: 1, trust: "conditional", history: "The company shares an objective, but at least two members answer to competing obligations." })
  });

  const ROLES = Object.freeze([
    Object.freeze({ id: "trail-reader", label: "Trail Reader", contribution: "Reads routes, weather, and unsafe ground before anyone commits.", edge: "When the route changes, name the safest option and its real cost.", burden: "Will take the worse path to keep another traveler out of danger.", growth: "Teach someone else to read the signs instead of carrying every decision alone." }),
    Object.freeze({ id: "warden", label: "Warden", contribution: "Holds a threatened position and creates room for others to act.", edge: "When pressure spikes, decide who or what remains protected.", burden: "Treats every abandoned post as a personal failure.", growth: "Choose a living person over an inherited duty." }),
    Object.freeze({ id: "broker", label: "Broker", contribution: "Finds the promise, debt, or price that changes a negotiation.", edge: "When talks stall, expose the obligation no one wants named.", burden: "Owes a favor to someone connected to the disputed cargo.", growth: "Settle a debt without transferring it to someone weaker." }),
    Object.freeze({ id: "field-scholar", label: "Field Scholar", contribution: "Connects physical evidence to provenance, craft, and local history.", edge: "When evidence conflicts, identify which detail could not have been staged.", burden: "Cannot leave a useful record undocumented.", growth: "Publish a truth that weakens your own standing." }),
    Object.freeze({ id: "scoundrel", label: "Scoundrel", contribution: "Gets through guarded spaces and spots the shortcut others miss.", edge: "When access looks closed, reveal the overlooked entry and who controls it.", burden: "A former associate recognizes their methods.", growth: "Use your cleanest exit to bring someone else home." }),
    Object.freeze({ id: "weather-adept", label: "Weather Adept", contribution: "Turns wind, surf, flame, and pressure into a temporary advantage.", edge: "When the environment turns hostile, redirect it for one decisive moment.", burden: "Their strongest technique always leaves visible evidence.", growth: "Accept help before your control becomes the next hazard." })
  ]);

  const GIVEN_NAMES = Object.freeze(["Alder", "Brin", "Caro", "Dessa", "Eris", "Fenn", "Gale", "Hollis", "Iven", "Jori", "Kest", "Lio", "Mara", "Neris", "Orin", "Perrin", "Quill", "Rhea", "Sable", "Tamsin", "Vale", "Wren"]);
  const BYNAMES = Object.freeze(["Ashwake", "Bell", "Cairn", "Dovetail", "Farrow", "Glass", "Hale", "Knot", "Morrow", "North", "Reed", "Shore", "Venn", "West"]);
  const PRONOUNS = Object.freeze(["she/her", "he/him", "they/them"]);
  const DRIVES = Object.freeze([
    "Prove that careful preparation beats inherited authority.",
    "Return something taken from the coast without consent.",
    "Make sure the contract protects workers as well as property.",
    "Expose the person profiting from the route failure.",
    "Earn a place in the guild without accepting its worst customs.",
    "Keep a promise made to someone who never returned from the beacon.",
    "Build a reputation strong enough to survive telling the truth.",
    "Find a home that does not demand silence in exchange for safety."
  ]);
  const IDEALS = Object.freeze(["Evidence before rank.", "No reward is worth an abandoned companion.", "A contract binds the powerful first.", "Preparation is a form of care.", "People deserve a voice in what changes their home.", "A useful truth must be made usable."]);
  const FEARS = Object.freeze(["Becoming the kind of authority they learned to evade.", "Mistaking control for protection.", "Learning that the missing record was destroyed for a good reason.", "Owing the group more than they can repay.", "Being recognized before they can explain why they left.", "Watching careful plans fail because no one spoke plainly."]);
  const PRESENCE = Object.freeze(["quietly precise", "warm until challenged", "restless and observant", "formally courteous", "dryly funny under pressure", "direct without being careless"]);
  const BOND_PATTERNS = Object.freeze([
    Object.freeze({ history: "{from} trusted {to} with evidence that could have ended both careers.", tension: "They disagree about whether truth or safety comes first.", repair: "What would {from} have to admit before {to} could trust the next plan?" }),
    Object.freeze({ history: "{to} brought {from} home through impossible weather.", tension: "Neither agrees on who actually saved whom.", repair: "Which detail from that night have they never discussed?" }),
    Object.freeze({ history: "{from} and {to} once accepted opposite sides of the same contract.", tension: "Each believes the other still protects the wrong claimant.", repair: "What evidence could make both of them revise the story?" }),
    Object.freeze({ history: "{to} knows the real reason {from} joined this company.", tension: "The secret is useful and increasingly difficult to protect.", repair: "Who deserves to hear the truth first?" }),
    Object.freeze({ history: "{from} promised to keep {to} from making the same sacrifice twice.", tension: "Protection is beginning to feel like control.", repair: "What boundary must {to} set before accepting help?" }),
    Object.freeze({ history: "{from} and {to} split the credit for a success neither could have earned alone.", tension: "Only one name appears in the official record.", repair: "How will they correct the record without destroying the relationship?" })
  ]);
  const ADVANCEMENT_HOOKS = Object.freeze([
    "Take responsibility for a consequence that was not entirely your fault.",
    "Turn a source-linked item into a promise, debt, or public piece of evidence.",
    "Ask another character to lead where you normally take control.",
    "Change a faction relationship through a documented choice, not a favor.",
    "Retire one coping habit after it harms someone you intended to protect.",
    "Convert a rival into a witness without erasing what they did."
  ]);
  const GROUP_RESOURCES = Object.freeze(["a weatherproof evidence case", "a shared emergency purse with three seals", "a marked coastal route ledger", "a portable repair bench", "a letter of passage with one disputed signature", "a signal kit recognized by harbor crews"]);
  const PARTY_NAMES = Object.freeze(["The Saltline Company", "The Beacon Compact", "The Open Ledger", "The Weatherward Crew", "The Dovetail Company", "The Last Safe Route"]);

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
    const seed = String(input.seed || "saltline-17").trim().slice(0, 64) || "saltline-17";
    const campaignMode = input.campaignMode || "expedition";
    const tone = input.tone || "grounded";
    const cohesion = input.cohesion || "new_crew";
    const partySize = Number(input.partySize || 4);
    const maximumTier = Number(input.maximumTier || 3);
    if (!CAMPAIGN_MODES[campaignMode]) throw new Error(`Unsupported campaignMode: ${campaignMode}`);
    if (!TONES[tone]) throw new Error(`Unsupported tone: ${tone}`);
    if (!COHESION[cohesion]) throw new Error(`Unsupported cohesion: ${cohesion}`);
    if (!Number.isInteger(partySize) || partySize < 3 || partySize > 6) throw new Error("partySize must be an integer from 3 through 6");
    if (!Number.isInteger(maximumTier) || maximumTier < 1 || maximumTier > 5) throw new Error("maximumTier must be an integer from 1 through 5");
    return { seed, campaignMode, tone, cohesion, partySize, maximumTier };
  }

  function buildIndex(source) {
    if (!source?.validation?.valid || !source.data || !source.relationships) throw new Error("A valid World Foundry source is required");
    return {
      nodes: new Map(source.relationships.nodes.map((node) => [node.id, node])),
      items: new Map(source.data.items.map((row) => [row.id, row])),
      merchants: new Map(source.data.merchants.map((row) => [row.merchant_id, row])),
      quests: new Map(source.data.quests.map((row) => [row.quest_id, row])),
      locations: new Map(source.data.locations.map((row) => [row.location_id, row])),
      encounters: new Map(source.data.encounters.map((row) => [row.encounter_id, row])),
      recipes: new Map(source.data.recipes.map((row) => [row.recipe_id, row]))
    };
  }

  function chooseContext(options, source, index) {
    const quests = ordered(source.data.quests, `${options.seed}|quests`, (row) => row.quest_id);
    const quest = quests[0];
    const location = index.locations.get(quest.location_id) || source.data.locations[0];
    const merchant = index.merchants.get(quest.giver_merchant_id) || ordered(source.data.merchants, `${options.seed}|merchant`, (row) => row.merchant_id)[0];
    const encounterMatches = source.data.encounters.filter((row) => row.quest_hook_id === quest.quest_id || row.location_id === location.location_id);
    const encounter = ordered(encounterMatches.length ? encounterMatches : source.data.encounters, `${options.seed}|encounter`, (row) => row.encounter_id)[0];
    const threads = quests.slice(0, Math.min(3, quests.length)).map((row, indexValue) => ({
      thread_id: `thread-${indexValue + 1}`,
      quest_id: row.quest_id,
      title: row.title,
      pressure: row.complication,
      invitation: row.objective?.description || row.success_condition
    }));
    return { quest, location, merchant, encounter, threads };
  }

  function buildCharacters(context, options, source) {
    const itemPool = source.data.items.filter((item) => item.tier <= options.maximumTier);
    const items = ordered(itemPool.length ? itemPool : source.data.items, `${options.seed}|signature-items`, (item) => item.id);
    const roles = ordered(ROLES, `${options.seed}|roles`, (role) => role.id).slice(0, options.partySize);
    const givenNames = ordered(GIVEN_NAMES, `${options.seed}|given-names`, (name) => name);
    const bynames = ordered(BYNAMES, `${options.seed}|bynames`, (name) => name);
    return roles.map((role, index) => {
      const item = items[index];
      const name = `${givenNames[index]} ${bynames[index]}`;
      return {
        character_id: `pc-${hexHash(`${options.seed}|${index}|${role.id}`)}`,
        name,
        pronouns: PRONOUNS[(hash(`${options.seed}|pronouns|${index}`) + index) % PRONOUNS.length],
        role_id: role.id,
        role: role.label,
        table_presence: pick(PRESENCE, options.seed, `presence-${index}`),
        contribution: role.contribution,
        drive: pick(DRIVES, options.seed, `drive-${index}`),
        ideal: pick(IDEALS, options.seed, `ideal-${index}`),
        edge: role.edge,
        burden: role.burden,
        private_fear: pick(FEARS, options.seed, `fear-${index}`),
        signature_item: {
          item_id: item.id,
          name: item.name,
          tier: item.tier,
          category: item.category,
          function: item.function,
          drawback: item.drawback
        },
        origin: `${context.location.name} shaped how ${name.split(" ")[0]} reads risk, authority, and obligation.`,
        campaign_stake: index % 2 === 0 ? `The official version of ${context.quest.title} omits a detail this character has seen before.` : `${context.merchant.proprietor || context.quest.giver_name} once protected someone this character still owes.`,
        spotlight_question: index % 3 === 0 ? "What evidence do you notice before anyone else?" : index % 3 === 1 ? "What cost are you willing to absorb for the company?" : "Whose account do you challenge, and what makes you hesitate?",
        advancement_hooks: [role.growth, pick(ADVANCEMENT_HOOKS, options.seed, `growth-${index}`)],
        source_links: [item.id, context.quest.quest_id, context.location.location_id, context.merchant.merchant_id]
      };
    });
  }

  function pairKey(left, right) {
    return [left, right].sort().join("|");
  }

  function buildRelationships(characters, options) {
    const desired = Math.min((characters.length * (characters.length - 1)) / 2, characters.length + COHESION[options.cohesion].extraBonds);
    const pairs = [];
    const seen = new Set();
    function add(left, right) {
      const key = pairKey(left, right);
      if (left === right || seen.has(key)) return;
      seen.add(key);
      pairs.push([left, right]);
    }
    for (let index = 0; index < characters.length; index += 1) add(index, (index + 1) % characters.length);
    const candidates = [];
    for (let left = 0; left < characters.length; left += 1) {
      for (let right = left + 1; right < characters.length; right += 1) candidates.push([left, right]);
    }
    for (const [left, right] of ordered(candidates, `${options.seed}|bond-pairs`, (pair) => pair.join("-"))) {
      if (pairs.length >= desired) break;
      add(left, right);
    }
    return pairs.map(([leftIndex, rightIndex], index) => {
      const from = characters[leftIndex];
      const to = characters[rightIndex];
      const pattern = pick(BOND_PATTERNS, options.seed, `bond-${index}`);
      const replace = (text) => text.replaceAll("{from}", from.name).replaceAll("{to}", to.name);
      return {
        relationship_id: `bond-${hexHash(`${options.seed}|${from.character_id}|${to.character_id}`)}`,
        from_character_id: from.character_id,
        from_name: from.name,
        to_character_id: to.character_id,
        to_name: to.name,
        trust: COHESION[options.cohesion].trust,
        shared_history: replace(pattern.history),
        tension: pattern.tension,
        repair_question: replace(pattern.repair)
      };
    });
  }

  function buildSessionZero(context, characters, relationships, options) {
    const names = characters.map((character) => character.name);
    return {
      campaign_promise: TONES[options.tone].promise,
      tone_guidance: TONES[options.tone].note,
      content_conversation: [
        "Name lines, veils, and topics that should stay off-screen before the first scene.",
        "Agree how anyone can pause, rewind, or redirect a scene without defending the request.",
        "Confirm how much intraparty conflict is welcome and what must remain collaborative."
      ],
      party_questions: [
        CAMPAIGN_MODES[options.campaignMode].question,
        `Why does ${names[0]} trust ${names[1]} with the route ledger?`,
        `What did ${names[names.length - 1]} lose the last time the company reached ${context.location.name}?`,
        `Which part of ${context.quest.title} is the company willing to abandon?`,
        "Who outside the company can call in a legitimate debt?",
        "What ordinary ritual tells everyone the company is safe for one more night?"
      ],
      relationship_questions: relationships.map((relationship) => relationship.repair_question),
      first_scene_prompt: `${context.merchant.proprietor || context.quest.giver_name} places the disputed record in the middle of the table. Ask each player what their character checks before anyone signs.`
    };
  }

  function referenceLedger(context, characters, index) {
    const ids = new Set();
    const add = (id) => { if (id) ids.add(id); };
    add(context.quest.quest_id);
    add(context.location.location_id);
    add(context.merchant.merchant_id);
    add(context.encounter.encounter_id);
    add(context.quest.reward_item_id);
    add(context.quest.related_recipe_id);
    add(context.encounter.reward_connection_item_id);
    context.encounter.enemy_groups?.forEach((group) => add(group.profile_id));
    context.threads.forEach((thread) => add(thread.quest_id));
    characters.forEach((character) => character.source_links.forEach(add));
    const values = [...ids].sort();
    return { values, missing: values.filter((id) => !index.nodes.has(id)) };
  }

  function generate(rawOptions, source) {
    const options = normalizeOptions(rawOptions);
    const index = buildIndex(source);
    const context = chooseContext(options, source, index);
    const characters = buildCharacters(context, options, source);
    const relationships = buildRelationships(characters, options);
    const references = referenceLedger(context, characters, index);
    const characterIds = new Set(characters.map((character) => character.character_id));
    const invalidRelationship = relationships.find((relationship) => !characterIds.has(relationship.from_character_id) || !characterIds.has(relationship.to_character_id));
    const party = {
      schema_version: "1.0.0",
      generator: "Loot Table Works Character Foundry",
      party_id: `party-${hexHash([options.seed, options.campaignMode, options.tone, options.cohesion, options.partySize, options.maximumTier].join("|"))}`,
      seed: options.seed,
      party_name: pick(PARTY_NAMES, options.seed, "party-name"),
      campaign_mode: options.campaignMode,
      campaign_mode_label: CAMPAIGN_MODES[options.campaignMode].label,
      tone: options.tone,
      tone_label: TONES[options.tone].label,
      cohesion: options.cohesion,
      cohesion_label: COHESION[options.cohesion].label,
      party_size: options.partySize,
      maximum_tier: options.maximumTier,
      campaign_frame: CAMPAIGN_MODES[options.campaignMode].frame,
      shared_history: COHESION[options.cohesion].history,
      home_base: { location_id: context.location.location_id, name: context.location.name, description: context.location.description },
      patron: { merchant_id: context.merchant.merchant_id, name: context.merchant.proprietor || context.quest.giver_name, shop: context.merchant.shop_name },
      inciting_contract: { quest_id: context.quest.quest_id, title: context.quest.title, objective: context.quest.objective.description, complication: context.quest.complication },
      first_threat: { encounter_id: context.encounter.encounter_id, name: context.encounter.encounter_name, setup: context.encounter.setup },
      group_resource: pick(GROUP_RESOURCES, options.seed, "group-resource"),
      characters,
      relationships,
      campaign_threads: context.threads,
      session_zero: buildSessionZero(context, characters, relationships, options),
      reference_ledger: references.values,
      source_summary: { entities: source.relationships.nodes.length, relationships: source.relationships.edges.length, assembly_id: source.assembly_id },
      validation: {
        valid: references.missing.length === 0 && !invalidRelationship && characters.length === options.partySize && new Set(characters.map((character) => character.role_id)).size === characters.length && new Set(characters.map((character) => character.signature_item.item_id)).size === characters.length,
        missing_reference_count: references.missing.length,
        missing_references: references.missing,
        character_count: characters.length,
        relationship_count: relationships.length,
        unique_role_count: new Set(characters.map((character) => character.role_id)).size,
        unique_signature_item_count: new Set(characters.map((character) => character.signature_item.item_id)).size
      }
    };
    if (!party.validation.valid) throw new Error("Generated party failed validation");
    return party;
  }

  function toMarkdown(party) {
    if (!party?.validation?.valid) throw new Error("A valid party is required");
    const lines = [
      `# ${party.party_name}`,
      "",
      `**Build:** ${party.party_id}  `,
      `**Seed:** ${party.seed}  `,
      `**Campaign:** ${party.campaign_mode_label} / ${party.tone_label} / ${party.cohesion_label}  `,
      `**Party:** ${party.party_size} characters through tier ${party.maximum_tier}`,
      "",
      party.campaign_frame,
      "",
      `**Shared history:** ${party.shared_history}`,
      `**Group resource:** ${party.group_resource}`,
      `**Home base:** ${party.home_base.name} [${party.home_base.location_id}]`,
      `**Inciting contract:** ${party.inciting_contract.title} [${party.inciting_contract.quest_id}]`,
      "",
      "## Character Dossiers",
      ""
    ];
    for (const character of party.characters) {
      lines.push(
        `### ${character.name} - ${character.role} (${character.pronouns})`,
        "",
        `- Table presence: ${character.table_presence}`,
        `- Contribution: ${character.contribution}`,
        `- Drive: ${character.drive}`,
        `- Ideal: ${character.ideal}`,
        `- Edge: ${character.edge}`,
        `- Burden: ${character.burden}`,
        `- Private fear: ${character.private_fear}`,
        `- Signature item: ${character.signature_item.name} [${character.signature_item.item_id}]`,
        `- Origin: ${character.origin}`,
        `- Campaign stake: ${character.campaign_stake}`,
        `- Spotlight question: ${character.spotlight_question}`,
        `- Advancement: ${character.advancement_hooks.join(" ")}`,
        ""
      );
    }
    lines.push("## Party Bonds", "");
    party.relationships.forEach((relationship) => lines.push(`- **${relationship.from_name} + ${relationship.to_name}:** ${relationship.shared_history} Tension: ${relationship.tension} Repair: ${relationship.repair_question}`));
    lines.push("", "## Session Zero", "", `**Campaign promise:** ${party.session_zero.campaign_promise}`, "", ...party.session_zero.content_conversation.map((prompt) => `- ${prompt}`), "", ...party.session_zero.party_questions.map((prompt) => `- ${prompt}`), "", "## Campaign Threads", "");
    party.campaign_threads.forEach((thread) => lines.push(`- **${thread.title} [${thread.quest_id}]:** ${thread.invitation}`));
    lines.push("", "## Reference Ledger", "", ...party.reference_ledger.map((id) => `- ${id}`), "", `Generated by Loot Table Works Character Foundry. Build ${party.party_id}.`);
    return lines.join("\n");
  }

  function toCharacterMarkdown(character, party) {
    if (!character || !party?.validation?.valid) throw new Error("A valid character and party are required");
    return [
      `# ${character.name}`,
      "",
      `**Role:** ${character.role}  `,
      `**Pronouns:** ${character.pronouns}  `,
      `**Party:** ${party.party_name} [${party.party_id}]`,
      "",
      `**Contribution:** ${character.contribution}`,
      `**Drive:** ${character.drive}`,
      `**Ideal:** ${character.ideal}`,
      `**Edge:** ${character.edge}`,
      `**Burden:** ${character.burden}`,
      `**Private fear:** ${character.private_fear}`,
      `**Signature item:** ${character.signature_item.name} [${character.signature_item.item_id}]`,
      `**Origin:** ${character.origin}`,
      `**Campaign stake:** ${character.campaign_stake}`,
      `**Spotlight:** ${character.spotlight_question}`,
      "",
      "## Advancement",
      "",
      ...character.advancement_hooks.map((hook) => `- ${hook}`)
    ].join("\n");
  }

  function recommendProducts(limit = 3) {
    const priority = ["items", "quests", "merchants", "encounters", "recipes", "loot_profiles"];
    return priority.slice(0, Math.max(0, Number(limit) || 0)).map((id) => PRODUCTS.find((product) => product.id === id));
  }

  return { PRODUCTS, CAMPAIGN_MODES, TONES, COHESION, ROLES, hash, normalizeOptions, generate, toMarkdown, toCharacterMarkdown, recommendProducts };
});
