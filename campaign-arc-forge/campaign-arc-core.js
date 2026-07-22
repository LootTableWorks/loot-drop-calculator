(function attachCampaignArcCore(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CampaignArcCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCampaignArcCore() {
  "use strict";

  const PRODUCTS = Object.freeze([
    Object.freeze({ id: "items", code: "WF-01", title: "Item Catalog & Economy Kit", proof: "500 items", url: "https://loot-table-works.itch.io/original-fantasy-item-data-pack" }),
    Object.freeze({ id: "merchants", code: "WF-02", title: "Merchant & Shop Kit", proof: "150 merchants", url: "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit" }),
    Object.freeze({ id: "recipes", code: "WF-03", title: "Crafting & Recipe Kit", proof: "300 recipes", url: "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit" }),
    Object.freeze({ id: "loot_profiles", code: "WF-04", title: "Enemy Loot & Reward Kit", proof: "250 profiles", url: "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit" }),
    Object.freeze({ id: "quests", code: "WF-05", title: "Quest, Contract & Reward Kit", proof: "240 quests", url: "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit" }),
    Object.freeze({ id: "encounters", code: "WF-06", title: "Encounter & Threat Kit", proof: "180 encounters", url: "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit" })
  ]);

  const TONES = Object.freeze({
    grounded: Object.freeze({ label: "Grounded", promise: "Consequences remain concrete, local, and visible in the next session.", framing: "Put evidence, obligations, and material costs before spectacle." }),
    heroic: Object.freeze({ label: "Heroic", promise: "Every act gives the company a chance to protect people and change the region.", framing: "Make courage alter the board even when the objective is lost." }),
    intrigue: Object.freeze({ label: "Intrigue", promise: "Every faction holds part of the truth and every concession changes leverage.", framing: "Treat records, witnesses, and competing claims as active pressure." })
  });

  const PRESSURES = Object.freeze({
    measured: Object.freeze({ label: "Measured", clockSegments: 4, enemyDelta: -1, cadence: "Advance a front only after a visible warning is ignored." }),
    escalating: Object.freeze({ label: "Escalating", clockSegments: 5, enemyDelta: 0, cadence: "Advance one front after every costly resolution or abandoned objective." }),
    relentless: Object.freeze({ label: "Relentless", clockSegments: 6, enemyDelta: 1, cadence: "Advance a front whenever the company yields time, evidence, or territory." })
  });

  const ROLES = Object.freeze([
    Object.freeze({ id: "witness", label: "Witness", question: "Which official account do you know is incomplete?", pressure: "A source will speak only if you absorb their risk." }),
    Object.freeze({ id: "warden", label: "Warden", question: "Which route or community have you promised not to abandon?", pressure: "Protecting the objective means exposing someone else." }),
    Object.freeze({ id: "broker", label: "Broker", question: "Whose debt gives you leverage, and what will calling it in cost?", pressure: "A useful concession strengthens the wrong claimant." }),
    Object.freeze({ id: "scholar", label: "Field Scholar", question: "What material detail could prove the region's history?", pressure: "Preserving the record competes with immediate safety." }),
    Object.freeze({ id: "scout", label: "Route Scout", question: "Which unsafe path do you understand better than anyone?", pressure: "The reliable route is also the route the opposition expects." }),
    Object.freeze({ id: "maker", label: "Maker", question: "Which failing tool, structure, or supply chain can only you repair?", pressure: "A complete repair consumes something the company cannot replace." })
  ]);

  const GIVEN_NAMES = Object.freeze(["Alder", "Brin", "Caro", "Dessa", "Eris", "Fenn", "Gale", "Hollis", "Iven", "Jori", "Kest", "Lio", "Mara", "Neris", "Orin", "Perrin", "Quill", "Rhea", "Sable", "Tamsin", "Vale", "Wren"]);
  const BYNAMES = Object.freeze(["Ashwake", "Bell", "Cairn", "Dovetail", "Farrow", "Glass", "Hale", "Knot", "Morrow", "North", "Reed", "Shore", "Venn", "West"]);
  const FRONT_AGENDAS = Object.freeze([
    "Control the official account before the next contract is signed.",
    "Turn a failing route into exclusive leverage over trade and travel.",
    "Secure the region's disputed objects before their provenance is proved."
  ]);
  const FRONT_LEVERAGE = Object.freeze([
    "recognized witnesses, stamped records, and access to the harbor ledgers",
    "safe routes, maintenance crews, and control of scarce replacement stock",
    "armed claimants, hidden caches, and buyers who reward speed over proof"
  ]);
  const FRONT_CONCESSIONS = Object.freeze([
    "A witnessed transfer and a public correction to the ledger.",
    "Shared access backed by a concrete repair obligation.",
    "Return of one disputed asset without immunity for the larger scheme."
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

  function possessive(name) {
    return /s$/i.test(name) ? `${name}'` : `${name}'s`;
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
    const seed = String(input.seed || "storm-ledger-29").trim().slice(0, 64) || "storm-ledger-29";
    const sessions = Number(input.sessions || 6);
    const tone = input.tone || "grounded";
    const pressure = input.pressure || "escalating";
    const partySize = Number(input.partySize || 4);
    const maximumTier = Number(input.maximumTier || 3);
    if (![3, 6, 9].includes(sessions)) throw new Error("sessions must be 3, 6, or 9");
    if (!TONES[tone]) throw new Error(`Unsupported tone: ${tone}`);
    if (!PRESSURES[pressure]) throw new Error(`Unsupported pressure: ${pressure}`);
    if (!Number.isInteger(partySize) || partySize < 3 || partySize > 6) throw new Error("partySize must be an integer from 3 through 6");
    if (!Number.isInteger(maximumTier) || maximumTier < 1 || maximumTier > 5) throw new Error("maximumTier must be an integer from 1 through 5");
    return { seed, sessions, tone, pressure, partySize, maximumTier };
  }

  function buildIndex(source) {
    if (!source?.validation?.valid || !source.data || !source.relationships) throw new Error("A valid World Foundry source is required");
    return {
      nodes: new Map(source.relationships.nodes.map((node) => [node.id, node])),
      quests: new Map(source.data.quests.map((row) => [row.quest_id, row])),
      encounters: new Map(source.data.encounters.map((row) => [row.encounter_id, row])),
      locations: new Map(source.data.locations.map((row) => [row.location_id, row])),
      merchants: new Map(source.data.merchants.map((row) => [row.merchant_id, row])),
      lootProfiles: new Map(source.data.loot_profiles.map((row) => [row.profile_id, row])),
      items: new Map(source.data.items.map((row) => [row.id, row]))
    };
  }

  function buildFactionFronts(source, options) {
    const rawNames = [
      ...source.data.locations.map((row) => row.controlling_faction),
      ...source.data.loot_profiles.map((row) => row.faction),
      ...source.data.merchants.map((row) => row.shop_name)
    ].filter(Boolean);
    const names = ordered([...new Set(rawNames)], `${options.seed}|fronts`, (name) => name).slice(0, 3);
    return names.map((name, index) => ({
      front_id: `front-${hexHash(`${options.seed}|${name}`)}`,
      name,
      agenda: FRONT_AGENDAS[index],
      leverage: FRONT_LEVERAGE[index],
      concession: FRONT_CONCESSIONS[index],
      clock: { filled: 0, segments: PRESSURES[options.pressure].clockSegments },
      source_record_id: source.data.loot_profiles.find((row) => row.faction === name)?.profile_id || source.data.merchants.find((row) => row.shop_name === name)?.merchant_id || source.data.locations.find((row) => row.controlling_faction === name)?.location_id || null
    }));
  }

  function buildCharacterStakes(source, quests, options) {
    const roles = ordered(ROLES, `${options.seed}|roles`, (role) => role.id).slice(0, options.partySize);
    const names = ordered(GIVEN_NAMES, `${options.seed}|given`, (name) => name);
    const bynames = ordered(BYNAMES, `${options.seed}|bynames`, (name) => name);
    const itemPool = source.data.items.filter((item) => item.tier <= options.maximumTier);
    const items = ordered(itemPool.length ? itemPool : source.data.items, `${options.seed}|stake-items`, (item) => item.id);
    return roles.map((role, index) => ({
      stake_id: `stake-${hexHash(`${options.seed}|${role.id}|${index}`)}`,
      character_name: `${names[index]} ${bynames[index]}`,
      role_id: role.id,
      role: role.label,
      campaign_question: role.question,
      pressure_point: role.pressure,
      linked_item_id: items[index].id,
      linked_item_name: items[index].name,
      linked_quest_id: quests[index % quests.length].quest_id
    }));
  }

  function scaledOpposition(encounter, options) {
    const partyDelta = options.partySize <= 3 ? -1 : options.partySize >= 5 ? 1 : 0;
    return (encounter.enemy_groups || []).map((group) => ({
      profile_id: group.profile_id,
      enemy_name: group.enemy_name,
      role: group.combat_role,
      count: Math.max(1, group.count + partyDelta + PRESSURES[options.pressure].enemyDelta),
      purpose: group.purpose
    }));
  }

  function chooseEncounter(quest, encounters, index) {
    return encounters.find((encounter) => encounter.quest_hook_id === quest.quest_id) || encounters[index % encounters.length];
  }

  function buildSessions(source, index, quests, encounters, fronts, stakes, options) {
    const sessions = [];
    for (let position = 0; position < options.sessions; position += 1) {
      const number = position + 1;
      const act = Math.min(3, Math.floor((position * 3) / options.sessions) + 1);
      const quest = quests[position % quests.length];
      const encounter = chooseEncounter(quest, encounters, position);
      const location = index.locations.get(encounter.location_id) || index.locations.get(quest.location_id) || source.data.locations[0];
      const merchant = index.merchants.get(quest.giver_merchant_id) || source.data.merchants[position % source.data.merchants.length];
      const lootProfile = index.lootProfiles.get(encounter.reward_loot_profile_id) || index.lootProfiles.get(encounter.enemy_groups?.[0]?.profile_id) || source.data.loot_profiles[position % source.data.loot_profiles.length];
      const front = fronts[position % fronts.length];
      const spotlight = [stakes[position % stakes.length], stakes[(position + 1) % stakes.length]];
      const sessionId = `session-${String(number).padStart(2, "0")}-${hexHash(`${options.seed}|${number}|${quest.quest_id}|${encounter.encounter_id}`)}`;
      const sourceIds = [quest.quest_id, encounter.encounter_id, location.location_id, merchant?.merchant_id, lootProfile?.profile_id, quest.objective?.target_item_id, quest.reward_item_id, encounter.reward_connection_item_id, ...(encounter.enemy_groups || []).map((group) => group.profile_id)].filter(Boolean);
      sessions.push({
        session_id: sessionId,
        number,
        act,
        act_label: act === 1 ? "Establish the claim" : act === 2 ? "Break the easy answer" : "Settle the cost",
        title: quest.title,
        opening_image: `${merchant?.proprietor || quest.giver_name} brings the company a marked record while pressure builds at ${location.name}.`,
        objective: quest.objective.description,
        evidence: quest.complication,
        location: { location_id: location.location_id, name: location.name, hazard: location.local_hazard, access: location.access_condition },
        active_front: { front_id: front.front_id, name: front.name, agenda: front.agenda },
        encounter: {
          encounter_id: encounter.encounter_id,
          name: encounter.encounter_name,
          purpose: encounter.tactical_purpose,
          setup: encounter.setup,
          hazard: encounter.hazard.encounter_hazard,
          telegraph: encounter.hazard.telegraph,
          mitigation: encounter.hazard.mitigation,
          opposition: scaledOpposition(encounter, options),
          alternate_resolution: encounter.alternate_resolution,
          exit_condition: encounter.exit_condition
        },
        decision: [quest.alternate_resolution, encounter.alternate_resolution, `Accept ${possessive(front.name)} concession only if the company names the obligation it creates.`],
        spotlight_stake_ids: spotlight.map((stake) => stake.stake_id),
        spotlight_names: spotlight.map((stake) => stake.character_name),
        reward: {
          currency: quest.reward_currency,
          item_id: quest.reward_item_id || encounter.reward_connection_item_id || null,
          item_name: quest.reward_item_name || encounter.reward_connection_item_name || null,
          expected_encounter_value: encounter.expected_reward_value,
          identity: lootProfile?.reward_identity || "documented regional stock"
        },
        outcomes: {
          success: { label: "Clean win", summary: quest.world_impact, carry_forward: `Reduce ${possessive(front.name)} leverage before the next session.` },
          cost: { label: "Win at a cost", summary: quest.alternate_resolution, carry_forward: `Preserve the objective, but advance ${possessive(front.name)} clock by one.` },
          setback: { label: "Setback", summary: quest.failure_consequence, carry_forward: `Advance ${possessive(front.name)} clock by two and open the next session under pressure.` }
        },
        handoff: { next_session_id: null, unresolved_question: `Who records the company's decision about ${quest.objective.target_item_name || encounter.reward_connection_item_name || "the objective"}?`, next_opening: null },
        source_record_ids: [...new Set(sourceIds)].sort()
      });
    }
    sessions.forEach((session, position) => {
      const next = sessions[position + 1];
      session.handoff.next_session_id = next?.session_id || null;
      session.handoff.next_opening = next ? `Begin with the consequence of session ${session.number} already visible in ${next.location.name}.` : "End by naming which faction, route, and relationship changed permanently.";
    });
    return sessions;
  }

  function buildActs(sessions) {
    return [1, 2, 3].map((act) => {
      const rows = sessions.filter((session) => session.act === act);
      return {
        act,
        title: rows[0].act_label,
        purpose: act === 1 ? "Establish the region, the claim, and what the company cannot ignore." : act === 2 ? "Force competing truths, material costs, and faction pressure into the same decision." : "Resolve ownership and record what the company changed.",
        session_ids: rows.map((session) => session.session_id)
      };
    });
  }

  function validateReferences(sessions, stakes, fronts, index) {
    const ids = new Set();
    sessions.forEach((session) => session.source_record_ids.forEach((id) => ids.add(id)));
    stakes.forEach((stake) => { ids.add(stake.linked_item_id); ids.add(stake.linked_quest_id); });
    fronts.forEach((front) => { if (front.source_record_id) ids.add(front.source_record_id); });
    const values = [...ids].sort();
    return { values, missing: values.filter((id) => !index.nodes.has(id)) };
  }

  function generate(rawOptions, source) {
    const options = normalizeOptions(rawOptions);
    const index = buildIndex(source);
    const tierQuests = source.data.quests.filter((quest) => quest.tier <= options.maximumTier);
    const tierEncounters = source.data.encounters.filter((encounter) => encounter.tier <= options.maximumTier);
    const quests = ordered(tierQuests.length ? tierQuests : source.data.quests, `${options.seed}|quests`, (quest) => quest.quest_id);
    const encounters = ordered(tierEncounters.length ? tierEncounters : source.data.encounters, `${options.seed}|encounters`, (encounter) => encounter.encounter_id);
    const fronts = buildFactionFronts(source, options);
    const stakes = buildCharacterStakes(source, quests, options);
    const sessions = buildSessions(source, index, quests, encounters, fronts, stakes, options);
    const acts = buildActs(sessions);
    const references = validateReferences(sessions, stakes, fronts, index);
    const sessionIds = new Set(sessions.map((session) => session.session_id));
    const handoffsValid = sessions.every((session, position) => position === sessions.length - 1 ? session.handoff.next_session_id === null : session.handoff.next_session_id === sessions[position + 1].session_id);
    const arc = {
      schema_version: "1.0.0",
      generator: "Loot Table Works Campaign Arc Forge",
      arc_id: `caf-${hexHash([options.seed, options.sessions, options.tone, options.pressure, options.partySize, options.maximumTier].join("|"))}`,
      seed: options.seed,
      title: `${quests[0].title}: ${TONES[options.tone].label} Arc`,
      logline: `${quests[0].giver_name} draws the company into a ${options.sessions}-session struggle over ${quests[0].objective.target_item_name || "a disputed regional asset"}, while three fronts compete to control the official outcome.`,
      tone: options.tone,
      tone_label: TONES[options.tone].label,
      campaign_promise: TONES[options.tone].promise,
      gm_framing: TONES[options.tone].framing,
      pressure: options.pressure,
      pressure_label: PRESSURES[options.pressure].label,
      pressure_cadence: PRESSURES[options.pressure].cadence,
      session_count: options.sessions,
      party_size: options.partySize,
      maximum_tier: options.maximumTier,
      acts,
      faction_fronts: fronts,
      character_stakes: stakes,
      sessions,
      reference_ledger: references.values,
      source_summary: { assembly_id: source.assembly_id, entities: source.relationships.nodes.length, relationships: source.relationships.edges.length },
      validation: {
        valid: references.missing.length === 0 && sessions.length === options.sessions && sessionIds.size === sessions.length && acts.every((act) => act.session_ids.length > 0) && fronts.length === 3 && stakes.length === options.partySize && new Set(stakes.map((stake) => stake.role_id)).size === stakes.length && new Set(stakes.map((stake) => stake.linked_item_id)).size === stakes.length && handoffsValid,
        missing_reference_count: references.missing.length,
        missing_references: references.missing,
        session_count: sessions.length,
        act_count: acts.length,
        faction_front_count: fronts.length,
        character_stake_count: stakes.length,
        handoffs_valid: handoffsValid
      }
    };
    if (!arc.validation.valid) throw new Error("Generated campaign arc failed validation");
    return arc;
  }

  function applyOutcomes(arc, outcomes = {}) {
    if (!arc?.validation?.valid) throw new Error("A valid campaign arc is required");
    const allowed = new Set(["unresolved", "success", "cost", "setback"]);
    const clocks = Object.fromEntries(arc.faction_fronts.map((front) => [front.front_id, 0]));
    const ledger = arc.sessions.map((session) => {
      const status = outcomes[session.session_id] || "unresolved";
      if (!allowed.has(status)) throw new Error(`Unsupported outcome: ${status}`);
      const change = status === "success" ? -1 : status === "cost" ? 1 : status === "setback" ? 2 : 0;
      clocks[session.active_front.front_id] = Math.max(0, clocks[session.active_front.front_id] + change);
      const detail = status === "unresolved" ? { label: "Unresolved", summary: "Record the outcome after play.", carry_forward: session.handoff.next_opening } : session.outcomes[status];
      return { session_id: session.session_id, session_number: session.number, status, label: detail.label, summary: detail.summary, carry_forward: detail.carry_forward, front_id: session.active_front.front_id };
    });
    const factionClocks = arc.faction_fronts.map((front) => ({ ...front.clock, front_id: front.front_id, name: front.name, filled: Math.min(front.clock.segments, clocks[front.front_id]) }));
    return { outcomes: { ...outcomes }, ledger, faction_clocks: factionClocks, resolved_sessions: ledger.filter((entry) => entry.status !== "unresolved").length };
  }

  function toMarkdown(arc, outcomes = {}) {
    const state = applyOutcomes(arc, outcomes);
    const lines = [
      `# ${arc.title}`,
      "",
      `**Build:** ${arc.arc_id}  `,
      `**Seed:** ${arc.seed}  `,
      `**Length:** ${arc.session_count} sessions / 3 acts  `,
      `**Tone / pressure:** ${arc.tone_label} / ${arc.pressure_label}  `,
      `**Party:** ${arc.party_size} stake slots through tier ${arc.maximum_tier}`,
      "",
      arc.logline,
      "",
      `**Campaign promise:** ${arc.campaign_promise}`,
      `**GM framing:** ${arc.gm_framing}`,
      `**Pressure cadence:** ${arc.pressure_cadence}`,
      "",
      "## Faction Fronts",
      ""
    ];
    arc.faction_fronts.forEach((front) => lines.push(`### ${front.name}`, "", `- Agenda: ${front.agenda}`, `- Leverage: ${front.leverage}`, `- Concession: ${front.concession}`, `- Clock: ${front.clock.segments} segments`, ""));
    lines.push("## Character Stakes", "");
    arc.character_stakes.forEach((stake) => lines.push(`- **${stake.character_name} - ${stake.role}:** ${stake.campaign_question} Pressure: ${stake.pressure_point} Linked item: ${stake.linked_item_name} [${stake.linked_item_id}].`));
    lines.push("", "## Session Arc", "");
    arc.sessions.forEach((session) => {
      const outcome = state.ledger.find((entry) => entry.session_id === session.session_id);
      lines.push(
        `### Session ${session.number}: ${session.title}`,
        "",
        `**Act ${session.act}:** ${session.act_label}  `,
        `**Location:** ${session.location.name} [${session.location.location_id}]  `,
        `**Active front:** ${session.active_front.name}  `,
        `**Spotlight:** ${session.spotlight_names.join(" + ")}`,
        "",
        session.opening_image,
        "",
        `- Objective: ${session.objective}`,
        `- Evidence: ${session.evidence}`,
        `- Encounter: ${session.encounter.name} [${session.encounter.encounter_id}]`,
        `- Telegraph: ${session.encounter.telegraph}`,
        `- Mitigation: ${session.encounter.mitigation}`,
        `- Reward: ${session.reward.currency} currency${session.reward.item_name ? ` and ${session.reward.item_name}` : ""}`,
        `- Recorded outcome: ${outcome.label} - ${outcome.summary}`,
        `- Carry forward: ${outcome.carry_forward}`,
        `- Handoff question: ${session.handoff.unresolved_question}`,
        ""
      );
    });
    lines.push("## Faction Clock State", "");
    state.faction_clocks.forEach((front) => lines.push(`- ${front.name}: ${front.filled}/${front.segments}`));
    lines.push("", "## Reference Ledger", "", ...arc.reference_ledger.map((id) => `- ${id}`), "", `Generated by Loot Table Works Campaign Arc Forge. Build ${arc.arc_id}.`);
    return lines.join("\n");
  }

  function recommendProducts(limit = 6) {
    const priority = ["quests", "encounters", "loot_profiles", "merchants", "items", "recipes"];
    return priority.slice(0, Math.max(0, Number(limit) || 0)).map((id) => PRODUCTS.find((product) => product.id === id));
  }

  return { PRODUCTS, TONES, PRESSURES, ROLES, hash, normalizeOptions, generate, applyOutcomes, toMarkdown, recommendProducts };
});
