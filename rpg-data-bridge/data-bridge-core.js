(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RpgDataBridge = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MAX_FILE_BYTES = 5000000;
  const TARGETS = Object.freeze({ TYPESCRIPT: "typescript", UNITY: "unity", GODOT: "godot" });
  const RESERVED = {
    typescript: new Set(["break", "case", "catch", "class", "const", "constructor", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "function", "if", "implements", "import", "in", "instanceof", "interface", "let", "new", "null", "package", "private", "protected", "prototype", "public", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "with", "yield", "__proto__"]),
    unity: new Set(["abstract", "as", "base", "bool", "break", "byte", "case", "catch", "char", "checked", "class", "const", "continue", "decimal", "default", "delegate", "do", "double", "else", "enum", "event", "explicit", "extern", "false", "finally", "fixed", "float", "for", "foreach", "goto", "if", "implicit", "in", "int", "interface", "internal", "is", "lock", "long", "namespace", "new", "null", "object", "operator", "out", "override", "params", "private", "protected", "public", "readonly", "ref", "return", "sbyte", "sealed", "short", "sizeof", "stackalloc", "static", "string", "struct", "switch", "this", "throw", "true", "try", "typeof", "uint", "ulong", "unchecked", "unsafe", "ushort", "using", "virtual", "void", "volatile", "while", "__proto__", "constructor", "prototype"]),
    godot: new Set(["and", "as", "assert", "await", "break", "breakpoint", "class", "class_name", "const", "continue", "elif", "else", "enum", "extends", "false", "for", "func", "if", "in", "is", "match", "namespace", "not", "null", "or", "pass", "preload", "return", "self", "signal", "static", "super", "true", "var", "void", "while", "yield", "__proto__", "constructor", "prototype"])
  };
  const RESERVED_UNION = new Set([...RESERVED.typescript, ...RESERVED.unity, ...RESERVED.godot]);

  const PRODUCTS = Object.freeze([
    { id: "items", title: "Original Fantasy Item Data Pack", detail: "Production-ready item records with stable identifiers and practical export formats.", url: "https://loot-table-works.itch.io/original-fantasy-item-data-pack" },
    { id: "merchants", title: "Fantasy Merchant Shop Generator Kit", detail: "Connected merchant and inventory data for repeatable shop workflows.", url: "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit" },
    { id: "recipes", title: "Fantasy Crafting & Alchemy Recipe Kit", detail: "Modular recipe records with ingredients, outputs, and linkage-ready IDs.", url: "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit" },
    { id: "loot", title: "Enemy Loot Table & Drop Profile Kit", detail: "Structured drop profiles for encounter rewards and progression tuning.", url: "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit" },
    { id: "quests", title: "Fantasy Quest, Contract & Reward Data Kit", detail: "Quest foundations with objectives, rewards, and system-neutral references.", url: "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit" },
    { id: "encounters", title: "Fantasy Encounter & Room Data Kit", detail: "Linked encounter and room records for modular adventure assembly.", url: "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit" }
  ]);

  function utf8Bytes(text) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(String(text)).length;
    return Buffer.byteLength(String(text), "utf8");
  }

  function trackedProductUrl(product, placement) {
    const url = new URL(product.url);
    url.search = new URLSearchParams({
      utm_source: "rpg_data_bridge",
      utm_medium: "free_tool",
      utm_campaign: "integration_code",
      utm_content: `bridge_${String(placement || "catalog")}_${product.id}`
    }).toString();
    return url.toString();
  }

  function parseCsv(text) {
    const source = String(text).replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    let closedQuote = false;

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (character === '"' && source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
          closedQuote = true;
        } else {
          field += character;
        }
        continue;
      }
      if (closedQuote && character !== "," && character !== "\r" && character !== "\n") {
        throw new Error(`CSV contains unexpected text after a closing quote at character ${index + 1}.`);
      }
      if (character === '"') {
        if (field.length > 0) throw new Error(`CSV contains an unexpected quote at character ${index + 1}.`);
        quoted = true;
        closedQuote = false;
      } else if (character === ",") {
        row.push(field);
        field = "";
        closedQuote = false;
      } else if (character === "\r" || character === "\n") {
        if (character === "\r" && source[index + 1] === "\n") index += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        closedQuote = false;
      } else {
        field += character;
      }
    }
    if (quoted) throw new Error("CSV ends inside a quoted field.");
    if (field.length > 0 || row.length > 0 || closedQuote) {
      row.push(field);
      rows.push(row);
    }
    while (rows.length > 0 && rows[rows.length - 1].every((value) => value === "")) rows.pop();
    if (rows.length === 0) throw new Error("CSV is empty.");

    const sourceHeaders = rows[0];
    if (sourceHeaders.length === 0) throw new Error("CSV needs a header row.");
    const seen = new Map();
    const warnings = [];
    const headers = sourceHeaders.map((header, index) => {
      const clean = String(header).trim();
      const sourceName = clean || `column_${index + 1}`;
      if (!clean) warnings.push(makeWarning("empty_csv_header", `column ${index + 1}`, `Header ${index + 1} is empty. It was represented as ${sourceName}. Rename it before integrating.`));
      const count = (seen.get(sourceName) || 0) + 1;
      seen.set(sourceName, count);
      if (count > 1) {
        const unique = `${sourceName}__${count}`;
        warnings.push(makeWarning("duplicate_csv_header", sourceName, `Header ${sourceName} appears more than once. The later column was represented as ${unique}. Use unique source headers.`));
        return unique;
      }
      return sourceName;
    });
    const records = rows.slice(1).map((values, rowIndex) => {
      if (values.length !== headers.length) throw new Error(`CSV row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}.`);
      const record = Object.create(null);
      headers.forEach((header, index) => { record[header] = values[index]; });
      return record;
    });
    return { records, warnings };
  }

  function sourceCollectionName(fileName) {
    const base = String(fileName || "records").replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "");
    return base || "records";
  }

  function detectFormat(text, requestedFormat, fileName) {
    if (requestedFormat === "json" || requestedFormat === "csv") return requestedFormat;
    if (/\.csv$/i.test(String(fileName || ""))) return "csv";
    if (/\.json$/i.test(String(fileName || ""))) return "json";
    const trimmed = String(text).trimStart();
    return trimmed.startsWith("{") || trimmed.startsWith("[") ? "json" : "csv";
  }

  function makeWarning(code, path, message) {
    return { code, path: String(path), message: String(message) };
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function stableField(name) {
    return /^id$/i.test(name) || /_ids?$/i.test(name) || /^id_/i.test(name) || /Ids?$/.test(name);
  }

  function singularName(value) {
    const normalized = identifierWords(value).join("_");
    if (normalized.endsWith("ies")) return `${normalized.slice(0, -3)}y`;
    if (normalized.endsWith("ses")) return normalized.slice(0, -2);
    if (normalized.endsWith("s") && !normalized.endsWith("ss")) return normalized.slice(0, -1);
    return normalized;
  }

  function isPrimaryId(sourceName, parentName) {
    const field = identifierWords(sourceName).join("_");
    const parent = singularName(parentName);
    const parentLead = parent.split("_")[0];
    return field === "id" || field === `${parent}_id` || field === `${parentLead}_id`;
  }

  function referenceHint(sourceName, collections) {
    const field = identifierWords(sourceName).join("_").replace(/_ids?$/, "");
    const candidates = [field, ...field.split("_").reverse()];
    const match = collections.find((collection) => candidates.includes(singularName(collection.sourceName)));
    return match ? match.sourceName : null;
  }

  function identifierWords(value) {
    const expanded = String(value).replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    const words = expanded.match(/[A-Za-z0-9]+/g) || [];
    return words.map((word) => word.toLowerCase());
  }

  function pascalName(value, fallback) {
    const words = identifierWords(value);
    let result = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("") || fallback || "Generated";
    if (/^[0-9]/.test(result)) result = `N${result}`;
    if (RESERVED_UNION.has(result.toLowerCase())) result += "Type";
    return result;
  }

  function fieldName(value, target) {
    const words = identifierWords(value);
    let result;
    if (target === TARGETS.GODOT) result = words.join("_") || "field_value";
    else result = words.length ? words[0] + words.slice(1).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("") : "fieldValue";
    if (/^[0-9]/.test(result)) result = `field_${result}`;
    if (RESERVED[target].has(result.toLowerCase())) result += target === TARGETS.GODOT ? "_value" : "Value";
    return result;
  }

  function uniqueNames(entries, target) {
    const used = new Map();
    return entries.map((entry) => {
      const base = fieldName(entry.sourceName, target);
      const count = (used.get(base.toLowerCase()) || 0) + 1;
      used.set(base.toLowerCase(), count);
      return { ...entry, generatedName: count === 1 ? base : `${base}${count}` };
    });
  }

  function warningCollector(initial) {
    const warnings = [...(initial || [])];
    const keys = new Set(warnings.map((warning) => `${warning.code}:${warning.path}:${warning.message}`));
    return {
      add(code, path, message) {
        const warning = makeWarning(code, path, message);
        const key = `${warning.code}:${warning.path}:${warning.message}`;
        if (!keys.has(key)) {
          keys.add(key);
          warnings.push(warning);
        }
      },
      list: warnings
    };
  }

  function inferValues(values, path, collector) {
    const nullable = values.some((value) => value === null);
    const nonNull = values.filter((value) => value !== null);
    if (nonNull.length === 0) {
      collector.add("null_only_field", path, "Every observed value is null. The generated type uses an unknown/Variant placeholder; provide at least one concrete value.");
      return { kind: "unknown", nullable: true, variants: ["null"] };
    }
    const kinds = [...new Set(nonNull.map((value) => {
      if (Array.isArray(value)) return "array";
      if (isPlainObject(value)) return "object";
      if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
      return typeof value;
    }))].sort();
    if (kinds.every((kind) => kind === "integer" || kind === "number")) {
      return { kind: kinds.includes("number") ? "number" : "integer", nullable };
    }
    if (kinds.length > 1) {
      collector.add("mixed_types", path, `Observed incompatible types (${kinds.join(", ")}). The generated type is intentionally conservative; normalize this field before engine import.`);
      return { kind: "unknown", nullable, variants: kinds };
    }
    const kind = kinds[0];
    if (kind === "object") return { kind, nullable, fields: inferObject(nonNull, path, collector) };
    if (kind === "array") {
      const elements = nonNull.flatMap((value) => value);
      if (elements.length === 0) {
        collector.add("empty_array", path, "All observed arrays are empty. Add a representative element so the element type can be inferred.");
        return { kind, nullable, element: { kind: "unknown", nullable: false, variants: [] } };
      }
      return { kind, nullable, element: inferValues(elements, `${path}[]`, collector) };
    }
    if (!["string", "boolean", "integer", "number"].includes(kind)) {
      collector.add("unsupported_value", path, `Observed unsupported JavaScript type ${kind}. The generated type uses an unknown/Variant placeholder.`);
      return { kind: "unknown", nullable, variants: [kind] };
    }
    return { kind, nullable };
  }

  function inferObject(records, path, collector) {
    const keys = [...new Set(records.flatMap((record) => Object.keys(record)))];
    keys.sort((left, right) => Number(stableField(right)) - Number(stableField(left)) || left.localeCompare(right, "en"));
    const baseNames = new Map();
    return keys.map((sourceName) => {
      const presentValues = records.filter((record) => Object.prototype.hasOwnProperty.call(record, sourceName)).map((record) => record[sourceName]);
      const optional = presentValues.length !== records.length;
      const fieldPath = `${path}.${sourceName}`;
      const descriptor = inferValues(presentValues, fieldPath, collector);
      const stableId = stableField(sourceName);
      if (optional) collector.add("missing_field", fieldPath, `Field is absent from ${records.length - presentValues.length} of ${records.length} records. Generated targets mark or document it as optional.`);
      if (stableId && (optional || descriptor.nullable)) collector.add("unstable_id", fieldPath, "A stable-ID field is missing or null in some records. Populate it consistently before integration.");
      const generic = fieldName(sourceName, TARGETS.TYPESCRIPT).toLowerCase();
      const collision = (baseNames.get(generic) || 0) + 1;
      baseNames.set(generic, collision);
      const cleanIdentifier = /^[A-Za-z_][A-Za-z0-9_]*$/.test(sourceName) && !RESERVED_UNION.has(sourceName.toLowerCase());
      if (!cleanIdentifier) collector.add("identifier_sanitized", fieldPath, `Source key ${JSON.stringify(sourceName)} requires a safe generated identifier. A source-name comment/attribute is included where supported.`);
      if (collision > 1) collector.add("identifier_collision", fieldPath, "This key sanitizes to the same identifier as another field. A deterministic numeric suffix is applied.");
      return { sourceName, optional, stableId, ...descriptor };
    });
  }

  function normalizeCollections(parsed, format, fileName, collector) {
    if (format === "csv") return [{ sourceName: sourceCollectionName(fileName), records: parsed.records }];
    if (Array.isArray(parsed)) return [{ sourceName: sourceCollectionName(fileName), records: parsed }];
    if (!isPlainObject(parsed)) throw new Error("JSON must contain an object or array at the top level.");
    const collections = [];
    Object.keys(parsed).sort((a, b) => a.localeCompare(b, "en")).forEach((key) => {
      const value = parsed[key];
      if (Array.isArray(value)) collections.push({ sourceName: key, records: value });
      else if (isPlainObject(value)) {
        collector.add("object_wrapped", key, "Top-level object was treated as a one-record collection so it can receive a generated integration type.");
        collections.push({ sourceName: key, records: [value] });
      } else collector.add("top_level_scalar_ignored", key, "Top-level scalar was not converted. Move it into a record object if it belongs in the integration schema.");
    });
    if (collections.length === 0) throw new Error("JSON contains no top-level record collections.");
    return collections;
  }

  function collectIdEvidence(fields, parentName, parentPath, collectionName, collections, output) {
    fields.forEach((field) => {
      const fieldPath = `${parentPath}.${field.sourceName}`;
      if (field.stableId) {
        const role = isPrimaryId(field.sourceName, parentName) ? "stable_id" : "relationship_id";
        output.push({
          collection: collectionName,
          path: fieldPath,
          field: field.sourceName,
          role,
          kind: field.kind,
          optional: field.optional,
          nullable: field.nullable,
          target_hint: role === "relationship_id" ? referenceHint(field.sourceName, collections) : null
        });
      }
      let descriptor = field;
      while (descriptor.kind === "array") descriptor = descriptor.element;
      if (descriptor.kind === "object") collectIdEvidence(descriptor.fields, field.sourceName, fieldPath, collectionName, collections, output);
    });
  }

  function analyzeText(text, options) {
    const source = String(text || "");
    const bytes = utf8Bytes(source);
    if (bytes > MAX_FILE_BYTES) throw new Error(`Input is ${bytes.toLocaleString("en-US")} bytes; the strict limit is ${MAX_FILE_BYTES.toLocaleString("en-US")} bytes.`);
    if (!source.trim()) throw new Error("Paste JSON or CSV data before generating code.");
    const settings = options || {};
    const format = detectFormat(source, settings.format || "auto", settings.fileName || "");
    const initialWarnings = [];
    let parsed;
    if (format === "json") parsed = JSON.parse(source);
    else {
      parsed = parseCsv(source);
      initialWarnings.push(...parsed.warnings);
    }
    const collector = warningCollector(initialWarnings);
    const rawCollections = normalizeCollections(parsed, format, settings.fileName || "records", collector);
    const collections = rawCollections.map((collection) => {
      const objectRecords = collection.records.filter(isPlainObject);
      const skipped = collection.records.length - objectRecords.length;
      if (skipped > 0) collector.add("non_object_records", collection.sourceName, `${skipped} non-object record(s) were skipped. Collections must contain record objects.`);
      if (objectRecords.length === 0) {
        collector.add("empty_collection", collection.sourceName, "Collection has no object records. Generated targets use an empty placeholder record type.");
      }
      const fields = objectRecords.length ? inferObject(objectRecords, collection.sourceName, collector) : [];
      if (!fields.some((field) => isPrimaryId(field.sourceName, collection.sourceName))) collector.add("missing_stable_id", collection.sourceName, "No collection-level stable ID was detected. Add id or a collection-named *_id field before connecting records across systems.");
      return {
        sourceName: collection.sourceName,
        typeName: `${pascalName(collection.sourceName, "Records")}Record`,
        recordCount: objectRecords.length,
        skippedRecords: skipped,
        fields
      };
    });
    const idEvidence = [];
    collections.forEach((collection) => collectIdEvidence(collection.fields, collection.sourceName, collection.sourceName, collection.sourceName, collections, idEvidence));
    const stableIds = idEvidence.filter((evidence) => evidence.role === "stable_id");
    const relationships = idEvidence.filter((evidence) => evidence.role === "relationship_id");
    return {
      format,
      bytes,
      collectionCount: collections.length,
      recordCount: collections.reduce((sum, collection) => sum + collection.recordCount, 0),
      collections,
      stableIds,
      relationships,
      warnings: collector.list.sort((a, b) => a.path.localeCompare(b.path, "en") || a.code.localeCompare(b.code, "en"))
    };
  }

  function escapedComment(value) {
    return String(value).replace(/[\r\n]+/g, " ").replace(/\*\//g, "* /");
  }

  function makeTypeRegistry(target) {
    const used = new Map();
    const byPath = new Map();
    return function register(path, suggestion) {
      if (byPath.has(path)) return byPath.get(path);
      let base = pascalName(suggestion, "GeneratedType");
      if (target === TARGETS.GODOT && !base.startsWith("Rpg")) base = `Rpg${base}`;
      const count = (used.get(base.toLowerCase()) || 0) + 1;
      used.set(base.toLowerCase(), count);
      const result = count === 1 ? base : `${base}${count}`;
      byPath.set(path, result);
      return result;
    };
  }

  function targetType(descriptor, target, nestedName, emitNested) {
    if (descriptor.kind === "array") return target === TARGETS.TYPESCRIPT ? `${targetType(descriptor.element, target, `${nestedName}Entry`, emitNested)}[]` : target === TARGETS.UNITY ? `List<${targetType(descriptor.element, target, `${nestedName}Entry`, emitNested)}>` : `Array[${targetType(descriptor.element, target, `${nestedName}Entry`, emitNested)}]`;
    if (descriptor.kind === "object") return emitNested(nestedName, descriptor.fields);
    if (descriptor.kind === "string") return target === TARGETS.TYPESCRIPT ? "string" : target === TARGETS.UNITY ? "string" : "String";
    if (descriptor.kind === "boolean") return target === TARGETS.TYPESCRIPT ? "boolean" : target === TARGETS.UNITY ? "bool" : "bool";
    if (descriptor.kind === "integer") return target === TARGETS.TYPESCRIPT ? "number" : target === TARGETS.UNITY ? "int" : "int";
    if (descriptor.kind === "number") return target === TARGETS.TYPESCRIPT ? "number" : target === TARGETS.UNITY ? "float" : "float";
    return target === TARGETS.TYPESCRIPT ? "unknown" : target === TARGETS.UNITY ? "object" : "Variant";
  }

  function generateTypeScript(analysis) {
    const register = makeTypeRegistry(TARGETS.TYPESCRIPT);
    const definitions = [];
    const emitted = new Set();
    function emit(path, suggestion, fields) {
      const name = register(path, suggestion);
      if (emitted.has(path)) return name;
      emitted.add(path);
      const mapped = uniqueNames(fields, TARGETS.TYPESCRIPT);
      const lines = [`export interface ${name} {`];
      mapped.forEach((field) => {
        const nested = (nestedSuggestion, nestedFields) => emit(`${path}.${field.sourceName}`, `${name}${pascalName(field.sourceName, "Field")}`, nestedFields);
        const type = targetType(field, TARGETS.TYPESCRIPT, `${name}${pascalName(field.sourceName, "Entry")}`, nested);
        if (field.stableId) lines.push(`  /** Stable ID from source field ${JSON.stringify(escapedComment(field.sourceName))}. */`);
        else if (field.generatedName !== field.sourceName) lines.push(`  /** Source field: ${JSON.stringify(escapedComment(field.sourceName))}. */`);
        const nullable = field.nullable ? " | null" : "";
        lines.push(`  ${field.generatedName}${field.optional ? "?" : ""}: ${type}${nullable};`);
      });
      lines.push("}");
      definitions.push({ path, text: lines.join("\n") });
      return name;
    }
    const roots = analysis.collections.map((collection) => ({ collection, typeName: emit(collection.sourceName, collection.typeName, collection.fields) }));
    const payload = ["export interface RpgDataBridgePayload {", ...uniqueNames(roots.map((entry) => ({ sourceName: entry.collection.sourceName, ...entry })), TARGETS.TYPESCRIPT).flatMap((entry) => {
      const comments = entry.generatedName !== entry.sourceName ? [`  /** Source collection: ${JSON.stringify(escapedComment(entry.sourceName))}. */`] : [];
      return [...comments, `  ${entry.generatedName}: ${entry.typeName}[];`];
    }), "}"].join("\n");
    return ["// Generated by RPG Data Bridge. Review warnings before integration.", "// Imported data was parsed locally and was never executed or uploaded.", "", payload, "", ...definitions.map((definition) => definition.text)].join("\n\n").trim() + "\n";
  }

  function escapeCSharp(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ");
  }

  function generateUnity(analysis) {
    const register = makeTypeRegistry(TARGETS.UNITY);
    const definitions = [];
    const emitted = new Set();
    function emit(path, suggestion, fields) {
      const name = register(path, suggestion);
      if (emitted.has(path)) return name;
      emitted.add(path);
      const lines = ["[Serializable]", `public class ${name}`, "{"];
      uniqueNames(fields, TARGETS.UNITY).forEach((field) => {
        const nested = (nestedSuggestion, nestedFields) => emit(`${path}.${field.sourceName}`, `${name}${pascalName(field.sourceName, "Field")}`, nestedFields);
        const type = targetType(field, TARGETS.UNITY, `${name}${pascalName(field.sourceName, "Entry")}`, nested);
        if (field.stableId) lines.push(`    // Stable ID from source field ${JSON.stringify(escapedComment(field.sourceName))}.`);
        if (field.generatedName !== field.sourceName) lines.push(`    [FormerlySerializedAs("${escapeCSharp(field.sourceName)}")]`);
        if ((field.nullable || field.optional) && ["integer", "number", "boolean"].includes(field.kind)) lines.push("    // Source may be missing/null; normalize or add a presence flag before JsonUtility import.");
        lines.push(`    public ${type} ${field.generatedName};`);
      });
      lines.push("}");
      definitions.push({ path, text: lines.join("\n") });
      return name;
    }
    const roots = analysis.collections.map((collection) => ({ collection, typeName: emit(collection.sourceName, collection.typeName, collection.fields) }));
    const wrapper = ["[Serializable]", "public class RpgDataBridgePayload", "{", ...uniqueNames(roots.map((entry) => ({ sourceName: entry.collection.sourceName, ...entry })), TARGETS.UNITY).flatMap((entry) => {
      const lines = [];
      if (entry.generatedName !== entry.sourceName) lines.push(`    [FormerlySerializedAs("${escapeCSharp(entry.sourceName)}")]`);
      lines.push(`    public List<${entry.typeName}> ${entry.generatedName} = new List<${entry.typeName}>();`);
      return lines;
    }), "}"].join("\n");
    return ["// Generated by RPG Data Bridge. Review warnings before integration.", "// JsonUtility requires a top-level wrapper; RpgDataBridgePayload provides it.", "using System;", "using System.Collections.Generic;", "using UnityEngine.Serialization;", "", wrapper, "", ...definitions.map((definition) => definition.text)].join("\n\n").trim() + "\n";
  }

  function generateGodot(analysis) {
    const register = makeTypeRegistry(TARGETS.GODOT);
    const definitions = [];
    const emitted = new Set();
    function emit(path, suggestion, fields) {
      const name = register(path, suggestion);
      if (emitted.has(path)) return name;
      emitted.add(path);
      const fileName = name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
      const lines = [`# File: ${fileName}.gd`, `class_name ${name}`, "extends Resource", ""];
      uniqueNames(fields, TARGETS.GODOT).forEach((field) => {
        const nested = (nestedSuggestion, nestedFields) => emit(`${path}.${field.sourceName}`, `${name}${pascalName(field.sourceName, "Field")}`, nestedFields);
        const type = targetType(field, TARGETS.GODOT, `${name}${pascalName(field.sourceName, "Entry")}`, nested);
        if (field.stableId) lines.push(`# Stable ID from source field ${JSON.stringify(escapedComment(field.sourceName))}.`);
        else if (field.generatedName !== field.sourceName) lines.push(`# Source field: ${JSON.stringify(escapedComment(field.sourceName))}.`);
        lines.push(`@export var ${field.generatedName}: ${type}`);
      });
      definitions.push({ path, text: lines.join("\n").trimEnd() });
      return name;
    }
    const roots = analysis.collections.map((collection) => ({ collection, typeName: emit(collection.sourceName, collection.typeName, collection.fields) }));
    const payload = ["# File: rpg_data_bridge_payload.gd", "class_name RpgDataBridgePayload", "extends Resource", "", ...uniqueNames(roots.map((entry) => ({ sourceName: entry.collection.sourceName, ...entry })), TARGETS.GODOT).flatMap((entry) => {
      const lines = [];
      if (entry.generatedName !== entry.sourceName) lines.push(`# Source collection: ${JSON.stringify(escapedComment(entry.sourceName))}.`);
      lines.push(`@export var ${entry.generatedName}: Array[${entry.typeName}]`);
      return lines;
    })].join("\n");
    return ["# Generated by RPG Data Bridge. Review warnings before integration.", "# Save each marked section as its own Godot 4 script.", "", payload, "", ...definitions.map((definition) => definition.text)].join("\n\n").trim() + "\n";
  }

  function generateCode(analysis, target) {
    if (!analysis || !Array.isArray(analysis.collections)) throw new Error("Analyze source data before generating code.");
    if (target === TARGETS.TYPESCRIPT) return generateTypeScript(analysis);
    if (target === TARGETS.UNITY) return generateUnity(analysis);
    if (target === TARGETS.GODOT) return generateGodot(analysis);
    throw new Error(`Unsupported target: ${target}`);
  }

  function mappingType(descriptor, target) {
    if (descriptor.kind === "array") {
      const element = mappingType(descriptor.element, target);
      if (target === TARGETS.TYPESCRIPT) return `${element}[]`;
      if (target === TARGETS.UNITY) return `List<${element}>`;
      return `Array[${element}]`;
    }
    if (descriptor.kind === "object") return target === TARGETS.TYPESCRIPT ? "interface" : target === TARGETS.UNITY ? "serializable_class" : "Resource";
    if (descriptor.kind === "string") return target === TARGETS.TYPESCRIPT ? "string" : target === TARGETS.UNITY ? "string" : "String";
    if (descriptor.kind === "boolean") return target === TARGETS.TYPESCRIPT ? "boolean" : "bool";
    if (descriptor.kind === "integer") return target === TARGETS.TYPESCRIPT ? "number" : target === TARGETS.UNITY ? "int" : "int";
    if (descriptor.kind === "number") return target === TARGETS.TYPESCRIPT ? "number" : target === TARGETS.UNITY ? "float" : "float";
    return target === TARGETS.TYPESCRIPT ? "unknown" : target === TARGETS.UNITY ? "object" : "Variant";
  }

  function nestedFields(descriptor) {
    let current = descriptor;
    while (current.kind === "array") current = current.element;
    return current.kind === "object" ? current.fields : null;
  }

  function mappingFields(fields, parentPath, analysis) {
    const names = {
      typescript: uniqueNames(fields, TARGETS.TYPESCRIPT),
      unity: uniqueNames(fields, TARGETS.UNITY),
      godot: uniqueNames(fields, TARGETS.GODOT)
    };
    return fields.map((field, index) => {
      const path = `${parentPath}.${field.sourceName}`;
      const evidence = [...analysis.stableIds, ...analysis.relationships].find((item) => item.path === path) || null;
      const children = nestedFields(field);
      return {
        source_field: field.sourceName,
        source_path: path,
        inferred_kind: field.kind,
        optional: field.optional,
        nullable: field.nullable,
        target_names: {
          typescript: names.typescript[index].generatedName,
          unity: names.unity[index].generatedName,
          godot: names.godot[index].generatedName
        },
        target_types: {
          typescript: mappingType(field, TARGETS.TYPESCRIPT),
          unity: mappingType(field, TARGETS.UNITY),
          godot: mappingType(field, TARGETS.GODOT)
        },
        id_or_reference_evidence: evidence ? { role: evidence.role, target_hint: evidence.target_hint } : null,
        fields: children ? mappingFields(children, path, analysis) : []
      };
    });
  }

  function generateMappingManifest(analysis) {
    if (!analysis || !Array.isArray(analysis.collections)) throw new Error("Analyze source data before generating a mapping manifest.");
    const mapping = {
      product: "RPG Data Bridge",
      mapping_version: "1.0.0",
      deterministic: true,
      imported_record_values_included: false,
      paired_preflight_tool: "RPG Game Data Doctor",
      source_schema: {
        format: analysis.format,
        bytes: analysis.bytes,
        collection_count: analysis.collectionCount,
        record_count: analysis.recordCount
      },
      stable_id_evidence: analysis.stableIds,
      relationship_evidence: analysis.relationships,
      collections: analysis.collections.map((collection) => ({
        source_collection: collection.sourceName,
        record_count: collection.recordCount,
        skipped_records: collection.skippedRecords,
        generated_types: {
          typescript: collection.typeName,
          unity: collection.typeName,
          godot: `Rpg${collection.typeName}`
        },
        fields: mappingFields(collection.fields, collection.sourceName, analysis)
      })),
      schema_warnings: analysis.warnings
    };
    return `${JSON.stringify(mapping, null, 2)}\n`;
  }

  function bridgeText(text, options) {
    const settings = options || {};
    const analysis = analyzeText(text, settings);
    const target = settings.target || TARGETS.TYPESCRIPT;
    return { analysis, target, code: generateCode(analysis, target) };
  }

  return Object.freeze({ MAX_FILE_BYTES, TARGETS, PRODUCTS, utf8Bytes, parseCsv, detectFormat, stableField, fieldName, pascalName, trackedProductUrl, analyzeText, generateCode, generateMappingManifest, bridgeText });
});
