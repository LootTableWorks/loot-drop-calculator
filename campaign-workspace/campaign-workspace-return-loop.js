(function attachCampaignWorkspaceReturnLoop(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CampaignWorkspaceReturnLoop = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCampaignWorkspaceReturnLoop() {
  "use strict";

  const VERSION = "1.2.0";
  const RECEIPT_SCHEMA_VERSION = "1.0.0";
  const STORAGE_KEY = "loot-table-works:campaign-workspace:return-loop:v1";
  const PRODUCER_CLASSES = new Set(["gullwatch", "campaign_launchpad"]);
  const ATTRIBUTION_KEYS = ["source", "medium", "campaign", "content"];
  const ATTRIBUTION_VALUES = Object.freeze({
    source: new Set(["github", "github_pages", "campaign_workspace", "itchio", "bluesky"]),
    medium: new Set([
      "repository",
      "issue_chooser",
      "campaign_continuity",
      "web",
      "devlog",
      "organic_social",
      "organic_search"
    ]),
    campaign: new Set(["wf4w_revenue_v1", "gullwatch_campaign_workspace_v1"]),
    content: new Set([
      "readme_flagship",
      "readme_gullwatch",
      "readme_field_test",
      "field_test_private_route",
      "w1_campaign_workspace",
      "encounter",
      "quest",
      "loot",
      "cw12_closeout_encounter",
      "cw12_closeout_quest",
      "cw12_closeout_loot"
    ])
  });
  const AGE_BUCKETS = new Set(["unknown", "same_day", "1_2_days", "3_7_days", "8_30_days", "31_plus_days"]);
  const PRODUCT_IDS = new Set([
    "fantasy-encounter-room-data-kit",
    "fantasy-quest-contract-reward-data-kit",
    "enemy-loot-table-drop-profile-kit"
  ]);
  const EVENTS = new Set([
    "campaign_started",
    "campaign_imported",
    "session_committed",
    "portable_exported",
    "next_session_copied",
    "next_session_printed",
    "expansion_recommended",
    "paid_expansion_clicked"
  ]);

  const PRODUCT_MAP = deepFreeze({
    encounter: {
      product_id: "fantasy-encounter-room-data-kit",
      title: "World Foundry Encounter & Threat Kit",
      price_usd: 3,
      url: "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit?utm_source=campaign_workspace&utm_medium=web&utm_campaign=wf4w_revenue_v1&utm_content=cw12_closeout_encounter"
    },
    quest: {
      product_id: "fantasy-quest-contract-reward-data-kit",
      title: "World Foundry Quest, Contract & Reward Kit",
      price_usd: 3,
      url: "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit?utm_source=campaign_workspace&utm_medium=web&utm_campaign=wf4w_revenue_v1&utm_content=cw12_closeout_quest"
    },
    loot: {
      product_id: "enemy-loot-table-drop-profile-kit",
      title: "World Foundry Enemy Loot & Reward Kit",
      price_usd: 3,
      url: "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit?utm_source=campaign_workspace&utm_medium=web&utm_campaign=wf4w_revenue_v1&utm_content=cw12_closeout_loot"
    }
  });

  const TARGET_GROUPS = Object.freeze({
    encounter: new Set(["encounter", "enemy", "creature", "immediate_high_pressure_threat"]),
    quest: new Set(["thread", "quest", "faction", "project", "unresolved_obligation"]),
    loot: new Set(["item", "reward", "merchant", "recipe", "asset", "material_consequence"])
  });

  const MILESTONE_KEYS = new Set([
    "schema_version",
    "receipt_id",
    "producer_class",
    "attribution",
    "campaign_started_or_imported",
    "session_committed",
    "portable_export",
    "next_session_copy_or_print",
    "separate_session_return_confirmed",
    "paid_expansion_click",
    "session_count",
    "recommended_product_id",
    "clicked_product_id",
    "age_bucket",
    "_internal"
  ]);
  const RECEIPT_KEYS = new Set([...MILESTONE_KEYS].filter((key) => key !== "_internal"));
  const INTERNAL_KEYS = new Set(["page_session_nonce", "created_day_index"]);

  function isPlainObject(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || Object.getPrototypeOf(prototype) === null;
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function assertPlainObject(value, label) {
    if (!isPlainObject(value)) throw new TypeError(`${label} must be a plain object.`);
  }

  function assertExactKeys(value, allowed, label) {
    assertPlainObject(value, label);
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) throw new TypeError(`${label} contains prohibited or unknown field: ${key}.`);
    }
  }

  function assertBoolean(value, label) {
    if (typeof value !== "boolean") throw new TypeError(`${label} must be a boolean.`);
  }

  function assertSessionCount(value) {
    if (!Number.isInteger(value) || value < 0 || value > 9999) {
      throw new RangeError("session_count must be an integer from 0 through 9999.");
    }
  }

  function assertSafeToken(value, label, minimum = 1, maximum = 64) {
    if (
      typeof value !== "string" ||
      value.length < minimum ||
      value.length > maximum ||
      !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value)
    ) {
      throw new TypeError(`${label} must be a bounded letters, numbers, hyphens, or underscores token.`);
    }
    return value;
  }

  function assertReceiptId(value, label) {
    if (typeof value !== "string" || !/^ltw-rl-[0-9a-f]{32}$/.test(value)) {
      throw new TypeError(`${label} must use the exact locally generated Loot Table Works receipt ID format.`);
    }
    return value;
  }

  function assertPageSessionNonce(value, label) {
    if (typeof value !== "string" || !/^page-[0-9a-f]{32}$/.test(value)) {
      throw new TypeError(`${label} must use the exact local page-session nonce format.`);
    }
    return value;
  }

  function assertDayIndex(value, label) {
    if (!Number.isInteger(value) || value < 0 || value > 10000000) {
      throw new RangeError(`${label} must be an integer from 0 through 10000000.`);
    }
    return value;
  }

  function randomHex() {
    const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : null;
    if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
      return cryptoApi.randomUUID().replace(/-/g, "").toLowerCase();
    }
    if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      cryptoApi.getRandomValues(bytes);
      return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
    }
    let token = "";
    for (let index = 0; index < 4; index += 1) {
      token += Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, "0");
    }
    return token;
  }

  function makeReceiptId() {
    return `ltw-rl-${randomHex()}`;
  }

  function makePageSessionNonce() {
    return `page-${randomHex()}`;
  }

  function normalizeAttributionValue(field, value) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string" || !ATTRIBUTION_VALUES[field].has(value)) {
      throw new TypeError(`attribution.${field} must be an approved low-cardinality route value.`);
    }
    return value;
  }

  function normalizeAttribution(value) {
    if (value === undefined || value === null) {
      return Object.fromEntries(ATTRIBUTION_KEYS.map((key) => [key, null]));
    }
    assertExactKeys(value, new Set(ATTRIBUTION_KEYS), "attribution");
    return Object.fromEntries(
      ATTRIBUTION_KEYS.map((key) => [key, normalizeAttributionValue(key, value[key])])
    );
  }

  function assertAttribution(value) {
    assertExactKeys(value, new Set(ATTRIBUTION_KEYS), "attribution");
    for (const key of ATTRIBUTION_KEYS) {
      if (!(key in value)) throw new TypeError(`attribution is missing field: ${key}.`);
      normalizeAttributionValue(key, value[key]);
    }
  }

  function assertProductId(value, label, optional = true) {
    if (optional && value === null) return;
    if (typeof value !== "string" || !PRODUCT_IDS.has(value)) {
      throw new TypeError(`${label} must be an approved public product ID${optional ? " or null" : ""}.`);
    }
  }

  function assertMilestone(milestone) {
    assertExactKeys(milestone, MILESTONE_KEYS, "milestone");
    for (const key of MILESTONE_KEYS) {
      if (!(key in milestone)) throw new TypeError(`milestone is missing field: ${key}.`);
    }
    if (milestone.schema_version !== RECEIPT_SCHEMA_VERSION) {
      throw new TypeError(`milestone.schema_version must be ${RECEIPT_SCHEMA_VERSION}.`);
    }
    assertReceiptId(milestone.receipt_id, "milestone.receipt_id");
    if (!PRODUCER_CLASSES.has(milestone.producer_class)) {
      throw new TypeError("milestone.producer_class is not approved.");
    }
    assertAttribution(milestone.attribution);
    [
      "campaign_started_or_imported",
      "session_committed",
      "portable_export",
      "next_session_copy_or_print",
      "separate_session_return_confirmed",
      "paid_expansion_click"
    ].forEach((key) => assertBoolean(milestone[key], `milestone.${key}`));
    assertSessionCount(milestone.session_count);
    assertProductId(milestone.recommended_product_id, "milestone.recommended_product_id");
    assertProductId(milestone.clicked_product_id, "milestone.clicked_product_id");
    if (!AGE_BUCKETS.has(milestone.age_bucket)) throw new TypeError("milestone.age_bucket is not approved.");
    assertExactKeys(milestone._internal, INTERNAL_KEYS, "milestone._internal");
    for (const key of INTERNAL_KEYS) {
      if (!(key in milestone._internal)) throw new TypeError(`milestone._internal is missing field: ${key}.`);
    }
    assertPageSessionNonce(milestone._internal.page_session_nonce, "milestone._internal.page_session_nonce");
    if (milestone._internal.created_day_index !== null) {
      assertDayIndex(milestone._internal.created_day_index, "milestone._internal.created_day_index");
    }
    assertStateRelationships(milestone);
    return true;
  }

  function assertStateRelationships(value) {
    if (value.session_committed !== (value.session_count > 0)) {
      throw new TypeError("session_committed must match whether session_count is greater than zero.");
    }
    if (!value.campaign_started_or_imported && (
      value.session_committed ||
      value.portable_export ||
      value.next_session_copy_or_print ||
      value.separate_session_return_confirmed
    )) {
      throw new TypeError("campaign milestones require a started or imported campaign.");
    }
    if (value.next_session_copy_or_print && !value.session_committed) {
      throw new TypeError("next-session preparation requires a committed session.");
    }
    if (value.portable_export && !value.session_committed) {
      throw new TypeError("portable export requires a committed session.");
    }
    if (value.session_committed !== (value.recommended_product_id !== null)) {
      throw new TypeError("A committed session must have exactly one approved recommendation.");
    }
    if (value.separate_session_return_confirmed && !value.session_committed) {
      throw new TypeError("separate-session return requires a committed session.");
    }
    if (
      value.separate_session_return_confirmed &&
      (value.age_bucket === "unknown" || value.age_bucket === "same_day")
    ) {
      throw new TypeError("separate-session return requires a strictly later coarse age bucket.");
    }
    if (
      !value.separate_session_return_confirmed &&
      value.age_bucket !== "unknown" &&
      value.age_bucket !== "same_day"
    ) {
      throw new TypeError("A later coarse age bucket requires a confirmed separate-session return.");
    }
    if (value.paid_expansion_click !== (value.clicked_product_id !== null)) {
      throw new TypeError("paid_expansion_click must match clicked_product_id.");
    }
    if (value.paid_expansion_click && (!value.portable_export || !value.next_session_copy_or_print)) {
      throw new TypeError("A paid expansion click requires current-session export and next-session preparation.");
    }
    if (value.clicked_product_id !== null && value.clicked_product_id !== value.recommended_product_id) {
      throw new TypeError("clicked_product_id must match the one recommended product.");
    }
  }

  function createMilestone(input = {}) {
    const allowed = new Set([
      "receiptId",
      "producerClass",
      "attribution",
      "pageSessionNonce",
      "dayIndex",
      "startedOrImported",
      "sessionCount"
    ]);
    assertExactKeys(input, allowed, "createMilestone input");
    const sessionCount = input.sessionCount === undefined ? 0 : input.sessionCount;
    assertSessionCount(sessionCount);
    if (input.startedOrImported !== undefined) assertBoolean(input.startedOrImported, "startedOrImported");
    if (sessionCount > 0 && input.startedOrImported !== true) {
      throw new TypeError("A nonzero sessionCount requires startedOrImported to be true.");
    }
    const producerClass = input.producerClass ?? "gullwatch";
    if (!PRODUCER_CLASSES.has(producerClass)) throw new TypeError("producerClass is not approved.");
    const receiptId = input.receiptId ?? makeReceiptId();
    const pageSessionNonce = input.pageSessionNonce ?? makePageSessionNonce();
    assertReceiptId(receiptId, "receiptId");
    assertPageSessionNonce(pageSessionNonce, "pageSessionNonce");
    const dayIndex = input.dayIndex === undefined ? null : assertDayIndex(input.dayIndex, "dayIndex");
    const milestone = {
      schema_version: RECEIPT_SCHEMA_VERSION,
      receipt_id: receiptId,
      producer_class: producerClass,
      attribution: normalizeAttribution(input.attribution),
      campaign_started_or_imported: input.startedOrImported === true,
      session_committed: sessionCount > 0,
      portable_export: false,
      next_session_copy_or_print: false,
      separate_session_return_confirmed: false,
      paid_expansion_click: false,
      session_count: sessionCount,
      recommended_product_id: sessionCount > 0
        ? PRODUCT_MAP.quest.product_id
        : null,
      clicked_product_id: null,
      age_bucket: dayIndex === null ? "unknown" : "same_day",
      _internal: {
        page_session_nonce: pageSessionNonce,
        created_day_index: dayIndex
      }
    };
    assertMilestone(milestone);
    return deepFreeze(milestone);
  }

  function normalizeTargetKind(value) {
    if (value === undefined || value === null || value === "") return null;
    const token = assertSafeToken(value, "targetKind");
    return token.toLowerCase().replace(/-+/g, "_");
  }

  function productGroupForTarget(targetKind) {
    for (const [group, targets] of Object.entries(TARGET_GROUPS)) {
      if (targets.has(targetKind)) return group;
    }
    return "quest";
  }

  function selectExpansion(input = {}) {
    assertExactKeys(input, new Set(["targetKind"]), "selectExpansion input");
    const targetKind = normalizeTargetKind(input.targetKind);
    const group = productGroupForTarget(targetKind);
    const product = PRODUCT_MAP[group];
    const reason = group === "encounter"
      ? "The recorded target is an immediate threat that benefits from connected encounter material."
      : group === "loot"
        ? "The recorded target is a material consequence that benefits from coherent reward material."
        : targetKind && TARGET_GROUPS.quest.has(targetKind)
          ? "The recorded target is an unresolved obligation that benefits from connected quest material."
          : "Quest material is the neutral fallback when the recorded target has no approved category.";
    return deepFreeze({
      target_kind: targetKind,
      product_id: product.product_id,
      title: product.title,
      price_usd: product.price_usd,
      reason,
      url: product.url
    });
  }

  function assertEventInput(event, input) {
    const keysByEvent = {
      campaign_started: new Set(),
      campaign_imported: new Set(),
      session_committed: new Set(["sessionCount", "targetKind"]),
      portable_exported: new Set(),
      next_session_copied: new Set(),
      next_session_printed: new Set(),
      expansion_recommended: new Set(["targetKind"]),
      paid_expansion_clicked: new Set(["productId"])
    };
    assertExactKeys(input, keysByEvent[event], `${event} input`);
  }

  function recordMilestone(milestone, event, input = {}) {
    assertMilestone(milestone);
    if (typeof event !== "string" || !EVENTS.has(event)) {
      throw new TypeError(`Unknown milestone event: ${String(event)}.`);
    }
    assertEventInput(event, input);
    const next = clone(milestone);

    if (event === "campaign_started" || event === "campaign_imported") {
      next.campaign_started_or_imported = true;
    } else if (event === "session_committed") {
      if (!next.campaign_started_or_imported) {
        throw new TypeError("A session cannot be committed before a campaign is started or imported.");
      }
      const sessionCount = input.sessionCount === undefined ? next.session_count + 1 : input.sessionCount;
      assertSessionCount(sessionCount);
      if (sessionCount <= next.session_count) {
        throw new RangeError("sessionCount must advance beyond the recorded session count.");
      }
      next.session_count = sessionCount;
      next.session_committed = true;
      next.portable_export = false;
      next.next_session_copy_or_print = false;
      next.recommended_product_id = selectExpansion({ targetKind: input.targetKind }).product_id;
      next.clicked_product_id = null;
      next.paid_expansion_click = false;
    } else if (event === "portable_exported") {
      if (!next.session_committed) {
        throw new TypeError("A portable export requires a committed session.");
      }
      next.portable_export = true;
    } else if (event === "next_session_copied" || event === "next_session_printed") {
      if (!next.session_committed) {
        throw new TypeError("Next-session preparation requires a committed session.");
      }
      next.next_session_copy_or_print = true;
    } else if (event === "expansion_recommended") {
      if (!next.session_committed) {
        throw new TypeError("An expansion recommendation requires a committed session.");
      }
      next.recommended_product_id = selectExpansion({ targetKind: input.targetKind }).product_id;
      next.clicked_product_id = null;
      next.paid_expansion_click = false;
    } else if (event === "paid_expansion_clicked") {
      assertProductId(input.productId, "productId", false);
      if (next.recommended_product_id === null || input.productId !== next.recommended_product_id) {
        throw new TypeError("The clicked product must match the one recommended public product.");
      }
      if (!next.portable_export || !next.next_session_copy_or_print) {
        throw new TypeError("A paid expansion click requires current-session export and next-session preparation.");
      }
      next.clicked_product_id = input.productId;
      next.paid_expansion_click = true;
    }

    assertMilestone(next);
    return deepFreeze(next);
  }

  function assertReturnInput(input) {
    assertExactKeys(input, new Set(["pageSessionNonce", "dayIndex", "confirmed"]), "return input");
    if (input.confirmed !== true) throw new TypeError("Separate-session return requires explicit confirmation.");
    assertPageSessionNonce(input.pageSessionNonce, "pageSessionNonce");
    if (input.dayIndex !== undefined && input.dayIndex !== null) assertDayIndex(input.dayIndex, "dayIndex");
  }

  function canConfirmSeparateReturn(milestone, input = {}) {
    assertMilestone(milestone);
    assertReturnInput(input);
    if (
      !milestone.campaign_started_or_imported ||
      !milestone.session_committed ||
      milestone.separate_session_return_confirmed ||
      input.pageSessionNonce === milestone._internal.page_session_nonce ||
      milestone._internal.created_day_index === null ||
      input.dayIndex === undefined ||
      input.dayIndex === null
    ) {
      return false;
    }
    const createdDay = milestone._internal.created_day_index;
    return input.dayIndex > createdDay;
  }

  function ageBucket(createdDay, currentDay) {
    if (createdDay === null || currentDay === undefined) return "unknown";
    const difference = currentDay - createdDay;
    if (difference <= 0) return "same_day";
    if (difference <= 2) return "1_2_days";
    if (difference <= 7) return "3_7_days";
    if (difference <= 30) return "8_30_days";
    return "31_plus_days";
  }

  function confirmSeparateReturn(milestone, input = {}) {
    if (!canConfirmSeparateReturn(milestone, input)) {
      throw new TypeError("Separate-session return cannot be confirmed from this page session or milestone state.");
    }
    const next = clone(milestone);
    next.separate_session_return_confirmed = true;
    next.age_bucket = ageBucket(next._internal.created_day_index, input.dayIndex);
    assertMilestone(next);
    return deepFreeze(next);
  }

  function createReceipt(milestone) {
    assertMilestone(milestone);
    const receipt = Object.fromEntries(
      [...RECEIPT_KEYS].map((key) => [key, clone(milestone[key])])
    );
    assertReceiptSafe(receipt);
    return deepFreeze(receipt);
  }

  function assertReceiptSafe(receipt) {
    assertExactKeys(receipt, RECEIPT_KEYS, "receipt");
    for (const key of RECEIPT_KEYS) {
      if (!(key in receipt)) throw new TypeError(`receipt is missing field: ${key}.`);
    }
    if (receipt.schema_version !== RECEIPT_SCHEMA_VERSION) {
      throw new TypeError(`receipt.schema_version must be ${RECEIPT_SCHEMA_VERSION}.`);
    }
    assertReceiptId(receipt.receipt_id, "receipt.receipt_id");
    if (!PRODUCER_CLASSES.has(receipt.producer_class)) {
      throw new TypeError("receipt.producer_class is not approved.");
    }
    assertAttribution(receipt.attribution);
    [
      "campaign_started_or_imported",
      "session_committed",
      "portable_export",
      "next_session_copy_or_print",
      "separate_session_return_confirmed",
      "paid_expansion_click"
    ].forEach((key) => assertBoolean(receipt[key], `receipt.${key}`));
    assertSessionCount(receipt.session_count);
    assertProductId(receipt.recommended_product_id, "receipt.recommended_product_id");
    assertProductId(receipt.clicked_product_id, "receipt.clicked_product_id");
    if (!AGE_BUCKETS.has(receipt.age_bucket)) throw new TypeError("receipt.age_bucket is not approved.");
    assertStateRelationships(receipt);
    return true;
  }

  function stableJson(value) {
    if (Array.isArray(value)) return value.map(stableJson);
    if (!isPlainObject(value)) return value;
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJson(value[key])]));
  }

  function serializeReceipt(receipt) {
    assertReceiptSafe(receipt);
    return `${JSON.stringify(stableJson(receipt), null, 2)}\n`;
  }

  return Object.freeze({
    VERSION,
    STORAGE_KEY,
    PRODUCT_MAP,
    createMilestone,
    recordMilestone,
    canConfirmSeparateReturn,
    confirmSeparateReturn,
    selectExpansion,
    createReceipt,
    assertReceiptSafe,
    serializeReceipt
  });
});
