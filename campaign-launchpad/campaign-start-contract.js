(function attachCampaignStartContract(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CampaignStartContract = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCampaignStartContract() {
  "use strict";

  const VERSION = "1.0.0";
  const DOCUMENT_TYPE = "loot-table-works.campaign-start";
  const LAUNCHPAD_GENERATOR = "Loot Table Works Campaign Launchpad";
  const ONE_SHOT_GENERATOR = "Loot Table Works One-Shot Forge";
  const TOOL_IDS = Object.freeze(["world", "party", "session", "arc", "chronicle"]);
  const PRODUCT_IDS = Object.freeze(["items", "merchants", "recipes", "loot", "quests", "encounters"]);
  const SCOPE_PRESETS = Object.freeze({
    tonight: Object.freeze({ label: "One night", sessions: 3, duration: 120, threat: "forgiving" }),
    full_evening: Object.freeze({ label: "Full evening", sessions: 3, duration: 180, threat: "standard" }),
    mini_arc: Object.freeze({ label: "Mini arc", sessions: 6, duration: 180, threat: "standard" }),
    campaign: Object.freeze({ label: "Campaign", sessions: 9, duration: 240, threat: "dangerous" })
  });
  const SPOTLIGHT_PRESETS = Object.freeze({
    exploration: Object.freeze({ label: "Exploration", tone: "heroic", products: ["encounters", "quests", "items"] }),
    intrigue: Object.freeze({ label: "Intrigue", tone: "mystery", products: ["quests", "merchants", "items"] }),
    survival: Object.freeze({ label: "Survival", tone: "peril", products: ["encounters", "loot", "recipes"] })
  });
  const THREAT_SEGMENTS = Object.freeze({ forgiving: 4, standard: 5, dangerous: 6 });

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function hash(text) {
    let value = 2166136261;
    for (const character of String(text)) {
      value ^= character.charCodeAt(0);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function hexHash(text) {
    return hash(text).toString(16).padStart(8, "0");
  }

  function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    if (isObject(value)) {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function sortedUnique(values) {
    return [...new Set(values)].sort();
  }

  function arraysEqual(left, right) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => value === right[index]);
  }

  function addError(errors, path, message) {
    errors.push(`${path}: ${message}`);
  }

  function requireString(value, path, errors) {
    if (!isNonEmptyString(value)) addError(errors, path, "must be a non-empty string.");
  }

  function parseQuery(url, path, errors) {
    if (!isNonEmptyString(url)) {
      addError(errors, path, "must be a non-empty URL.");
      return {};
    }
    const queryStart = url.indexOf("?");
    if (queryStart < 0) {
      addError(errors, path, "must include query parameters.");
      return {};
    }
    const result = {};
    const query = url.slice(queryStart + 1).split("#", 1)[0];
    for (const pair of query.split("&")) {
      if (!pair) continue;
      const separator = pair.indexOf("=");
      const rawKey = separator < 0 ? pair : pair.slice(0, separator);
      const rawValue = separator < 0 ? "" : pair.slice(separator + 1);
      try {
        const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
        const value = decodeURIComponent(rawValue.replace(/\+/g, " "));
        result[key] = value;
      } catch (error) {
        addError(errors, path, `contains an invalid encoded query component (${error.message}).`);
      }
    }
    return result;
  }

  function expectedLaunchpadId(options) {
    return `CL-${hexHash(`${options.seed}|${options.scope}|${options.spotlight}|${options.party}|${options.tier}`)}`;
  }

  function expectedAdventureId(oneShot) {
    return `osf-${hexHash([
      oneShot.seed,
      oneShot.tone,
      oneShot.threat,
      oneShot.duration_minutes,
      oneShot.party_size,
      oneShot.maximum_tier
    ].join("|"))}`;
  }

  function validateLaunchpad(plan) {
    const errors = [];
    if (!isObject(plan)) {
      return { valid: false, errors: ["launchpad: must be an object."] };
    }

    if (plan.generator !== LAUNCHPAD_GENERATOR) addError(errors, "launchpad.generator", `must equal "${LAUNCHPAD_GENERATOR}".`);
    if (plan.version !== "1.0.0") addError(errors, "launchpad.version", "must equal 1.0.0.");
    requireString(plan.title, "launchpad.title", errors);
    requireString(plan.promise, "launchpad.promise", errors);
    requireString(plan.scope_summary, "launchpad.scope_summary", errors);

    const options = plan.options;
    if (!isObject(options)) {
      addError(errors, "launchpad.options", "must be an object.");
    } else {
      requireString(options.seed, "launchpad.options.seed", errors);
      if (!SCOPE_PRESETS[options.scope]) addError(errors, "launchpad.options.scope", `unsupported scope "${options.scope}".`);
      if (!SPOTLIGHT_PRESETS[options.spotlight]) addError(errors, "launchpad.options.spotlight", `unsupported spotlight "${options.spotlight}".`);
      if (!Number.isInteger(options.party) || options.party < 3 || options.party > 6) {
        addError(errors, "launchpad.options.party", "must be an integer from 3 through 6.");
      }
      if (!Number.isInteger(options.tier) || options.tier < 1 || options.tier > 5) {
        addError(errors, "launchpad.options.tier", "must be an integer from 1 through 5.");
      }
      if (isNonEmptyString(options.seed) && SCOPE_PRESETS[options.scope] && SPOTLIGHT_PRESETS[options.spotlight]
        && Number.isInteger(options.party) && Number.isInteger(options.tier)) {
        const expectedId = expectedLaunchpadId(options);
        if (plan.plan_id !== expectedId) addError(errors, "launchpad.plan_id", `must equal deterministic ID ${expectedId}.`);
      }
    }

    if (!Array.isArray(plan.tools) || plan.tools.length !== TOOL_IDS.length) {
      addError(errors, "launchpad.tools", `must contain exactly ${TOOL_IDS.length} routes.`);
    } else {
      const seenIds = new Set();
      plan.tools.forEach((tool, index) => {
        const path = `launchpad.tools[${index}]`;
        if (!isObject(tool)) {
          addError(errors, path, "must be an object.");
          return;
        }
        if (tool.id !== TOOL_IDS[index]) addError(errors, `${path}.id`, `must equal "${TOOL_IDS[index]}".`);
        if (seenIds.has(tool.id)) addError(errors, `${path}.id`, `duplicates "${tool.id}".`);
        seenIds.add(tool.id);
        if (tool.step !== index + 1) addError(errors, `${path}.step`, `must equal ${index + 1}.`);
        requireString(tool.title, `${path}.title`, errors);
        requireString(tool.outcome, `${path}.outcome`, errors);
        requireString(tool.cta, `${path}.cta`, errors);
        const query = parseQuery(tool.url, `${path}.url`, errors);
        if (options && query.seed !== String(options.seed)) addError(errors, `${path}.url`, "seed query does not match launchpad options.");
        if (query.utm_source !== "campaign_launchpad"
          || query.utm_medium !== "guided_workflow"
          || query.utm_campaign !== "campaign_launchpad_v1") {
          addError(errors, `${path}.url`, "campaign attribution query is incomplete or malformed.");
        }
      });
    }

    const spotlight = options && SPOTLIGHT_PRESETS[options.spotlight];
    if (!Array.isArray(plan.products) || plan.products.length !== 3) {
      addError(errors, "launchpad.products", "must contain exactly three recommendations.");
    } else {
      const productIds = plan.products.map((product) => product?.id);
      if (new Set(productIds).size !== productIds.length) addError(errors, "launchpad.products", "contains duplicate product IDs.");
      if (productIds.some((id) => !PRODUCT_IDS.includes(id))) addError(errors, "launchpad.products", "contains an unsupported product ID.");
      if (spotlight && !arraysEqual(productIds, spotlight.products)) {
        addError(errors, "launchpad.products", `must match the ${options.spotlight} recommendation order.`);
      }
      plan.products.forEach((product, index) => {
        const path = `launchpad.products[${index}]`;
        if (!isObject(product)) {
          addError(errors, path, "must be an object.");
          return;
        }
        requireString(product.code, `${path}.code`, errors);
        requireString(product.title, `${path}.title`, errors);
        const query = parseQuery(product.tracked_url, `${path}.tracked_url`, errors);
        if (query.utm_source !== "campaign_launchpad"
          || query.utm_medium !== "guided_recommendation"
          || query.utm_campaign !== "campaign_launchpad_v1") {
          addError(errors, `${path}.tracked_url`, "recommendation attribution query is incomplete or malformed.");
        }
      });
    }

    if (plan.paid_total_usd !== 9) addError(errors, "launchpad.paid_total_usd", "must equal 9.");
    if (!isObject(plan.validation) || plan.validation.valid !== true) {
      addError(errors, "launchpad.validation.valid", "must be true.");
    } else {
      if (plan.validation.free_tool_routes !== TOOL_IDS.length) addError(errors, "launchpad.validation.free_tool_routes", `must equal ${TOOL_IDS.length}.`);
      if (plan.validation.paid_destinations !== 3) addError(errors, "launchpad.validation.paid_destinations", "must equal 3.");
      if (plan.validation.gated_destinations !== 0) addError(errors, "launchpad.validation.gated_destinations", "must equal 0.");
    }

    return { valid: errors.length === 0, errors };
  }

  function collectExpectedOneShotReferences(oneShot, errors) {
    const ids = new Set();
    const add = (value, path, required = false) => {
      if (isNonEmptyString(value)) ids.add(value);
      else if (required) addError(errors, path, "must be a non-empty source ID.");
    };
    const records = oneShot.source_records;
    if (!isObject(records)) {
      addError(errors, "oneShot.source_records", "must be an object.");
      return [];
    }

    const quest = records.quest;
    const encounter = records.encounter;
    const location = records.location;
    const merchant = records.merchant;
    const lootProfile = records.loot_profile;
    if (!isObject(quest)) addError(errors, "oneShot.source_records.quest", "must be an object.");
    if (!isObject(encounter)) addError(errors, "oneShot.source_records.encounter", "must be an object.");
    if (!isObject(location)) addError(errors, "oneShot.source_records.location", "must be an object.");
    add(quest?.quest_id, "oneShot.source_records.quest.quest_id", true);
    add(encounter?.encounter_id, "oneShot.source_records.encounter.encounter_id", true);
    add(location?.location_id, "oneShot.source_records.location.location_id", true);
    add(merchant?.merchant_id, "oneShot.source_records.merchant.merchant_id");
    add(lootProfile?.profile_id, "oneShot.source_records.loot_profile.profile_id");

    if (isNonEmptyString(encounter?.quest_hook_id) && encounter.quest_hook_id !== quest?.quest_id) {
      addError(errors, "oneShot.source_records.encounter.quest_hook_id", "does not resolve to the embedded quest.");
    }
    const expectedLocationId = encounter?.location_id || quest?.location_id;
    if (isNonEmptyString(expectedLocationId) && expectedLocationId !== location?.location_id) {
      addError(errors, "oneShot.source_records.location.location_id", "does not resolve the encounter or quest location.");
    }
    if (isNonEmptyString(quest?.giver_merchant_id) && quest.giver_merchant_id !== merchant?.merchant_id) {
      addError(errors, "oneShot.source_records.merchant.merchant_id", "does not resolve the quest giver.");
    }
    if (isNonEmptyString(encounter?.reward_loot_profile_id)) {
      if (!isObject(lootProfile)) {
        addError(errors, "oneShot.source_records.loot_profile", "is required by the encounter reward profile reference.");
      } else if (encounter.reward_loot_profile_id !== lootProfile.profile_id) {
        addError(errors, "oneShot.source_records.loot_profile.profile_id", "does not resolve the encounter reward profile.");
      }
    }

    if (!Array.isArray(oneShot.opposition) || oneShot.opposition.length === 0) {
      addError(errors, "oneShot.opposition", "must contain at least one enemy group.");
    } else {
      oneShot.opposition.forEach((group, index) => add(group?.profile_id, `oneShot.opposition[${index}].profile_id`, true));
    }
    add(quest?.objective?.target_item_id, "oneShot.source_records.quest.objective.target_item_id");
    add(quest?.reward_item_id, "oneShot.source_records.quest.reward_item_id");
    add(encounter?.reward_connection_item_id, "oneShot.source_records.encounter.reward_connection_item_id");
    add(quest?.related_recipe_id, "oneShot.source_records.quest.related_recipe_id");

    const expectedRewardId = quest?.reward_item_id || encounter?.reward_connection_item_id || null;
    if ((oneShot.rewards?.item_id || null) !== expectedRewardId) {
      addError(errors, "oneShot.rewards.item_id", "does not match the generated quest or encounter reward.");
    }
    return [...ids].sort();
  }

  function validateOneShot(oneShot) {
    const errors = [];
    if (!isObject(oneShot)) {
      return { valid: false, errors: ["oneShot: must be an object."], expected_reference_ledger: [] };
    }
    if (oneShot.generator !== ONE_SHOT_GENERATOR) addError(errors, "oneShot.generator", `must equal "${ONE_SHOT_GENERATOR}".`);
    if (oneShot.schema_version !== "1.0.0") addError(errors, "oneShot.schema_version", "must equal 1.0.0.");
    requireString(oneShot.seed, "oneShot.seed", errors);
    requireString(oneShot.title, "oneShot.title", errors);
    requireString(oneShot.logline, "oneShot.logline", errors);
    if (!["heroic", "mystery", "peril"].includes(oneShot.tone)) addError(errors, "oneShot.tone", `unsupported tone "${oneShot.tone}".`);
    if (!Object.hasOwn(THREAT_SEGMENTS, oneShot.threat)) addError(errors, "oneShot.threat", `unsupported threat "${oneShot.threat}".`);
    if (![120, 180, 240].includes(oneShot.duration_minutes)) addError(errors, "oneShot.duration_minutes", "must be 120, 180, or 240.");
    if (!Number.isInteger(oneShot.party_size) || oneShot.party_size < 3 || oneShot.party_size > 6) {
      addError(errors, "oneShot.party_size", "must be an integer from 3 through 6.");
    }
    if (!Number.isInteger(oneShot.maximum_tier) || oneShot.maximum_tier < 1 || oneShot.maximum_tier > 5) {
      addError(errors, "oneShot.maximum_tier", "must be an integer from 1 through 5.");
    }
    if (isNonEmptyString(oneShot.seed)
      && ["heroic", "mystery", "peril"].includes(oneShot.tone)
      && Object.hasOwn(THREAT_SEGMENTS, oneShot.threat)
      && [120, 180, 240].includes(oneShot.duration_minutes)
      && Number.isInteger(oneShot.party_size)
      && Number.isInteger(oneShot.maximum_tier)) {
      const expectedId = expectedAdventureId(oneShot);
      if (oneShot.adventure_id !== expectedId) addError(errors, "oneShot.adventure_id", `must equal deterministic ID ${expectedId}.`);
    }

    let scheduledMinutes = 0;
    if (!Array.isArray(oneShot.scenes) || oneShot.scenes.length !== 5) {
      addError(errors, "oneShot.scenes", "must contain exactly five scenes.");
    } else {
      const sceneIds = new Set();
      oneShot.scenes.forEach((scene, index) => {
        const path = `oneShot.scenes[${index}]`;
        requireString(scene?.id, `${path}.id`, errors);
        if (sceneIds.has(scene?.id)) addError(errors, `${path}.id`, `duplicates "${scene?.id}".`);
        sceneIds.add(scene?.id);
        if (scene?.order !== index + 1) addError(errors, `${path}.order`, `must equal ${index + 1}.`);
        if (!Number.isInteger(scene?.minutes) || scene.minutes <= 0) addError(errors, `${path}.minutes`, "must be a positive integer.");
        else scheduledMinutes += scene.minutes;
        requireString(scene?.title, `${path}.title`, errors);
      });
      if (scheduledMinutes !== oneShot.duration_minutes) addError(errors, "oneShot.scenes", "scheduled minutes do not equal duration_minutes.");
    }

    if (!Array.isArray(oneShot.characters) || oneShot.characters.length !== oneShot.party_size) {
      addError(errors, "oneShot.characters", "count must equal party_size.");
    } else {
      const characterIds = new Set();
      oneShot.characters.forEach((character, index) => {
        const path = `oneShot.characters[${index}]`;
        requireString(character?.character_id, `${path}.character_id`, errors);
        if (characterIds.has(character?.character_id)) addError(errors, `${path}.character_id`, `duplicates "${character?.character_id}".`);
        characterIds.add(character?.character_id);
        requireString(character?.name, `${path}.name`, errors);
      });
    }
    if (!Array.isArray(oneShot.clues) || oneShot.clues.length !== 4) {
      addError(errors, "oneShot.clues", "must contain exactly four clues.");
    } else {
      oneShot.clues.forEach((clue, index) => {
        requireString(clue?.id, `oneShot.clues[${index}].id`, errors);
        requireString(clue?.clue, `oneShot.clues[${index}].clue`, errors);
        requireString(clue?.reveals, `oneShot.clues[${index}].reveals`, errors);
        requireString(clue?.fail_forward, `oneShot.clues[${index}].fail_forward`, errors);
      });
    }
    if (!isObject(oneShot.countdown) || oneShot.countdown.segments !== THREAT_SEGMENTS[oneShot.threat]) {
      addError(errors, "oneShot.countdown.segments", "does not match the threat preset.");
    }

    const expectedReferences = collectExpectedOneShotReferences(oneShot, errors);
    if (!Array.isArray(oneShot.reference_ledger)) {
      addError(errors, "oneShot.reference_ledger", "must be an array.");
    } else {
      if (oneShot.reference_ledger.some((id) => !isNonEmptyString(id))) addError(errors, "oneShot.reference_ledger", "contains a malformed source ID.");
      if (new Set(oneShot.reference_ledger).size !== oneShot.reference_ledger.length) addError(errors, "oneShot.reference_ledger", "contains duplicate source IDs.");
      if (!arraysEqual(oneShot.reference_ledger, expectedReferences)) {
        addError(errors, "oneShot.reference_ledger", "does not exactly match the references used by the generated source records.");
      }
    }

    if (!isObject(oneShot.validation) || oneShot.validation.valid !== true) {
      addError(errors, "oneShot.validation.valid", "must be true.");
    } else {
      if (oneShot.validation.missing_reference_count !== 0) addError(errors, "oneShot.validation.missing_reference_count", "must equal 0.");
      if (!Array.isArray(oneShot.validation.missing_references) || oneShot.validation.missing_references.length !== 0) {
        addError(errors, "oneShot.validation.missing_references", "must be an empty array.");
      }
      if (oneShot.validation.scheduled_minutes !== scheduledMinutes) addError(errors, "oneShot.validation.scheduled_minutes", "does not match the scene schedule.");
      if (oneShot.validation.scene_count !== oneShot.scenes?.length) addError(errors, "oneShot.validation.scene_count", "does not match scenes.");
      if (oneShot.validation.character_count !== oneShot.characters?.length) addError(errors, "oneShot.validation.character_count", "does not match characters.");
    }

    return { valid: errors.length === 0, errors, expected_reference_ledger: expectedReferences };
  }

  function validateSourcePair(launchpad, oneShot) {
    const launchpadValidation = validateLaunchpad(launchpad);
    const oneShotValidation = validateOneShot(oneShot);
    const errors = [
      ...launchpadValidation.errors,
      ...oneShotValidation.errors
    ];
    if (!launchpadValidation.valid || !oneShotValidation.valid) {
      return { valid: false, errors };
    }

    const scope = SCOPE_PRESETS[launchpad.options.scope];
    const spotlight = SPOTLIGHT_PRESETS[launchpad.options.spotlight];
    const sessionRoute = launchpad.tools.find((tool) => tool.id === "session");
    const routeErrors = [];
    const route = parseQuery(sessionRoute.url, "launchpad session route", routeErrors);
    errors.push(...routeErrors);
    const expected = {
      seed: String(launchpad.options.seed),
      party: String(launchpad.options.party),
      tier: String(launchpad.options.tier),
      tone: spotlight.tone,
      threat: scope.threat,
      duration: String(scope.duration)
    };
    for (const [key, value] of Object.entries(expected)) {
      if (route[key] !== value) addError(errors, `launchpad session route.${key}`, `must equal "${value}".`);
    }
    if (!/\/one-shot-forge\/(?:\?|$)/.test(sessionRoute.url)) {
      addError(errors, "launchpad session route.url", "must target One-Shot Forge.");
    }
    if (oneShot.seed !== launchpad.options.seed) addError(errors, "source pair.seed", "One-Shot seed does not match Campaign Launchpad.");
    if (oneShot.party_size !== launchpad.options.party) addError(errors, "source pair.party_size", "One-Shot party size does not match Campaign Launchpad.");
    if (oneShot.maximum_tier !== launchpad.options.tier) addError(errors, "source pair.maximum_tier", "One-Shot maximum tier does not match Campaign Launchpad.");
    if (oneShot.tone !== spotlight.tone) addError(errors, "source pair.tone", "One-Shot tone does not match the Launchpad spotlight.");
    if (oneShot.threat !== scope.threat) addError(errors, "source pair.threat", "One-Shot threat does not match the Launchpad scope.");
    if (oneShot.duration_minutes !== scope.duration) addError(errors, "source pair.duration_minutes", "One-Shot duration does not match the Launchpad scope.");
    return { valid: errors.length === 0, errors };
  }

  function buildSourceLedger(launchpad, oneShot) {
    const toolIds = launchpad.tools.map((tool) => tool.id);
    const productIds = launchpad.products.map((product) => product.id);
    const sceneIds = oneShot.scenes.map((scene) => scene.id);
    const characterIds = oneShot.characters.map((character) => character.character_id);
    const worldFoundryReferences = [...oneShot.reference_ledger];
    return {
      campaign_launchpad: {
        plan_id: launchpad.plan_id,
        tool_ids: toolIds,
        product_ids: productIds
      },
      one_shot_forge: {
        adventure_id: oneShot.adventure_id,
        scene_ids: sceneIds,
        character_ids: characterIds,
        world_foundry_reference_ledger: worldFoundryReferences
      },
      all_source_ids: sortedUnique([
        launchpad.plan_id,
        oneShot.adventure_id,
        ...toolIds,
        ...productIds,
        ...sceneIds,
        ...characterIds,
        ...worldFoundryReferences
      ])
    };
  }

  function campaignStartFingerprint(start) {
    return stableStringify({
      schema_version: start.schema_version,
      document_type: start.document_type,
      campaign: start.campaign,
      workflow: start.workflow,
      opening_session: start.opening_session,
      source_ledger: start.source_ledger
    });
  }

  function validateCampaignStart(start) {
    const errors = [];
    if (!isObject(start)) return { valid: false, errors: ["campaignStart: must be an object."] };
    if (start.schema_version !== VERSION) addError(errors, "campaignStart.schema_version", `must equal ${VERSION}.`);
    if (start.document_type !== DOCUMENT_TYPE) addError(errors, "campaignStart.document_type", `must equal "${DOCUMENT_TYPE}".`);
    if (!isObject(start.campaign)) addError(errors, "campaignStart.campaign", "must be an object.");
    if (!isObject(start.workflow)) addError(errors, "campaignStart.workflow", "must be a Campaign Launchpad document.");
    if (!isObject(start.opening_session)) addError(errors, "campaignStart.opening_session", "must be a One-Shot Forge document.");

    if (isObject(start.workflow) && isObject(start.opening_session)) {
      const pairValidation = validateSourcePair(start.workflow, start.opening_session);
      errors.push(...pairValidation.errors);
      if (pairValidation.valid && isObject(start.campaign)) {
        const scope = SCOPE_PRESETS[start.workflow.options.scope];
        const spotlight = SPOTLIGHT_PRESETS[start.workflow.options.spotlight];
        const expectedCampaign = {
          seed: start.workflow.options.seed,
          title: start.workflow.title,
          scope: start.workflow.options.scope,
          scope_label: scope.label,
          spotlight: start.workflow.options.spotlight,
          spotlight_label: spotlight.label,
          party_size: start.workflow.options.party,
          maximum_tier: start.workflow.options.tier,
          planned_sessions: scope.sessions,
          opening_adventure_id: start.opening_session.adventure_id
        };
        if (stableStringify(start.campaign) !== stableStringify(expectedCampaign)) {
          addError(errors, "campaignStart.campaign", "does not match the normalized producer settings.");
        }
      }
    }

    if (!isObject(start.source_ledger)) {
      addError(errors, "campaignStart.source_ledger", "must be an object.");
    } else if (isObject(start.workflow) && isObject(start.opening_session)) {
      const expectedLedger = buildSourceLedger(start.workflow, start.opening_session);
      if (stableStringify(start.source_ledger) !== stableStringify(expectedLedger)) {
        addError(errors, "campaignStart.source_ledger", "does not exactly match the producer IDs and reference ledger.");
      }
    }

    if (isNonEmptyString(start.start_id)) {
      const expectedStartId = `cstart-${hexHash(campaignStartFingerprint(start))}`;
      if (start.start_id !== expectedStartId) addError(errors, "campaignStart.start_id", `must equal deterministic ID ${expectedStartId}.`);
    } else {
      addError(errors, "campaignStart.start_id", "must be a non-empty string.");
    }
    if (!isObject(start.validation) || start.validation.valid !== true) {
      addError(errors, "campaignStart.validation.valid", "must be true.");
    } else {
      if (start.validation.error_count !== 0) addError(errors, "campaignStart.validation.error_count", "must equal 0.");
      if (start.validation.reference_count !== start.source_ledger?.one_shot_forge?.world_foundry_reference_ledger?.length) {
        addError(errors, "campaignStart.validation.reference_count", "does not match the preserved World Foundry reference ledger.");
      }
    }
    return { valid: errors.length === 0, errors };
  }

  function createCampaignStart(input) {
    if (!isObject(input)) throw new Error("Campaign Start input must be an object.");
    const pairValidation = validateSourcePair(input.launchpad, input.oneShot);
    if (!pairValidation.valid) throw new Error(pairValidation.errors.join("\n"));
    const launchpad = deepClone(input.launchpad);
    const oneShot = deepClone(input.oneShot);
    const scope = SCOPE_PRESETS[launchpad.options.scope];
    const spotlight = SPOTLIGHT_PRESETS[launchpad.options.spotlight];
    const start = {
      schema_version: VERSION,
      document_type: DOCUMENT_TYPE,
      start_id: "",
      campaign: {
        seed: launchpad.options.seed,
        title: launchpad.title,
        scope: launchpad.options.scope,
        scope_label: scope.label,
        spotlight: launchpad.options.spotlight,
        spotlight_label: spotlight.label,
        party_size: launchpad.options.party,
        maximum_tier: launchpad.options.tier,
        planned_sessions: scope.sessions,
        opening_adventure_id: oneShot.adventure_id
      },
      workflow: launchpad,
      opening_session: oneShot,
      source_ledger: buildSourceLedger(launchpad, oneShot),
      validation: {
        valid: true,
        error_count: 0,
        reference_count: oneShot.reference_ledger.length
      }
    };
    start.start_id = `cstart-${hexHash(campaignStartFingerprint(start))}`;
    const validation = validateCampaignStart(start);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return deepFreeze(start);
  }

  return {
    VERSION,
    DOCUMENT_TYPE,
    SCOPE_PRESETS,
    SPOTLIGHT_PRESETS,
    hash,
    stableStringify,
    validateLaunchpad,
    validateOneShot,
    validateSourcePair,
    validateCampaignStart,
    createCampaignStart
  };
});
