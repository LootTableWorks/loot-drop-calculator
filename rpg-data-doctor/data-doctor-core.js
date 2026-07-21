(function attachRpgDataDoctor(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.RpgDataDoctor = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRpgDataDoctor() {
  "use strict";

  const MAX_FILE_BYTES = 5_000_000;
  const SEVERITY_ORDER = Object.freeze({ critical: 0, error: 1, warning: 2, info: 3 });
  const PRODUCTS = Object.freeze([
    Object.freeze({
      id: "items",
      title: "Item Catalog & Economy Kit",
      proof: "500 stable item records",
      description: "Repair item identity, economy fields, and downstream references with a validated canonical foundation.",
      url: "https://loot-table-works.itch.io/original-fantasy-item-data-pack"
    }),
    Object.freeze({
      id: "merchants",
      title: "Merchant & Shop Kit",
      proof: "150 merchants and 1,500 stock links",
      description: "Use reproducible inventories and inspectable buy/sell economics when shop records need structure.",
      url: "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit"
    }),
    Object.freeze({
      id: "recipes",
      title: "Crafting & Recipe Kit",
      proof: "300 recipes and 1,200 item links",
      description: "Start from complete ingredient, output, cost, and yield records with stable item references.",
      url: "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit"
    }),
    Object.freeze({
      id: "loot",
      title: "Enemy Loot & Reward Kit",
      proof: "250 profiles and 2,000 rewards",
      description: "Replace drifting drop weights with exact probability-backed reward pools and audit tools.",
      url: "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit"
    }),
    Object.freeze({
      id: "quests",
      title: "Quest, Contract & Reward Kit",
      proof: "240 quests in 40 connected arcs",
      description: "Use explicit endpoints, rewards, and stable state operations for quest pipelines that close.",
      url: "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit"
    }),
    Object.freeze({
      id: "encounters",
      title: "Encounter & Threat Kit",
      proof: "180 encounters and 540 phases",
      description: "Build traceable encounter transitions, reward evidence, and inspectable threat budgets.",
      url: "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit"
    })
  ]);

  const PRIMARY_FIELDS = Object.freeze({
    items: ["id", "item_id"],
    merchants: ["merchant_id", "shop_id", "id"],
    recipes: ["recipe_id", "id"],
    loot: ["profile_id", "loot_profile_id", "loot_table_id", "reward_id", "drop_id", "id"],
    quests: ["quest_id", "contract_id", "id"],
    encounters: ["encounter_id", "room_id", "id"],
    locations: ["location_id", "id"],
    generic: ["id"]
  });

  function byteLength(value) {
    const text = String(value || "");
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text).length;
    if (typeof Buffer !== "undefined") return Buffer.byteLength(text, "utf8");
    return unescape(encodeURIComponent(text)).length;
  }

  function cleanName(value, fallback) {
    return String(value || fallback || "pasted-data")
      .replace(/[\u0000-\u001f\u007f]+/g, " ")
      .trim()
      .slice(0, 120) || fallback || "pasted-data";
  }

  function scalar(value) {
    return value !== null && value !== undefined && typeof value !== "object";
  }

  function hasValue(value) {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && String(value).trim() !== "";
  }

  function numeric(value) {
    if (!hasValue(value)) return null;
    const result = Number(value);
    return Number.isFinite(result) ? result : Number.NaN;
  }

  function detectFormat(text, requestedFormat, fileName) {
    if (requestedFormat && requestedFormat !== "auto") return requestedFormat;
    const extension = String(fileName || "").toLowerCase().split(".").pop();
    if (extension === "json" || extension === "csv") return extension;
    return String(text || "").replace(/^\uFEFF/, "").trimStart().match(/^[\[{]/) ? "json" : "csv";
  }

  function parseCsv(text) {
    const source = String(text || "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    let line = 1;

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (character === '"' && source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          if (character === "\n") line += 1;
          field += character;
        }
      } else if (character === '"' && field === "") {
        quoted = true;
      } else if (character === ",") {
        row.push(field);
        field = "";
      } else if (character === "\n") {
        row.push(field.replace(/\r$/, ""));
        rows.push({ values: row, line });
        row = [];
        field = "";
        line += 1;
      } else {
        field += character;
      }
    }
    if (quoted) throw new Error(`CSV contains an unclosed quoted field near line ${line}.`);
    row.push(field.replace(/\r$/, ""));
    if (row.some((value) => value !== "") || rows.length === 0) rows.push({ values: row, line });
    if (rows.length < 2) throw new Error("CSV must contain a header row and at least one data row.");

    const headers = rows[0].values.map((header) => header.trim());
    if (headers.some((header) => !header)) throw new Error("CSV header names cannot be empty.");
    if (new Set(headers).size !== headers.length) throw new Error("CSV header names must be unique.");

    const records = rows.slice(1)
      .filter((entry) => entry.values.some((value) => value.trim() !== ""))
      .map((entry) => {
        if (entry.values.length !== headers.length) {
          throw new Error(`CSV row ${entry.line} has ${entry.values.length} fields; expected ${headers.length}.`);
        }
        return Object.fromEntries(headers.map((header, index) => [header, entry.values[index]]));
      });
    if (!records.length) throw new Error("CSV contains no data records.");
    return { csv_records: records };
  }

  function parseJson(text) {
    const source = String(text || "").replace(/^\uFEFF/, "");
    const value = JSON.parse(source);
    if (value === null || typeof value !== "object") throw new Error("JSON root must be an object or array of records.");
    return value;
  }

  function parseDataset(text, requestedFormat, fileName) {
    const bytes = byteLength(text);
    if (bytes === 0) throw new Error("Choose a JSON or CSV file, paste data, or load the original sample.");
    if (bytes > MAX_FILE_BYTES) throw new Error(`Input is ${bytes.toLocaleString("en-US")} bytes; the strict limit is ${MAX_FILE_BYTES.toLocaleString("en-US")} bytes.`);
    const format = detectFormat(text, requestedFormat, fileName);
    if (!new Set(["json", "csv"]).has(format)) throw new Error(`Unsupported format: ${format}.`);
    return { format, bytes, value: format === "json" ? parseJson(text) : parseCsv(text) };
  }

  function inferType(tableName, record) {
    const name = String(tableName || "").toLowerCase();
    const keys = Object.keys(record || {}).map((key) => key.toLowerCase());
    const keySet = new Set(keys);
    if (/ingredient|recipe|craft/.test(name) || keySet.has("recipe_id") || keySet.has("output_item_id") || keySet.has("ingredients")) return "recipes";
    if (/reward|drop|loot|profile/.test(name) || keySet.has("profile_id") || keySet.has("loot_table_id") || keySet.has("drop_weight")) return "loot";
    if (/encounter|transition|room/.test(name) || keySet.has("encounter_id") || keySet.has("next_encounter_id") || keySet.has("transitions")) return "encounters";
    if (/quest|contract/.test(name) || keySet.has("quest_id") || keySet.has("reward_item_id") || keySet.has("start_location_id")) return "quests";
    if (/merchant|shop|stock|vendor/.test(name) || keySet.has("merchant_id") || keySet.has("shop_id") || keySet.has("buy_price")) return "merchants";
    if (/location|region|settlement/.test(name) || keySet.has("location_id")) return "locations";
    if (/item|catalog/.test(name) || keySet.has("item_id") || keySet.has("base_price")) return "items";
    return "generic";
  }

  function primaryField(tableName, record) {
    const type = inferType(tableName, record);
    const isChild = String(tableName).includes(".");
    const candidates = PRIMARY_FIELDS[type] || PRIMARY_FIELDS.generic;
    for (const field of candidates) {
      if (isChild && field !== "id" && /^(item|profile|loot_table|recipe|quest|encounter|merchant|location)_id$/.test(field)) continue;
      if (Object.prototype.hasOwnProperty.call(record, field) && hasValue(record[field])) return field;
    }
    return Object.prototype.hasOwnProperty.call(record, "id") && hasValue(record.id) ? "id" : null;
  }

  function extractTables(value) {
    const tables = [];
    const seen = new Set();

    function addTable(name, records, parent) {
      if (!Array.isArray(records)) return;
      const objectRecords = records.filter((record) => record && typeof record === "object" && !Array.isArray(record));
      if (!objectRecords.length) return;
      const tableName = String(name || "records");
      const signature = `${tableName}|${parent || "root"}|${objectRecords.length}`;
      if (seen.has(signature)) return;
      seen.add(signature);
      const prepared = objectRecords.map((record, index) => ({
        ...record,
        __table: tableName,
        __row: index + 1,
        ...(parent ? { __parent_id: parent.id, __parent_table: parent.table } : {})
      }));
      tables.push({ name: tableName, records: prepared });

      objectRecords.forEach((record, index) => {
        const parentField = primaryField(tableName, record);
        const parentId = parentField ? String(record[parentField]) : `${tableName}[${index + 1}]`;
        for (const [key, nested] of Object.entries(record)) {
          if (Array.isArray(nested) && nested.some((entry) => entry && typeof entry === "object" && !Array.isArray(entry))) {
            addTable(`${tableName}.${key}`, nested, { id: parentId, table: tableName });
          }
        }
      });
    }

    if (Array.isArray(value)) {
      addTable("records", value, null);
    } else {
      const roots = value.data && typeof value.data === "object" && !Array.isArray(value.data) ? [value.data, value] : [value];
      for (const root of roots) {
        for (const [key, candidate] of Object.entries(root)) {
          if (Array.isArray(candidate)) addTable(key, candidate, null);
        }
      }
      if (!tables.length) addTable("records", [value], null);
    }
    return tables;
  }

  function locationOf(table, record, field) {
    const primary = primaryField(table.name, record);
    const id = primary ? String(record[primary]) : `row ${record.__row}`;
    return {
      table: table.name,
      recordId: id,
      field: field || primary || "record"
    };
  }

  function makeFinding(severity, category, code, location, message, remediation, moduleId) {
    return {
      severity,
      category,
      code,
      table: location.table || "input",
      recordId: location.recordId || "dataset",
      field: location.field || "record",
      message,
      remediation,
      moduleId: moduleId || null
    };
  }

  function moduleForReference(field, tableType) {
    const key = String(field).toLowerCase();
    if (/encounter|room/.test(key)) return "encounters";
    if (/quest|contract/.test(key)) return "quests";
    if (/recipe|ingredient|output/.test(key)) return "recipes";
    if (/profile|loot|reward|drop/.test(key)) return "loot";
    if (/merchant|shop|vendor|stock/.test(key)) return "merchants";
    if (/item/.test(key)) return "items";
    return tableType === "locations" || tableType === "generic" ? "items" : tableType;
  }

  function collectIdentity(tables, findings) {
    const knownIds = new Set();
    const occurrences = new Map();
    for (const table of tables) {
      for (const record of table.records) {
        const field = primaryField(table.name, record);
        if (!field) continue;
        const id = String(record[field]).trim();
        knownIds.add(id);
        if (!occurrences.has(id)) occurrences.set(id, []);
        occurrences.get(id).push({ table, record, field });
      }
    }
    for (const [id, matches] of occurrences) {
      if (matches.length < 2) continue;
      for (const match of matches) {
        const type = inferType(match.table.name, match.record);
        findings.push(makeFinding(
          "error",
          "identity",
          "duplicate_id",
          locationOf(match.table, match.record, match.field),
          `ID "${id}" appears ${matches.length} times across the imported records.`,
          "Assign one stable, unique primary ID to each record, then update every reference to the renamed record.",
          type === "generic" || type === "locations" ? "items" : type
        ));
      }
    }
    return knownIds;
  }

  function referenceValues(value) {
    if (Array.isArray(value)) return value.filter(hasValue).map((entry) => String(entry).trim());
    if (typeof value === "string" && value.includes(",")) return value.split(",").map((entry) => entry.trim()).filter(Boolean);
    return hasValue(value) ? [String(value).trim()] : [];
  }

  function isQuestDomainField(field) {
    return /(start|end|giver|turn_in|reward|location).*_id$/.test(field);
  }

  function isEncounterTransitionField(field) {
    return /(next|success|failure|target|from|to).*(_id|encounter)$/.test(field) || ["to", "from", "target"].includes(field);
  }

  function checkReferences(tables, knownIds, findings) {
    for (const table of tables) {
      for (const record of table.records) {
        const primary = primaryField(table.name, record);
        const type = inferType(table.name, record);
        for (const [field, value] of Object.entries(record)) {
          if (field.startsWith("__") || field === primary) continue;
          const lower = field.toLowerCase();
          if (!/_ids?$/.test(lower) || (!scalar(value) && !Array.isArray(value))) continue;
          if (type === "quests" && isQuestDomainField(lower)) continue;
          if (type === "encounters" && isEncounterTransitionField(lower)) continue;
          const values = referenceValues(value);
          if (!values.length) {
            findings.push(makeFinding(
              "error", "references", "empty_reference", locationOf(table, record, field),
              `Reference field "${field}" is empty.`,
              "Provide an existing target ID or remove the optional reference field if the relationship is not required.",
              moduleForReference(field, type)
            ));
            continue;
          }
          for (const target of values) {
            if (!knownIds.has(target)) {
              findings.push(makeFinding(
                "error", "references", "missing_reference", locationOf(table, record, field),
                `Reference "${target}" does not resolve to an imported primary ID.`,
                `Add the missing "${target}" record or replace this value with an existing stable ID.`,
                moduleForReference(field, type)
              ));
            }
          }
        }
      }
    }
  }

  function checkWeights(tables, findings) {
    const groups = new Map();
    for (const table of tables) {
      for (const record of table.records) {
        const type = inferType(table.name, record);
        for (const [field, raw] of Object.entries(record)) {
          const lower = field.toLowerCase();
          const explicit = /^(drop_weight|reward_weight|probability|probability_bp|weight_bp|chance|chance_percent)$/.test(lower);
          const contextual = lower === "weight" && (type === "loot" || /reward|drop|loot/.test(table.name.toLowerCase()));
          if (!explicit && !contextual) continue;
          const value = numeric(raw);
          if (value === null || Number.isNaN(value) || value < 0) {
            findings.push(makeFinding(
              "error", "weights", "invalid_weight", locationOf(table, record, field),
              `Weight value "${String(raw)}" is not a finite non-negative number.`,
              "Replace it with a finite value at or above zero, then normalize the complete pool.",
              "loot"
            ));
            continue;
          }
          const parent = record.__parent_id || record.profile_id || record.loot_profile_id || record.loot_table_id || record.pool_id || record.encounter_id || table.name;
          const groupKey = `${table.name}|${parent}|${lower}`;
          if (!groups.has(groupKey)) groups.set(groupKey, { table, parent, field, values: [], records: [] });
          groups.get(groupKey).values.push(value);
          groups.get(groupKey).records.push(record);
        }
      }
    }

    for (const group of groups.values()) {
      if (group.values.length < 2) continue;
      const sum = group.values.reduce((total, value) => total + value, 0);
      const maximum = Math.max(...group.values);
      const field = group.field.toLowerCase();
      const target = field.includes("bp") || maximum > 100 ? 10000 : maximum <= 1 ? 1 : 100;
      if (Math.abs(sum - target) <= 0.000001) continue;
      findings.push(makeFinding(
        "warning", "weights", "unnormalized_weight_pool",
        { table: group.table.name, recordId: String(group.parent), field: group.field },
        `${group.values.length} weights total ${sum}; this pool's detected scale totals ${target}.`,
        `Normalize every value in this pool so the final total is exactly ${target}, preserving relative odds where intended.`,
        "loot"
      ));
    }
  }

  function checkPrices(tables, findings) {
    const pairs = [
      ["buy_price", "sell_price"],
      ["purchase_price", "sale_price"],
      ["buy_value", "sell_value"]
    ];
    for (const table of tables) {
      for (const record of table.records) {
        for (const [buyField, sellField] of pairs) {
          if (!Object.prototype.hasOwnProperty.call(record, buyField) || !Object.prototype.hasOwnProperty.call(record, sellField)) continue;
          const buy = numeric(record[buyField]);
          const sell = numeric(record[sellField]);
          if (buy === null || sell === null || Number.isNaN(buy) || Number.isNaN(sell) || sell <= buy) continue;
          findings.push(makeFinding(
            "warning", "economy", "price_inversion", locationOf(table, record, sellField),
            `${sellField} (${sell}) exceeds ${buyField} (${buy}), creating a likely resale-profit loop.`,
            "Confirm the player-facing price convention; otherwise lower the sell value or raise the buy value and retest the economy loop.",
            "merchants"
          ));
        }
      }
    }
  }

  function checkRecipes(tables, knownIds, findings) {
    const linkedIngredients = new Map();
    for (const table of tables.filter((entry) => /ingredient/.test(entry.name.toLowerCase()))) {
      for (const record of table.records) {
        const owner = record.__parent_id || record.recipe_id;
        if (owner) linkedIngredients.set(String(owner), (linkedIngredients.get(String(owner)) || 0) + 1);
        const quantityField = ["quantity", "qty", "amount", "count"].find((field) => Object.prototype.hasOwnProperty.call(record, field));
        if (quantityField) {
          const quantity = numeric(record[quantityField]);
          if (quantity === null || Number.isNaN(quantity) || quantity <= 0) {
            findings.push(makeFinding(
              "error", "recipes", "invalid_ingredient_quantity", locationOf(table, record, quantityField),
              `Ingredient quantity "${String(record[quantityField])}" must be greater than zero.`,
              "Set a positive ingredient quantity and recalculate recipe cost and yield.",
              "recipes"
            ));
          }
        }
      }
    }

    for (const table of tables) {
      if (!/recipe|craft/.test(table.name.toLowerCase())) continue;
      for (const record of table.records) {
        if (table.name.toLowerCase().includes("ingredient")) continue;
        const idField = primaryField(table.name, record);
        const id = idField ? String(record[idField]) : `row ${record.__row}`;
        const ingredients = Array.isArray(record.ingredients) ? record.ingredients : null;
        const ingredientCount = ingredients ? ingredients.length : linkedIngredients.get(id) || 0;
        if (ingredientCount === 0) {
          findings.push(makeFinding(
            "error", "recipes", "recipe_ingredient_gap", locationOf(table, record, "ingredients"),
            "Recipe has no ingredient records.",
            "Add at least one ingredient with a resolvable item ID and a positive quantity.",
            "recipes"
          ));
        }
        const outputField = ["output_item_id", "result_item_id", "output_id", "result_id"].find((field) => Object.prototype.hasOwnProperty.call(record, field));
        if (!outputField || !hasValue(record[outputField])) {
          findings.push(makeFinding(
            "error", "recipes", "recipe_output_gap", locationOf(table, record, outputField || "output_item_id"),
            "Recipe has no output item reference.",
            "Add one output item ID that resolves to an imported item record.",
            "recipes"
          ));
        } else if (!knownIds.has(String(record[outputField]).trim())) {
          findings.push(makeFinding(
            "error", "recipes", "recipe_output_reference", locationOf(table, record, outputField),
            `Recipe output "${String(record[outputField])}" is not present in the imported IDs.`,
            "Add the output item record or update the recipe to use a valid item ID.",
            "recipes"
          ));
        }
      }
    }
  }

  function checkQuests(tables, knownIds, findings) {
    for (const table of tables) {
      if (!/quest|contract/.test(table.name.toLowerCase())) continue;
      for (const record of table.records) {
        if (table.name.includes(".")) continue;
        const endpointFields = Object.keys(record).filter((field) => /(start|end|giver|turn_in|location).*_id$/.test(field.toLowerCase()));
        if (!endpointFields.length) {
          findings.push(makeFinding(
            "warning", "quests", "quest_endpoint_gap", locationOf(table, record, "endpoints"),
            "Quest has no explicit giver, start, location, end, or turn-in endpoint.",
            "Add stable endpoint IDs so the quest can enter and exit a campaign flow without prose-only joins.",
            "quests"
          ));
        }
        for (const field of endpointFields) {
          const targets = referenceValues(record[field]);
          if (!targets.length || targets.some((target) => !knownIds.has(target))) {
            findings.push(makeFinding(
              "error", "quests", "quest_endpoint_reference", locationOf(table, record, field),
              targets.length ? `Quest endpoint "${targets.find((target) => !knownIds.has(target))}" does not resolve.` : `Quest endpoint "${field}" is empty.`,
              "Point the endpoint to an imported location, giver, or quest ID and validate the complete quest chain again.",
              "quests"
            ));
          }
        }
        const rewardFields = Object.keys(record).filter((field) => /reward/.test(field.toLowerCase()));
        const populated = rewardFields.some((field) => hasValue(record[field]));
        if (!populated) {
          findings.push(makeFinding(
            "warning", "quests", "quest_reward_gap", locationOf(table, record, "rewards"),
            "Quest has no explicit reward record or reward reference.",
            "Add a reward item, currency, unlock, or documented no-reward outcome with a stable reference where applicable.",
            "quests"
          ));
        }
        for (const field of rewardFields.filter((name) => /_ids?$/.test(name.toLowerCase()))) {
          for (const target of referenceValues(record[field])) {
            if (!knownIds.has(target)) {
              findings.push(makeFinding(
                "error", "quests", "quest_reward_reference", locationOf(table, record, field),
                `Quest reward "${target}" does not resolve to an imported primary ID.`,
                "Add the reward record or replace the reference with a valid stable ID.",
                "quests"
              ));
            }
          }
        }
      }
    }
  }

  function checkEncounters(tables, knownIds, findings) {
    for (const table of tables) {
      const lowerTable = table.name.toLowerCase();
      if (!/encounter|transition|room/.test(lowerTable)) continue;
      for (const record of table.records) {
        const fields = Object.keys(record).filter((field) => isEncounterTransitionField(field.toLowerCase()));
        const isTransitionRow = /transition/.test(lowerTable);
        if (isTransitionRow && !fields.length) {
          findings.push(makeFinding(
            "error", "encounters", "encounter_transition_gap", locationOf(table, record, "target"),
            "Transition row has no source or target encounter reference.",
            "Add explicit from/to encounter IDs or remove the incomplete transition row.",
            "encounters"
          ));
        }
        for (const field of fields) {
          for (const target of referenceValues(record[field])) {
            if (!knownIds.has(target)) {
              findings.push(makeFinding(
                "error", "encounters", "encounter_transition_reference", locationOf(table, record, field),
                `Encounter transition "${target}" does not resolve to an imported encounter ID.`,
                "Point the transition to an existing encounter ID, or mark the current encounter as terminal by removing the transition.",
                "encounters"
              ));
            }
          }
          if (!referenceValues(record[field]).length) {
            findings.push(makeFinding(
              "error", "encounters", "encounter_transition_reference", locationOf(table, record, field),
              `Encounter transition field "${field}" is empty.`,
              "Provide a valid encounter ID or remove the optional transition field.",
              "encounters"
            ));
          }
        }
      }
    }
  }

  function trackedProductUrl(product, placement) {
    const query = new URLSearchParams({
      utm_source: "rpg_data_doctor",
      utm_medium: "free_tool",
      utm_campaign: "world_foundry_traffic_test",
      utm_content: `doctor_${String(placement || "results")}_${product.id}`
    });
    return `${product.url}?${query.toString()}`;
  }

  function buildRecommendations(findings) {
    const relevant = new Set(findings.map((finding) => finding.moduleId).filter(Boolean));
    return PRODUCTS.filter((product) => relevant.has(product.id));
  }

  function finalizeFindings(findings) {
    return findings
      .sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
        || left.category.localeCompare(right.category)
        || left.table.localeCompare(right.table)
        || left.recordId.localeCompare(right.recordId)
        || left.field.localeCompare(right.field))
      .map((finding, index) => ({ ...finding, id: `RDD-${String(index + 1).padStart(3, "0")}` }));
  }

  function summarize(findings) {
    const summary = { total: findings.length, critical: 0, error: 0, warning: 0, info: 0 };
    findings.forEach((finding) => { summary[finding.severity] += 1; });
    return summary;
  }

  function buildReport(result) {
    const lines = [
      "RPG DATA DOCTOR AUDIT",
      "=====================",
      `Source: ${result.meta.fileName}`,
      `Format: ${result.meta.format.toUpperCase()}`,
      `Bytes: ${result.meta.bytes}`,
      `Tables: ${result.meta.tableCount}`,
      `Records inspected: ${result.meta.recordCount}`,
      `Findings: ${result.summary.total} (${result.summary.critical} critical, ${result.summary.error} errors, ${result.summary.warning} warnings)`,
      ""
    ];
    if (!result.findings.length) {
      lines.push("No findings were detected by this focused structural audit.", "Review project-specific schema, balance, and content rules before shipping.");
    } else {
      for (const finding of result.findings) {
        lines.push(
          `[${finding.severity.toUpperCase()}] ${finding.id} / ${finding.category}`,
          `${finding.table} > ${finding.recordId} > ${finding.field}`,
          finding.message,
          `Fix: ${finding.remediation}`,
          ""
        );
      }
    }
    if (result.recommendations.length) {
      lines.push("RELEVANT LOOT TABLE WORKS MODULES", "---------------------------------");
      for (const product of result.recommendations) {
        lines.push(`${product.title}: ${trackedProductUrl(product, "report")}`);
      }
    }
    lines.push("", "Privacy: this audit was generated locally in the browser. Imported data is not uploaded or executed.");
    return `${lines.join("\n")}\n`;
  }

  function auditText(text, options) {
    const settings = options || {};
    const meta = {
      fileName: cleanName(settings.fileName, "pasted-data"),
      format: settings.format === "csv" ? "csv" : settings.format === "json" ? "json" : "auto",
      bytes: byteLength(text),
      tableCount: 0,
      recordCount: 0
    };
    const findings = [];
    let tables = [];
    try {
      const parsed = parseDataset(text, settings.format || "auto", settings.fileName || "");
      meta.format = parsed.format;
      meta.bytes = parsed.bytes;
      tables = extractTables(parsed.value);
      if (!tables.length) throw new Error("No object records were detected in the imported data.");
      meta.tableCount = tables.length;
      meta.recordCount = tables.reduce((total, table) => total + table.records.length, 0);
      const knownIds = collectIdentity(tables, findings);
      checkReferences(tables, knownIds, findings);
      checkWeights(tables, findings);
      checkPrices(tables, findings);
      checkRecipes(tables, knownIds, findings);
      checkQuests(tables, knownIds, findings);
      checkEncounters(tables, knownIds, findings);
    } catch (error) {
      findings.push(makeFinding(
        "critical", "parse", "parse_error", { table: "input", recordId: "dataset", field: "source" },
        error instanceof Error ? error.message : String(error),
        "Correct the source syntax or reduce it below the file-size limit, then run the audit again.",
        null
      ));
    }
    const finalFindings = finalizeFindings(findings);
    const result = {
      meta,
      summary: summarize(finalFindings),
      findings: finalFindings,
      categories: [...new Set(finalFindings.map((finding) => finding.category))].sort(),
      recommendations: buildRecommendations(finalFindings)
    };
    result.report = buildReport(result);
    return result;
  }

  return Object.freeze({
    MAX_FILE_BYTES,
    PRODUCTS,
    SEVERITY_ORDER,
    auditText,
    buildReport,
    byteLength,
    detectFormat,
    extractTables,
    inferType,
    parseCsv,
    parseDataset,
    trackedProductUrl
  });
});
