(function attachPlayerChronicleCore(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.PlayerChronicleCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createPlayerChronicleCore() {
  "use strict";

  const PRODUCTS = Object.freeze([
    Object.freeze({ id: "items", title: "Item Catalog & Economy Kit", proof: "500 items", url: "https://loot-table-works.itch.io/original-fantasy-item-data-pack" }),
    Object.freeze({ id: "merchants", title: "Merchant & Shop Kit", proof: "150 merchants", url: "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit" }),
    Object.freeze({ id: "recipes", title: "Crafting & Recipe Kit", proof: "300 recipes", url: "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit" }),
    Object.freeze({ id: "loot_profiles", title: "Enemy Loot & Reward Kit", proof: "250 profiles", url: "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit" }),
    Object.freeze({ id: "quests", title: "Quest, Contract & Reward Kit", proof: "240 quests", url: "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit" }),
    Object.freeze({ id: "encounters", title: "Encounter & Threat Kit", proof: "180 encounters", url: "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit" })
  ]);

  const ROLES = Object.freeze({
    trail_reader: Object.freeze({ label: "Trail Reader", contribution: "Reads dangerous ground before the group commits.", edge: "Name the safest route and its real cost.", burden: "Takes the worse path to keep someone else out of danger." }),
    warden: Object.freeze({ label: "Warden", contribution: "Holds threatened ground and creates room for others.", edge: "Decide what remains protected when pressure spikes.", burden: "Treats every abandoned position as a personal failure." }),
    broker: Object.freeze({ label: "Broker", contribution: "Finds the promise, debt, or price that changes a negotiation.", edge: "Expose the obligation no one wants named.", burden: "Owes a favor connected to the disputed cargo." }),
    field_scholar: Object.freeze({ label: "Field Scholar", contribution: "Connects evidence to provenance, craft, and local history.", edge: "Identify the detail that could not have been staged.", burden: "Cannot leave a useful record undocumented." }),
    scoundrel: Object.freeze({ label: "Scoundrel", contribution: "Gets through guarded spaces and spots overlooked access.", edge: "Reveal the entrance everyone else missed.", burden: "A former associate recognizes the method." }),
    weather_adept: Object.freeze({ label: "Weather Adept", contribution: "Turns wind, surf, flame, and pressure into an advantage.", edge: "Redirect a hostile environment for one decisive moment.", burden: "Every strong technique leaves visible evidence." })
  });

  const OUTCOMES = Object.freeze({
    triumph: Object.freeze({ label: "Triumph", momentum: 2, strain: -1, bond: 1, reputation: 1, line: "You secured the objective and changed what the group believes is possible." }),
    costly_win: Object.freeze({ label: "Costly win", momentum: 1, strain: 1, bond: 0, reputation: 0, line: "You got what mattered, but the price will shape the next decision." }),
    setback: Object.freeze({ label: "Setback", momentum: -1, strain: 2, bond: -1, reputation: -1, line: "The objective slipped away, but the failure exposed a usable truth." })
  });

  const FOCUSES = Object.freeze({
    quest: Object.freeze({ label: "Pursue a contract", question: "Which promise became harder to keep?", product: "quests" }),
    relationship: Object.freeze({ label: "Test a bond", question: "What did your companion learn about you?", product: "merchants" }),
    discovery: Object.freeze({ label: "Follow evidence", question: "Which detail changed your reading of the world?", product: "encounters" }),
    craft: Object.freeze({ label: "Make or repair", question: "What flaw did the work force you to confront?", product: "recipes" }),
    recovery: Object.freeze({ label: "Protect the company", question: "Who accepted help, and what did it cost?", product: "loot_profiles" })
  });

  const DOWNTIME = Object.freeze({
    recover: Object.freeze({ label: "Recover", momentum: 0, strain: -2, bond: 0, reputation: 0 }),
    craft: Object.freeze({ label: "Craft", momentum: 1, strain: 0, bond: 0, reputation: 0 }),
    research: Object.freeze({ label: "Research", momentum: 1, strain: 0, bond: 0, reputation: 1 }),
    bond: Object.freeze({ label: "Strengthen a bond", momentum: 0, strain: -1, bond: 2, reputation: 0 }),
    trade: Object.freeze({ label: "Trade and resupply", momentum: 0, strain: 0, bond: 0, reputation: 1 })
  });

  const GIVEN_NAMES = Object.freeze(["Alder", "Brin", "Caro", "Dessa", "Eris", "Fenn", "Gale", "Hollis", "Iven", "Jori", "Kest", "Mara", "Neris", "Orin", "Perrin", "Quill", "Rhea", "Sable", "Tamsin", "Vale", "Wren"]);
  const BYNAMES = Object.freeze(["Ashwake", "Bell", "Cairn", "Dovetail", "Farrow", "Glass", "Hale", "Knot", "Morrow", "North", "Reed", "Shore", "Venn", "West"]);
  const PRONOUNS = Object.freeze(["she/her", "he/him", "they/them"]);
  const COMPANIONS = Object.freeze(["the keeper who stayed behind", "a rival cartographer", "the contract witness", "a harbor medic", "a former guild partner", "the apprentice who found the first clue"]);
  const INTENTIONS = Object.freeze([
    "Ask for the evidence before accepting the next promise.",
    "Put another character in charge of the choice you usually control.",
    "Return to the unresolved witness before the faction can move them.",
    "Use the signature item to reveal a relationship, not just solve a problem.",
    "Name the cost you will not ask the company to pay again.",
    "Turn the last consequence into a concrete offer at the start of play."
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

  function pick(rows, seed, slot) {
    return rows[hash(`${seed}|${slot}`) % rows.length];
  }

  function ordered(rows, seed, keyOf) {
    return [...rows].sort((left, right) => hash(`${seed}|${keyOf(left)}`) - hash(`${seed}|${keyOf(right)}`) || String(keyOf(left)).localeCompare(String(keyOf(right))));
  }

  function clamp(value, minimum = 0, maximum = 6) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function cleanText(value, maximum = 64) {
    return String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maximum);
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

  function normalizeStartOptions(input = {}) {
    const seed = cleanText(input.seed || "saltline-17", 64) || "saltline-17";
    const role = input.role || "trail_reader";
    const name = cleanText(input.name, 48);
    const pronouns = cleanText(input.pronouns, 24) || pick(PRONOUNS, seed, "pronouns");
    if (!ROLES[role]) throw new Error(`Unsupported role: ${role}`);
    return { seed, role, name, pronouns };
  }

  function generatedCharacter(options, source, index) {
    const quest = ordered(source.data.quests, `${options.seed}|quest`, (row) => row.quest_id)[0];
    const location = index.locations.get(quest.location_id) || source.data.locations[0];
    const merchant = index.merchants.get(quest.giver_merchant_id) || source.data.merchants[0];
    const itemPool = source.data.items.filter((item) => item.tier <= 3);
    const item = ordered(itemPool, `${options.seed}|item`, (row) => row.id)[0];
    const role = ROLES[options.role];
    const name = options.name || `${pick(GIVEN_NAMES, options.seed, "given")} ${pick(BYNAMES, options.seed, "byname")}`;
    return {
      character_id: `pc-${hexHash(`${options.seed}|${name}|${options.role}`)}`,
      name,
      pronouns: options.pronouns,
      role_id: options.role,
      role: role.label,
      contribution: role.contribution,
      edge: role.edge,
      burden: role.burden,
      signature_item: { item_id: item.id, name: item.name, function: item.function, drawback: item.drawback },
      home_base: { location_id: location.location_id, name: location.name },
      active_thread: { quest_id: quest.quest_id, title: quest.title, complication: quest.complication },
      companion: pick(COMPANIONS, options.seed, "companion"),
      campaign_stake: `The official version of ${quest.title} omits a detail this character has seen before.`,
      source: "generated"
    };
  }

  function importedCharacter(party, characterId) {
    if (!party?.validation?.valid || !Array.isArray(party.characters) || !party.characters.length) throw new Error("A valid Character Foundry party is required");
    const character = party.characters.find((row) => row.character_id === characterId) || party.characters[0];
    return {
      character_id: character.character_id,
      name: cleanText(character.name, 48),
      pronouns: cleanText(character.pronouns, 24),
      role_id: character.role_id,
      role: character.role,
      contribution: character.contribution,
      edge: character.edge,
      burden: character.burden,
      signature_item: character.signature_item,
      home_base: party.home_base,
      active_thread: party.inciting_contract,
      companion: party.relationships?.find((bond) => bond.from_character_id === character.character_id)?.to_name || party.relationships?.find((bond) => bond.to_character_id === character.character_id)?.from_name || "a trusted company member",
      campaign_stake: character.campaign_stake,
      source: "character-foundry-import",
      party_id: party.party_id,
      party_name: party.party_name
    };
  }

  function referenceLedger(character, index) {
    const values = [character.signature_item?.item_id, character.home_base?.location_id, character.active_thread?.quest_id].filter(Boolean);
    const unique = [...new Set(values)].sort();
    return { values: unique, missing: unique.filter((id) => !index.nodes.has(id)) };
  }

  function create(rawOptions, source, party = null, characterId = null) {
    const options = normalizeStartOptions(rawOptions);
    const index = buildIndex(source);
    const character = party ? importedCharacter(party, characterId) : generatedCharacter(options, source, index);
    const references = referenceLedger(character, index);
    const chronicle = {
      schema_version: "1.0.0",
      generator: "Loot Table Works Player Chronicle",
      chronicle_id: `chronicle-${hexHash(`${options.seed}|${character.character_id}`)}`,
      seed: options.seed,
      character,
      state: { momentum: 2, strain: 0, bond: 1, reputation: 0 },
      sessions: [],
      open_threads: [{ id: character.active_thread.quest_id, title: character.active_thread.title, status: "active" }],
      reference_ledger: references.values,
      source_summary: { entities: source.relationships.nodes.length, relationships: source.relationships.edges.length, assembly_id: source.assembly_id },
      validation: { valid: references.missing.length === 0, missing_reference_count: references.missing.length, missing_references: references.missing, session_count: 0 }
    };
    if (!chronicle.validation.valid) throw new Error("Generated chronicle failed validation");
    return chronicle;
  }

  function normalizeSession(input = {}) {
    const focus = input.focus || "quest";
    const outcome = input.outcome || "costly_win";
    const downtime = input.downtime || "recover";
    const note = cleanText(input.note, 240);
    if (!FOCUSES[focus]) throw new Error(`Unsupported focus: ${focus}`);
    if (!OUTCOMES[outcome]) throw new Error(`Unsupported outcome: ${outcome}`);
    if (!DOWNTIME[downtime]) throw new Error(`Unsupported downtime: ${downtime}`);
    return { focus, outcome, downtime, note };
  }

  function sessionSource(seed, number, source) {
    const quest = pick(source.data.quests, seed, `session-${number}-quest`);
    const encounterMatches = source.data.encounters.filter((row) => row.quest_hook_id === quest.quest_id || row.location_id === quest.location_id);
    const encounter = pick(encounterMatches.length ? encounterMatches : source.data.encounters, seed, `session-${number}-encounter`);
    const recipe = pick(source.data.recipes, seed, `session-${number}-recipe`);
    const merchant = pick(source.data.merchants, seed, `session-${number}-merchant`);
    const item = pick(source.data.items, seed, `session-${number}-item`);
    return { quest, encounter, recipe, merchant, item };
  }

  function downtimeLine(mode, rows) {
    if (mode === "recover") return `Recover at ${rows.quest.location_name}; name what care looks like when no one is performing competence.`;
    if (mode === "craft") return `Work on ${rows.recipe.recipe_name} at a ${rows.recipe.station}; decide which flaw remains visible.`;
    if (mode === "research") return `Investigate ${rows.quest.title}; identify one witness and one record that disagree.`;
    if (mode === "bond") return `Meet ${rows.merchant.proprietor || rows.merchant.shop_name}; ask for help without turning the request into a transaction.`;
    return `Trade for ${rows.item.name} through ${rows.merchant.shop_name}; decide which favor is more expensive than the listed price.`;
  }

  function appendSession(chronicle, rawInput, source) {
    if (!chronicle?.validation?.valid || !Array.isArray(chronicle.sessions)) throw new Error("A valid chronicle is required");
    if (chronicle.sessions.length >= 12) throw new Error("A chronicle supports up to 12 sessions");
    buildIndex(source);
    const input = normalizeSession(rawInput);
    const number = chronicle.sessions.length + 1;
    const outcome = OUTCOMES[input.outcome];
    const downtime = DOWNTIME[input.downtime];
    const focus = FOCUSES[input.focus];
    const rows = sessionSource(chronicle.seed, number, source);
    const before = { ...chronicle.state };
    const after = {
      momentum: clamp(before.momentum + outcome.momentum + downtime.momentum),
      strain: clamp(before.strain + outcome.strain + downtime.strain),
      bond: clamp(before.bond + outcome.bond + downtime.bond),
      reputation: clamp(before.reputation + outcome.reputation + downtime.reputation, -3, 6)
    };
    const entry = {
      session_id: `${chronicle.chronicle_id}-s${String(number).padStart(2, "0")}`,
      number,
      focus: input.focus,
      focus_label: focus.label,
      outcome: input.outcome,
      outcome_label: outcome.label,
      downtime: input.downtime,
      downtime_label: downtime.label,
      recap: outcome.line,
      reflection_question: focus.question,
      downtime_prompt: downtimeLine(input.downtime, rows),
      next_intention: pick(INTENTIONS, chronicle.seed, `session-${number}-intention`),
      note: input.note,
      source_links: [rows.quest.quest_id, rows.encounter.encounter_id, rows.recipe.recipe_id, rows.merchant.merchant_id, rows.item.id],
      state_before: before,
      state_after: after
    };
    const index = buildIndex(source);
    const referenceLedgerValues = [...new Set([...chronicle.reference_ledger, ...entry.source_links])].sort();
    const missing = referenceLedgerValues.filter((id) => !index.nodes.has(id));
    const next = JSON.parse(JSON.stringify(chronicle));
    next.state = after;
    next.sessions.push(entry);
    next.reference_ledger = referenceLedgerValues;
    next.open_threads.push({ id: rows.quest.quest_id, title: rows.quest.title, status: input.outcome === "triumph" ? "resolved" : "open", introduced_in: number });
    next.validation = { valid: missing.length === 0 && next.sessions.length === number, missing_reference_count: missing.length, missing_references: missing, session_count: number };
    if (!next.validation.valid) throw new Error("Updated chronicle failed validation");
    return next;
  }

  function validateImport(value, source) {
    const index = buildIndex(source);
    if (!value || value.generator !== "Loot Table Works Player Chronicle" || value.schema_version !== "1.0.0") throw new Error("This is not a Player Chronicle v1 file");
    if (!value.character?.character_id || !Array.isArray(value.sessions) || value.sessions.length > 12) throw new Error("The chronicle file is incomplete");
    const missing = (value.reference_ledger || []).filter((id) => !index.nodes.has(id));
    if (missing.length) throw new Error(`Chronicle contains ${missing.length} unknown source IDs`);
    return JSON.parse(JSON.stringify(value));
  }

  function toMarkdown(chronicle) {
    if (!chronicle?.validation?.valid) throw new Error("A valid chronicle is required");
    const character = chronicle.character;
    const lines = [
      `# ${character.name}: Player Chronicle`, "",
      `**Role:** ${character.role}  `,
      `**Pronouns:** ${character.pronouns}  `,
      `**Chronicle:** ${chronicle.chronicle_id}  `,
      `**Seed:** ${chronicle.seed}  `,
      `**Home:** ${character.home_base.name} [${character.home_base.location_id}]`, "",
      character.contribution, "",
      `**Edge:** ${character.edge}`,
      `**Burden:** ${character.burden}`,
      `**Signature item:** ${character.signature_item.name} [${character.signature_item.item_id}]`,
      `**Campaign stake:** ${character.campaign_stake}`, "",
      "## Current State", "",
      `- Momentum: ${chronicle.state.momentum}/6`,
      `- Strain: ${chronicle.state.strain}/6`,
      `- Bond: ${chronicle.state.bond}/6`,
      `- Reputation: ${chronicle.state.reputation}`, "",
      "## Session Timeline", ""
    ];
    if (!chronicle.sessions.length) lines.push("No sessions recorded yet.", "");
    chronicle.sessions.forEach((session) => lines.push(
      `### Session ${session.number}: ${session.focus_label} / ${session.outcome_label}`, "",
      session.recap,
      `- Reflection: ${session.reflection_question}`,
      `- Downtime: ${session.downtime_prompt}`,
      `- Next intention: ${session.next_intention}`,
      session.note ? `- Player note: ${session.note}` : "- Player note: -",
      `- State: momentum ${session.state_after.momentum}, strain ${session.state_after.strain}, bond ${session.state_after.bond}, reputation ${session.state_after.reputation}`, ""
    ));
    lines.push("## Reference Ledger", "", ...chronicle.reference_ledger.map((id) => `- ${id}`), "", `Generated by Loot Table Works Player Chronicle. Build ${chronicle.chronicle_id}.`);
    return lines.join("\n");
  }

  function recommendProducts(chronicle, limit = 6) {
    const recent = chronicle?.sessions?.at(-1)?.focus;
    const priority = recent ? [FOCUSES[recent].product, "items", "quests", "recipes", "merchants", "encounters", "loot_profiles"] : ["items", "quests", "recipes", "merchants", "encounters", "loot_profiles"];
    return [...new Set(priority)].slice(0, Math.max(0, Number(limit) || 0)).map((id) => PRODUCTS.find((product) => product.id === id));
  }

  return { PRODUCTS, ROLES, OUTCOMES, FOCUSES, DOWNTIME, hash, normalizeStartOptions, normalizeSession, create, appendSession, validateImport, toMarkdown, recommendProducts };
});
