var CampaignWorkspaceRuntimeBundle = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // machines/machine-005/campaign-workspace/campaign-workspace-core.js
  var require_campaign_workspace_core = __commonJS({
    "machines/machine-005/campaign-workspace/campaign-workspace-core.js"(exports, module) {
      (function attachCampaignWorkspaceCore(root, factory) {
        const api2 = factory();
        if (typeof module !== "undefined" && module.exports) module.exports = api2;
        if (root) root.CampaignWorkspaceCore = api2;
      })(typeof globalThis !== "undefined" ? globalThis : exports, function createCampaignWorkspaceCore() {
        "use strict";
        const VERSION = "1.0.0";
        const OPEN_STATES = /* @__PURE__ */ new Set([
          "active",
          "blocked",
          "contested",
          "fractured",
          "hostile",
          "incomplete",
          "missing",
          "open",
          "pending",
          "strained",
          "threatened",
          "unresolved"
        ]);
        const CLOSED_STATES = /* @__PURE__ */ new Set(["answered", "closed", "complete", "completed", "resolved", "retired", "settled"]);
        const THREAD_TYPES = /(?:campaign_)?thread|front|mystery|problem|project/i;
        const ACTIVE_RELATIONSHIP_TYPES = /* @__PURE__ */ new Set([
          "opposes",
          "participates_in_front",
          "pursues",
          "pursues_project",
          "threatens"
        ]);
        const OPEN_KEY = /blocked|contested|danger|missing|open|owed|threat|unresolved|wanted/i;
        const CLOSED_KEY = /answered|closed|complete|recovered|resolved|secured|settled/i;
        const TONES = Object.freeze({
          grounded: Object.freeze({
            label: "Grounded",
            direction: "Keep costs concrete, choices legible, and consequences visible."
          }),
          heroic: Object.freeze({
            label: "Heroic",
            direction: "Give decisive action a visible chance to protect people or restore agency."
          }),
          intrigue: Object.freeze({
            label: "Intrigue",
            direction: "Make evidence, obligations, and competing accounts alter who holds leverage."
          })
        });
        const SCENE_TEMPLATES = Object.freeze([
          Object.freeze({
            id: "consequence",
            title: "Open on the consequence",
            purpose: "Show that prior campaign state is already changing the situation."
          }),
          Object.freeze({
            id: "trace",
            title: "Trace the pressure",
            purpose: "Let the players identify a cause, witness, route, or obligation behind the pressure."
          }),
          Object.freeze({
            id: "leverage",
            title: "Offer usable leverage",
            purpose: "Reveal a connected person, asset, or promise that can change the objective."
          }),
          Object.freeze({
            id: "collision",
            title: "Put interests in conflict",
            purpose: "Make two established campaign elements demand incompatible responses."
          }),
          Object.freeze({
            id: "cost",
            title: "Reveal the cost",
            purpose: "Make delay or partial success alter a tracked consequence."
          }),
          Object.freeze({
            id: "decision",
            title: "Force the decision",
            purpose: "Resolve the central question through a choice with more than one defensible answer."
          }),
          Object.freeze({
            id: "record",
            title: "Record the new truth",
            purpose: "End with an explicit fact, clock change, or open thread for Canon to preserve."
          })
        ]);
        function isObject3(value) {
          return value !== null && typeof value === "object" && !Array.isArray(value);
        }
        function cloneJson2(value) {
          return value === void 0 ? void 0 : JSON.parse(JSON.stringify(value));
        }
        function deepFreeze(value) {
          if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
          Object.freeze(value);
          Object.values(value).forEach(deepFreeze);
          return value;
        }
        function hash2(text) {
          let value = 2166136261;
          for (const character of String(text)) {
            value ^= character.charCodeAt(0);
            value = Math.imul(value, 16777619);
          }
          return value >>> 0;
        }
        function hexHash(text) {
          return hash2(text).toString(16).padStart(8, "0");
        }
        function sortJson(value) {
          if (Array.isArray(value)) return value.map(sortJson);
          if (!isObject3(value)) return value;
          return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortJson(value[key])]));
        }
        function stableStringify(value) {
          return JSON.stringify(sortJson(value));
        }
        function humanize(value) {
          return String(value).replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (character) => character.toUpperCase());
        }
        function possessive(name) {
          return /s$/i.test(name) ? `${name}'` : `${name}'s`;
        }
        function unique(values) {
          return [...new Set(values)];
        }
        function clampInteger(value, minimum, maximum, fallback) {
          const parsed = Number(value);
          return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
        }
        function normalizeOptions(input = {}) {
          if (!isObject3(input)) throw new Error("Campaign Workspace options must be an object.");
          const seed = typeof input.seed === "string" ? input.seed.trim().slice(0, 64) : "";
          if (!seed) throw new Error("A non-empty deterministic seed is required.");
          const tone = input.tone ?? "grounded";
          if (!TONES[tone]) throw new Error(`Unsupported tone: ${tone}.`);
          return Object.freeze({
            seed,
            tone,
            sessionNumber: clampInteger(input.sessionNumber, 1, 999, 1),
            sceneCount: clampInteger(input.sceneCount, 3, 7, 5),
            entityLimit: clampInteger(input.entityLimit, 3, 10, 6),
            callbackLimit: clampInteger(input.callbackLimit, 2, 6, 4)
          });
        }
        function unwrapSnapshot(input) {
          if (!isObject3(input)) return { campaignId: null, entities: null, relationships: null };
          const registry = isObject3(input.registry) ? input.registry : input;
          return {
            campaignId: input.campaign_id ?? input.campaignId ?? input.summary?.campaignId ?? "campaign",
            entities: registry.entities,
            relationships: registry.relationships
          };
        }
        function validateSnapshot(input) {
          const errors = [];
          const snapshot = unwrapSnapshot(input);
          if (typeof snapshot.campaignId !== "string" || !snapshot.campaignId) {
            errors.push("Snapshot campaign ID must be a non-empty string.");
          }
          if (!Array.isArray(snapshot.entities)) errors.push("Snapshot entities must be an array.");
          if (!Array.isArray(snapshot.relationships)) errors.push("Snapshot relationships must be an array.");
          if (errors.length) {
            return {
              valid: false,
              errors,
              summary: { campaignId: snapshot.campaignId, entities: 0, relationships: 0 }
            };
          }
          const entityIds = /* @__PURE__ */ new Set();
          for (const [index, entity] of snapshot.entities.entries()) {
            const label = `Entity ${index + 1}`;
            if (!isObject3(entity)) {
              errors.push(`${label} must be an object.`);
              continue;
            }
            if (typeof entity.id !== "string" || !entity.id) errors.push(`${label} is missing an ID.`);
            else if (entityIds.has(entity.id)) errors.push(`Duplicate entity ID: ${entity.id}.`);
            else entityIds.add(entity.id);
            if (typeof entity.entity_type !== "string" || !entity.entity_type) {
              errors.push(`${label} is missing entity_type.`);
            }
            if (typeof entity.name !== "string" || !entity.name) errors.push(`${label} is missing a name.`);
            if (entity.status !== void 0 && (typeof entity.status !== "string" || !entity.status)) {
              errors.push(`${label} has an invalid status.`);
            }
            if (entity.attributes !== void 0 && !isObject3(entity.attributes)) {
              errors.push(`${label} attributes must be an object.`);
              continue;
            }
            const facts = entity.attributes?.facts;
            if (facts !== void 0 && !isObject3(facts)) errors.push(`${label} facts must be an object.`);
            const clocks = entity.attributes?.clocks;
            if (clocks !== void 0 && !isObject3(clocks)) {
              errors.push(`${label} clocks must be an object.`);
            } else if (isObject3(clocks)) {
              for (const [clockId, clock] of Object.entries(clocks)) {
                if (!clockId || !isObject3(clock)) {
                  errors.push(`${label} clock ${clockId || "(empty)"} must be an object.`);
                  continue;
                }
                const minimum = clock.minimum ?? 0;
                if (!Number.isInteger(minimum) || !Number.isInteger(clock.maximum) || !Number.isInteger(clock.value)) {
                  errors.push(`${label} clock ${clockId} requires integer value, minimum, and maximum.`);
                } else if (minimum >= clock.maximum || clock.value < minimum || clock.value > clock.maximum) {
                  errors.push(`${label} clock ${clockId} is outside its declared bounds.`);
                }
              }
            }
          }
          const relationshipIds = /* @__PURE__ */ new Set();
          for (const [index, relationship] of snapshot.relationships.entries()) {
            const label = `Relationship ${index + 1}`;
            if (!isObject3(relationship)) {
              errors.push(`${label} must be an object.`);
              continue;
            }
            if (typeof relationship.id !== "string" || !relationship.id) errors.push(`${label} is missing an ID.`);
            else if (relationshipIds.has(relationship.id)) errors.push(`Duplicate relationship ID: ${relationship.id}.`);
            else relationshipIds.add(relationship.id);
            if (typeof relationship.from !== "string" || !entityIds.has(relationship.from)) {
              errors.push(`${label} has a missing from endpoint: ${relationship.from}.`);
            }
            if (typeof relationship.to !== "string" || !entityIds.has(relationship.to)) {
              errors.push(`${label} has a missing to endpoint: ${relationship.to}.`);
            }
            if (typeof relationship.relationship_type !== "string" || !relationship.relationship_type) {
              errors.push(`${label} is missing relationship_type.`);
            }
          }
          return {
            valid: errors.length === 0,
            errors,
            summary: {
              campaignId: snapshot.campaignId,
              entities: snapshot.entities.length,
              relationships: snapshot.relationships.length
            }
          };
        }
        function buildIndex(input) {
          const validation = validateSnapshot(input);
          if (!validation.valid) throw new Error(validation.errors.join("\n"));
          const normalized = unwrapSnapshot(input);
          const entities = [...normalized.entities].map(cloneJson2).sort((left, right) => left.id.localeCompare(right.id));
          const relationships = [...normalized.relationships].map(cloneJson2).sort((left, right) => left.id.localeCompare(right.id));
          const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
          const relationshipsById = new Map(relationships.map((relationship) => [relationship.id, relationship]));
          const outgoing = /* @__PURE__ */ new Map();
          const incoming = /* @__PURE__ */ new Map();
          for (const relationship of relationships) {
            if (!outgoing.has(relationship.from)) outgoing.set(relationship.from, []);
            if (!incoming.has(relationship.to)) incoming.set(relationship.to, []);
            outgoing.get(relationship.from).push(relationship);
            incoming.get(relationship.to).push(relationship);
          }
          return {
            campaignId: normalized.campaignId,
            entities,
            relationships,
            entitiesById,
            relationshipsById,
            outgoing,
            incoming,
            neighbors(entityId) {
              return unique([
                ...(outgoing.get(entityId) ?? []).map((relationship) => relationship.to),
                ...(incoming.get(entityId) ?? []).map((relationship) => relationship.from)
              ]);
            },
            connectingRelationships(entityIds) {
              const ids = new Set(entityIds);
              return relationships.filter((relationship) => ids.has(relationship.from) && ids.has(relationship.to));
            },
            degree(entityId) {
              return (outgoing.get(entityId)?.length ?? 0) + (incoming.get(entityId)?.length ?? 0);
            }
          };
        }
        function stateWord(value) {
          if (typeof value === "string") return value.trim().toLowerCase();
          if (isObject3(value) && typeof value.status === "string") return value.status.trim().toLowerCase();
          return null;
        }
        function isUnresolvedFact(key, value) {
          const state = stateWord(value);
          if (state && OPEN_STATES.has(state)) return true;
          if (state && CLOSED_STATES.has(state)) return false;
          if (value === false && CLOSED_KEY.test(key)) return true;
          if (value === true && OPEN_KEY.test(key)) return true;
          return false;
        }
        function summarizeFact(key, value) {
          const state = stateWord(value);
          if (state) return `${humanize(key)} remains ${state}.`;
          if (value === false) return `${humanize(key)} has not been secured.`;
          if (value === true) return `${humanize(key)} remains active.`;
          return `${humanize(key)} remains unresolved.`;
        }
        function sourceReference(kind, id, path) {
          const reference = { kind, id };
          if (path) reference.path = path;
          return reference;
        }
        function clockPressure(clockId, clock) {
          const normalizedId = String(clockId).toLowerCase();
          const minimum = clock.minimum ?? 0;
          const range = clock.maximum - minimum;
          const progress = range > 0 ? (clock.value - minimum) / range : 0;
          if (normalizedId === "momentum" || normalizedId === "bond") return null;
          if (normalizedId === "reputation") {
            if (clock.value >= 0 || minimum >= 0) return null;
            return Math.abs(clock.value) / Math.abs(minimum);
          }
          if (normalizedId === "strain" && clock.value === 0) return null;
          return progress;
        }
        function collectSignals(index, options) {
          const signals = [];
          for (const entity of index.entities) {
            if ((entity.status ?? "active").toLowerCase() === "archived") continue;
            const entityStatus = (entity.status ?? "active").toLowerCase();
            if (THREAD_TYPES.test(entity.entity_type) && OPEN_STATES.has(entityStatus)) {
              signals.push({
                signal_id: `thread:${entity.id}`,
                kind: "thread",
                entity_id: entity.id,
                label: entity.name,
                detail: `${entity.name} remains ${entityStatus}.`,
                score: 90,
                urgency: "high",
                source_references: [sourceReference("entity", entity.id, "status")]
              });
            }
            for (const [key, value] of Object.entries(entity.attributes?.facts ?? {})) {
              if (!isUnresolvedFact(key, value)) continue;
              signals.push({
                signal_id: `fact:${entity.id}:${key}`,
                kind: "fact",
                entity_id: entity.id,
                fact_key: key,
                label: humanize(key),
                detail: summarizeFact(key, value),
                score: 85,
                urgency: "high",
                source_references: [sourceReference("entity", entity.id, `attributes.facts.${key}`)]
              });
            }
            for (const [clockId, clock] of Object.entries(entity.attributes?.clocks ?? {})) {
              const minimum = clock.minimum ?? 0;
              const progress = clockPressure(clockId, clock);
              if (progress === null) continue;
              const score = 55 + Math.round(progress * 55);
              signals.push({
                signal_id: `clock:${entity.id}:${clockId}`,
                kind: "clock",
                entity_id: entity.id,
                clock_id: clockId,
                label: clock.label || humanize(clockId),
                detail: `${clock.label || humanize(clockId)} is at ${clock.value} of ${clock.maximum}.`,
                score,
                urgency: progress >= 0.75 ? "critical" : progress >= 0.5 ? "high" : "active",
                progress,
                current: clock.value,
                minimum,
                maximum: clock.maximum,
                source_references: [sourceReference("entity", entity.id, `attributes.clocks.${clockId}`)]
              });
            }
          }
          for (const relationship of index.relationships) {
            if (!ACTIVE_RELATIONSHIP_TYPES.has(relationship.relationship_type)) continue;
            const from = index.entitiesById.get(relationship.from);
            const to = index.entitiesById.get(relationship.to);
            if (!from || !to || (from.status ?? "active") === "archived" || (to.status ?? "active") === "archived") {
              continue;
            }
            signals.push({
              signal_id: `relationship:${relationship.id}`,
              kind: "relationship",
              entity_id: to.id,
              relationship_id: relationship.id,
              label: to.name,
              detail: `${from.name} ${humanize(relationship.relationship_type).toLowerCase()} ${to.name}.`,
              score: relationship.relationship_type === "participates_in_front" ? 92 : 88,
              urgency: "high",
              source_references: [
                sourceReference("entity", from.id),
                sourceReference("entity", to.id),
                sourceReference("relationship", relationship.id)
              ]
            });
          }
          if (!signals.length) {
            for (const entity of index.entities.filter((row) => (row.status ?? "active") !== "archived")) {
              signals.push({
                signal_id: `connection:${entity.id}`,
                kind: "connection",
                entity_id: entity.id,
                label: entity.name,
                detail: `${entity.name} has ${index.degree(entity.id)} active campaign connection(s).`,
                score: 30 + Math.min(index.degree(entity.id), 10),
                urgency: "developing",
                source_references: [sourceReference("entity", entity.id)]
              });
            }
          }
          return signals.sort((left, right) => {
            return right.score - left.score || hash2(`${options.seed}|signal|${left.signal_id}`) - hash2(`${options.seed}|signal|${right.signal_id}`) || left.signal_id.localeCompare(right.signal_id);
          });
        }
        function describeObjective(signal, entity) {
          if (signal.kind === "clock") {
            return `Keep ${possessive(entity.name)} ${signal.label.toLowerCase()} below its limit by changing its cause, not only its visible symptom.`;
          }
          if (signal.kind === "thread") {
            return `Put the open thread "${entity.name}" under a consequential choice, then record what becomes true.`;
          }
          if (signal.kind === "fact") {
            return `Resolve ${signal.label.toLowerCase()} around ${entity.name} before it creates another consequence.`;
          }
          if (signal.kind === "relationship") {
            return `Advance ${entity.name} by forcing a choice that changes the relationship pulling it into play.`;
          }
          return `Put ${entity.name} under a consequential choice that changes one established relationship.`;
        }
        function describeStake(signal, entity) {
          if (signal.kind === "clock") {
            const remaining = signal.maximum - signal.current;
            return `${signal.label} has only ${remaining} segment${remaining === 1 ? "" : "s"} remaining around ${entity.name}.`;
          }
          if (signal.kind === "thread") return `${entity.name} is still open and can pull connected people or assets into the next consequence.`;
          if (signal.kind === "fact") return `${signal.detail} Leaving it untouched makes the campaign state less trustworthy.`;
          if (signal.kind === "relationship") return `${signal.detail} Ignoring that commitment lets its consequences advance without a player decision.`;
          return `${entity.name} is highly connected; changing it will be visible elsewhere in the campaign.`;
        }
        function leverageFor(entity) {
          const type = entity.entity_type.toLowerCase();
          if (/character|merchant|npc/.test(type)) return "testimony or cooperation";
          if (/faction/.test(type)) return "authority, reach, or opposition";
          if (/location|settlement/.test(type)) return "access, shelter, or a dangerous route";
          if (/item|loot/.test(type)) return "a concrete asset";
          if (/recipe/.test(type)) return "a repair or transformation";
          if (/quest|thread|project/.test(type)) return "an obligation or disputed claim";
          if (/encounter|enemy|creature/.test(type)) return "an immediate threat or tactical opening";
          return "a connected source of leverage";
        }
        function collectInvolvedEntities(index, signals, options) {
          const scoreById = /* @__PURE__ */ new Map();
          signals.slice(0, options.callbackLimit).forEach((signal, position) => {
            scoreById.set(signal.entity_id, Math.max(scoreById.get(signal.entity_id) ?? 0, signal.score + 20 - position));
          });
          const primaryId = signals[0].entity_id;
          for (const neighborId of index.neighbors(primaryId)) {
            scoreById.set(neighborId, Math.max(scoreById.get(neighborId) ?? 0, 50 + index.degree(neighborId)));
          }
          for (const entity of index.entities) {
            if (!scoreById.has(entity.id) && index.degree(entity.id) > 0) {
              scoreById.set(entity.id, 20 + index.degree(entity.id));
            }
          }
          return [...scoreById.entries()].map(([entityId, relevanceScore]) => ({ entity: index.entitiesById.get(entityId), relevanceScore })).filter((entry) => entry.entity && (entry.entity.status ?? "active") !== "archived").sort((left, right) => {
            return right.relevanceScore - left.relevanceScore || hash2(`${options.seed}|entity|${left.entity.id}`) - hash2(`${options.seed}|entity|${right.entity.id}`) || left.entity.id.localeCompare(right.entity.id);
          }).slice(0, options.entityLimit).map((entry, position) => ({
            id: entry.entity.id,
            name: entry.entity.name,
            entity_type: entry.entity.entity_type,
            role: position === 0 ? "primary pressure" : signals.some((signal) => signal.entity_id === entry.entity.id) ? "continuity thread" : "connected consequence",
            relevance_score: entry.relevanceScore,
            source_references: [sourceReference("entity", entry.entity.id)]
          }));
        }
        function sceneTemplateIndexes(sceneCount) {
          if (sceneCount === 3) return [0, 3, 6];
          if (sceneCount === 4) return [0, 1, 5, 6];
          if (sceneCount === 5) return [0, 1, 3, 5, 6];
          if (sceneCount === 6) return [0, 1, 2, 3, 5, 6];
          return [0, 1, 2, 3, 4, 5, 6];
        }
        function buildScenes(index, signals, involved, options, briefId) {
          const primary = index.entitiesById.get(signals[0].entity_id);
          const templates = sceneTemplateIndexes(options.sceneCount).map((indexValue) => SCENE_TEMPLATES[indexValue]);
          const involvedIds = involved.map((entity) => entity.id);
          return templates.map((template, position) => {
            const secondaryId = involvedIds[1 + position % Math.max(1, involvedIds.length - 1)] ?? primary.id;
            const secondary = index.entitiesById.get(secondaryId) ?? primary;
            const signal = signals[position % Math.min(signals.length, options.callbackLimit)];
            const signalEntity = index.entitiesById.get(signal.entity_id);
            const focusIds = unique([primary.id, signalEntity.id, secondary.id]);
            const relationships = index.connectingRelationships(focusIds);
            const references = [
              ...focusIds.map((id) => sourceReference("entity", id)),
              ...relationships.map((relationship) => sourceReference("relationship", relationship.id))
            ];
            const beat = position === 0 ? `${signalEntity.name} makes the consequence visible before anyone can treat it as background: ${signal.detail}` : `${secondary.name} offers ${leverageFor(secondary)}, but using it changes how the group can answer ${signal.label.toLowerCase()} around ${primary.name}.`;
            return {
              scene_id: `cws-${String(position + 1).padStart(2, "0")}-${hexHash(`${briefId}|${template.id}|${signal.signal_id}|${secondary.id}`)}`,
              order: position + 1,
              title: template.title,
              purpose: template.purpose,
              beat,
              choice: position === templates.length - 1 ? `State which truth changes, which track moves, and which thread remains open around ${primary.name}.` : `Choose whether to use ${possessive(secondary.name)} leverage, reduce the immediate pressure, or preserve that option for the next scene.`,
              consequence_if_ignored: signal.kind === "clock" ? `${signal.label} remains at ${signal.current}/${signal.maximum} and should advance when the fiction supports it.` : `${signal.detail} Preserve it as an explicit callback in the next brief.`,
              focus_entity_ids: focusIds,
              source_references: references
            };
          });
        }
        function collectReferences(brief) {
          const references = [];
          const append = (rows) => {
            for (const reference of rows ?? []) references.push(reference);
          };
          append(brief.objective?.source_references);
          brief.stakes?.forEach((stake) => append(stake.source_references));
          brief.involved_entities?.forEach((entity) => append(entity.source_references));
          brief.continuity_callbacks?.forEach((callback) => append(callback.source_references));
          brief.scenes?.forEach((scene) => append(scene.source_references));
          const keyed = /* @__PURE__ */ new Map();
          references.forEach((reference) => keyed.set(`${reference.kind}:${reference.id}:${reference.path ?? ""}`, reference));
          return [...keyed.values()].sort((left, right) => {
            return left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id) || String(left.path ?? "").localeCompare(String(right.path ?? ""));
          });
        }
        function buildStakes(index, signals, involved, briefId, options) {
          const stakes = signals.slice(0, Math.min(3, signals.length)).map((signal) => {
            const entity = index.entitiesById.get(signal.entity_id);
            return {
              stake_id: `cwk-${hexHash(`${briefId}|${signal.signal_id}`)}`,
              entity_id: entity.id,
              urgency: signal.urgency,
              text: describeStake(signal, entity),
              source_references: signal.source_references
            };
          });
          if (stakes.length >= 3) return stakes;
          const primaryId = signals[0].entity_id;
          const involvedIds = new Set(involved.map((entity) => entity.id));
          const connected = index.relationships.filter((relationship) => {
            return (relationship.from === primaryId || relationship.to === primaryId) && involvedIds.has(relationship.from) && involvedIds.has(relationship.to);
          }).sort((left, right) => {
            return hash2(`${options.seed}|stake|${left.id}`) - hash2(`${options.seed}|stake|${right.id}`) || left.id.localeCompare(right.id);
          });
          for (const relationship of connected) {
            if (stakes.length >= 3) break;
            const from = index.entitiesById.get(relationship.from);
            const to = index.entitiesById.get(relationship.to);
            stakes.push({
              stake_id: `cwk-${hexHash(`${briefId}|relationship|${relationship.id}`)}`,
              entity_id: from.id === primaryId ? to.id : from.id,
              urgency: "connected",
              text: `The ${humanize(relationship.relationship_type).toLowerCase()} connection between ${from.name} and ${to.name} lets the central pressure reach both.`,
              source_references: [
                sourceReference("entity", from.id),
                sourceReference("entity", to.id),
                sourceReference("relationship", relationship.id)
              ]
            });
          }
          return stakes;
        }
        function validateBrief(brief, input) {
          const snapshotValidation = validateSnapshot(input);
          const errors = [...snapshotValidation.errors];
          if (!isObject3(brief)) {
            errors.push("Session brief must be an object.");
            return { valid: false, errors, missing_references: [], source_reference_count: 0 };
          }
          const index = snapshotValidation.valid ? buildIndex(input) : null;
          const sceneIds = /* @__PURE__ */ new Set();
          if (!Array.isArray(brief.scenes) || brief.scenes.length < 3 || brief.scenes.length > 7) {
            errors.push("Session brief must contain three through seven scenes.");
          } else {
            brief.scenes.forEach((scene, position) => {
              if (scene.order !== position + 1) errors.push(`Scene ${position + 1} is out of order.`);
              if (sceneIds.has(scene.scene_id)) errors.push(`Duplicate scene ID: ${scene.scene_id}.`);
              sceneIds.add(scene.scene_id);
            });
          }
          if (!brief.objective?.text) errors.push("Session brief objective is required.");
          if (!Array.isArray(brief.stakes) || !brief.stakes.length) errors.push("Session brief stakes are required.");
          if (!Array.isArray(brief.involved_entities) || !brief.involved_entities.length) {
            errors.push("Session brief involved entities are required.");
          }
          if (!Array.isArray(brief.continuity_callbacks) || !brief.continuity_callbacks.length) {
            errors.push("Session brief continuity callbacks are required.");
          }
          const references = collectReferences(brief);
          const missingReferences = index ? references.filter((reference) => {
            return reference.kind === "entity" ? !index.entitiesById.has(reference.id) : reference.kind === "relationship" ? !index.relationshipsById.has(reference.id) : true;
          }) : [];
          if (missingReferences.length) {
            errors.push(`Session brief has ${missingReferences.length} missing source reference(s).`);
          }
          if (Array.isArray(brief.reference_ledger)) {
            const expected = unique(references.map((reference) => reference.id)).sort();
            if (stableStringify(brief.reference_ledger) !== stableStringify(expected)) {
              errors.push("Reference ledger does not match the brief source references.");
            }
          } else {
            errors.push("Session brief reference ledger is required.");
          }
          return {
            valid: errors.length === 0,
            errors,
            missing_references: missingReferences,
            source_reference_count: references.length
          };
        }
        function generate(input, rawOptions) {
          const options = normalizeOptions(rawOptions);
          const index = buildIndex(input);
          if (!index.entities.length) throw new Error("Campaign Workspace requires at least one active entity.");
          const signals = collectSignals(index, options);
          if (!signals.length) throw new Error("Campaign Workspace could not find an active continuity signal.");
          const primarySignal = signals[0];
          const primaryEntity = index.entitiesById.get(primarySignal.entity_id);
          const stateFingerprint = stableStringify({
            entities: index.entities.map((entity) => ({
              id: entity.id,
              status: entity.status ?? "active",
              facts: entity.attributes?.facts ?? {},
              clocks: entity.attributes?.clocks ?? {}
            })),
            relationships: index.relationships.map((relationship) => ({
              id: relationship.id,
              from: relationship.from,
              to: relationship.to,
              relationship_type: relationship.relationship_type
            }))
          });
          const briefId = `cw-${hexHash([
            index.campaignId,
            options.seed,
            options.tone,
            options.sessionNumber,
            options.sceneCount,
            options.entityLimit,
            options.callbackLimit,
            stateFingerprint
          ].join("|"))}`;
          const involved = collectInvolvedEntities(index, signals, options);
          const callbacks = signals.slice(0, options.callbackLimit).map((signal, position) => {
            const entity = index.entitiesById.get(signal.entity_id);
            return {
              callback_id: `cwc-${hexHash(`${briefId}|${signal.signal_id}`)}`,
              priority: position + 1,
              kind: signal.kind,
              entity_id: entity.id,
              text: `${entity.name}: ${signal.detail}`,
              urgency: signal.urgency,
              source_references: signal.source_references
            };
          });
          const stakes = buildStakes(index, signals, involved, briefId, options);
          const objective = {
            text: describeObjective(primarySignal, primaryEntity),
            primary_entity_id: primaryEntity.id,
            continuity_signal_id: primarySignal.signal_id,
            source_references: primarySignal.source_references
          };
          const scenes = buildScenes(index, signals, involved, options, briefId);
          const brief = {
            schema_version: VERSION,
            generator: "Loot Table Works Campaign Workspace",
            brief_id: briefId,
            campaign_id: index.campaignId,
            seed: options.seed,
            session_number: options.sessionNumber,
            tone: options.tone,
            tone_label: TONES[options.tone].label,
            gm_direction: TONES[options.tone].direction,
            title: `Session ${options.sessionNumber}: ${primaryEntity.name} under pressure`,
            objective,
            stakes,
            involved_entities: involved,
            continuity_callbacks: callbacks,
            scenes,
            source_references: [],
            reference_ledger: [],
            state_summary: {
              entities: index.entities.length,
              relationships: index.relationships.length,
              continuity_signals: signals.length,
              critical_signals: signals.filter((signal) => signal.urgency === "critical").length,
              fallback_used: signals.every((signal) => signal.kind === "connection")
            }
          };
          brief.source_references = collectReferences(brief);
          brief.reference_ledger = unique(brief.source_references.map((reference) => reference.id)).sort();
          const validation = validateBrief(brief, input);
          brief.validation = validation;
          if (!validation.valid) throw new Error(validation.errors.join("\n"));
          return deepFreeze(brief);
        }
        function toMarkdown(brief) {
          if (!brief?.validation?.valid) throw new Error("A valid Campaign Workspace brief is required.");
          const lines = [
            `# ${brief.title}`,
            "",
            `**Brief:** ${brief.brief_id}  `,
            `**Campaign:** ${brief.campaign_id}  `,
            `**Seed:** ${brief.seed}  `,
            `**Tone:** ${brief.tone_label}`,
            "",
            `## Objective`,
            "",
            brief.objective.text,
            "",
            "## Stakes",
            ""
          ];
          brief.stakes.forEach((stake) => lines.push(`- **${humanize(stake.urgency)}:** ${stake.text}`));
          lines.push("", "## Continuity Callbacks", "");
          brief.continuity_callbacks.forEach((callback) => lines.push(`${callback.priority}. ${callback.text}`));
          lines.push("", "## Session Beats", "");
          brief.scenes.forEach((scene) => {
            lines.push(
              `### ${scene.order}. ${scene.title}`,
              "",
              scene.beat,
              "",
              `- Purpose: ${scene.purpose}`,
              `- Choice: ${scene.choice}`,
              `- If ignored: ${scene.consequence_if_ignored}`,
              `- Sources: ${scene.source_references.map((reference) => reference.id).join(", ")}`,
              ""
            );
          });
          lines.push("## Reference Ledger", "", ...brief.reference_ledger.map((id) => `- ${id}`));
          return lines.join("\n");
        }
        return {
          VERSION,
          TONES,
          hash: hash2,
          normalizeOptions,
          validateSnapshot,
          validateBrief,
          generate,
          toMarkdown
        };
      });
    }
  });

  // machines/machine-005/campaign-workspace/gullwatch-campaign-seed.js
  var require_gullwatch_campaign_seed = __commonJS({
    "machines/machine-005/campaign-workspace/gullwatch-campaign-seed.js"(exports, module) {
      (function attachGullwatchCampaignSeed(root, factory) {
        const api2 = factory();
        if (typeof module !== "undefined" && module.exports) module.exports = api2;
        if (root) root.GullwatchCampaignSeed = api2;
      })(typeof globalThis !== "undefined" ? globalThis : exports, function createGullwatchCampaignSeed() {
        "use strict";
        const VERSION = "1.0.0";
        const SEED_ID = "gullwatch-beacon-campaign-seed-v1";
        const CAMPAIGN_ID = "wfc-gullwatch-beacon-v1";
        const CAMPAIGN_NAME = "Signal at Gullwatch";
        const SOURCE_PROVENANCE = [
          {
            source_id: "gullwatch-play-tonight-adventure-v1",
            source_type: "validated_play_tonight_content",
            path: "shared/world-foundry/play-tonight/gullwatch-beacon/content/adventure.json",
            schema_version: "1.0.0",
            sha256: "4ffc7d78a4d764e232547b4188fe5dfb7800ce1a3ecd03fcd27d7fc4a87cd20e"
          },
          {
            source_id: "gullwatch-play-tonight-manifest-v1",
            source_type: "validated_release_manifest",
            path: "shared/world-foundry/play-tonight/gullwatch-beacon/dist/MANIFEST.json",
            schema_version: "1.0.0",
            sha256: "0d2729390cee6fb389ef91c46efb8519aa2f1c854955b96197bd671ee11dd875"
          },
          {
            source_id: "world-foundry-coastal-starter-v1",
            source_type: "validated_world_foundry_assembly",
            path: "shared/world-foundry/github-sdk/examples/coastal-starter-world.json",
            schema_version: "1.0.0",
            assembly_id: "wfa-coastal-3b307ab7",
            world_seed: "gullwatch-starter",
            sha256: "4737f614d339b2e25de02854dfeb86c7797b705260692b5c4a7daf1d8ed46da1"
          }
        ];
        const CAMPAIGN_IDENTITY = {
          seed_id: SEED_ID,
          campaign_id: CAMPAIGN_ID,
          name: CAMPAIGN_NAME,
          setting: "Saltglass Coast",
          format: "system-neutral fantasy campaign seed",
          players: "3-6",
          starting_duration: "3-4 hours",
          content_boundary: "Original system-neutral fantasy content. No proprietary rules, characters, settings, or brands are required."
        };
        const PREMISE = {
          player_facing: "An abandoned sea beacon is broadcasting a false harbor code. Reach the tower before the flood tide, discover who changed the signal, and decide whether its drowned keeper deserves rescue or release.",
          gm_facing: "The beacon's Brineworn Orb stores the final memory of Keeper Orren Saye. Nera Voss changed the shutters to lure a guild ship toward the reef, while the false signal agitates the glassfin creatures. The beacon can be repaired, retuned, extinguished, or surrendered to Orren."
        };
        const ACTIVE_OBJECTIVES = [
          {
            objective_id: "gb-objective-true-signal",
            label: "Make the light tell the truth",
            player_facing: "Reach Gullwatch Beacon before the flood tide and stop the false harbor code from carrying the grain ship onto the reef.",
            gm_facing: "Keep the ship's fate, Orren's fate, Nera's cause, and the beacon's future visible as separate outcomes.",
            primary_entity_id: "gb-thread-true-signal",
            source_references: [
              "gullwatch-play-tonight-adventure-v1",
              "world-foundry-coastal-starter-v1",
              "loc-coastal-02"
            ]
          },
          {
            objective_id: "gb-objective-beacon-fate",
            label: "Choose what the coast remembers",
            player_facing: "Discover who changed the signal and decide whether Orren Saye and the beacon should be rescued, released, exposed, or destroyed.",
            gm_facing: "No single ending is mandatory; require the table to state the ship's fate, Orren's fate, Nera's cause, and the beacon's future.",
            primary_entity_id: "gb-thread-beacon-fate",
            source_references: [
              "gullwatch-play-tonight-adventure-v1",
              "pitm-0032",
              "loc-coastal-02"
            ]
          }
        ];
        const ACTIVE_PRESSURES = [
          {
            pressure_id: "gb-pressure-flood-tide",
            label: "Flood Tide",
            steps: 6,
            starting_value: 0,
            advance_when: "The party suffers a major setback, abandons a route, or spends extended time searching.",
            source_references: ["gullwatch-play-tonight-adventure-v1", "loc-coastal-02"]
          },
          {
            pressure_id: "gb-pressure-false-signal",
            label: "False Signal",
            steps: 4,
            starting_value: 1,
            advance_when: "Nera or Orren retains control after a scene changes.",
            source_references: ["gullwatch-play-tonight-adventure-v1", "loc-coastal-02"]
          }
        ];
        const KEY_REFERENCES = {
          cast: [
            {
              id: "gb-cast-mara-vale",
              name: "Mara Vale",
              role: "tidewarden and employer",
              wants: "The harbor protected without exposing the guild's neglected beacon records.",
              source_id: "gullwatch-play-tonight-adventure-v1"
            },
            {
              id: "gb-cast-nera-voss",
              name: "Nera Voss",
              role: "brine corsair scout",
              wants: "The guild ship wrecked so its stolen relief cargo can be recovered.",
              source_id: "gullwatch-play-tonight-adventure-v1"
            },
            {
              id: "gb-cast-orren-saye",
              name: "Orren Saye",
              role: "memory bound to the beacon",
              wants: "A final true signal sent in his name before the Orb is removed.",
              source_id: "gullwatch-play-tonight-adventure-v1"
            }
          ],
          coastal_canon: [
            { id: "loc-coastal-02", entity_type: "location", name: "Gullwatch Beacon" },
            { id: "pitm-0032", entity_type: "item", name: "Brineworn Orb" },
            {
              id: "enc-002",
              entity_type: "encounter",
              name: "Gullwatch Beacon: Constricted Crossing"
            },
            {
              id: "lpf-007",
              entity_type: "loot_profile",
              name: "Glassfin Stalkers Stalker"
            },
            {
              id: "qst-022",
              entity_type: "quest",
              name: "Commission Brineworn Pick at Gullwatch Beacon"
            }
          ]
        };
        const CANONICAL_RELATIONSHIPS = [
          {
            id: "wfe-000005",
            from: "enc-002",
            to: "qst-022",
            relationship_type: "advances",
            source_module: "encounters"
          },
          {
            id: "wfe-000006",
            from: "enc-002",
            to: "lpf-007",
            relationship_type: "contains_enemy",
            source_module: "encounters",
            metadata: { count: 1 }
          },
          {
            id: "wfe-004310",
            from: "qst-022",
            to: "loc-coastal-02",
            relationship_type: "takes_place_at",
            source_module: "quests"
          }
        ];
        function isObject3(value) {
          return value !== null && typeof value === "object" && !Array.isArray(value);
        }
        function cloneJson2(value) {
          return JSON.parse(JSON.stringify(value));
        }
        function deepFreeze(value) {
          if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
          Object.freeze(value);
          Object.values(value).forEach(deepFreeze);
          return value;
        }
        function stableStringify(value) {
          if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
          if (!isObject3(value)) return JSON.stringify(value);
          return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
        }
        function sourceAttributes(sourceId, recordId, extra = {}) {
          return {
            source_id: sourceId,
            source_record_id: recordId,
            ...extra
          };
        }
        function buildRegistry() {
          const entities = [
            {
              id: "loc-coastal-02",
              entity_type: "location",
              name: "Gullwatch Beacon",
              status: "active",
              attributes: sourceAttributes("world-foundry-coastal-starter-v1", "loc-coastal-02", {
                facts: {
                  location_type: "signal tower",
                  controlling_faction: "harbor guilds",
                  local_hazard: "signal shutters jam when salt builds in their tracks",
                  false_harbor_code_active: true,
                  grain_ship_safe: false
                },
                clocks: {
                  flood_tide: {
                    label: "Flood Tide",
                    value: 0,
                    minimum: 0,
                    maximum: 6
                  },
                  false_signal: {
                    label: "False Signal",
                    value: 1,
                    minimum: 0,
                    maximum: 4
                  }
                }
              })
            },
            {
              id: "pitm-0032",
              entity_type: "item",
              name: "Brineworn Orb",
              status: "active",
              attributes: sourceAttributes("world-foundry-coastal-starter-v1", "pitm-0032", {
                facts: {
                  stores_final_memory_of: "Orren Saye"
                }
              })
            },
            {
              id: "enc-002",
              entity_type: "encounter",
              name: "Gullwatch Beacon: Constricted Crossing",
              status: "active",
              attributes: sourceAttributes("world-foundry-coastal-starter-v1", "enc-002")
            },
            {
              id: "lpf-007",
              entity_type: "loot_profile",
              name: "Glassfin Stalkers Stalker",
              status: "active",
              attributes: sourceAttributes("world-foundry-coastal-starter-v1", "lpf-007")
            },
            {
              id: "qst-022",
              entity_type: "quest",
              name: "Commission Brineworn Pick at Gullwatch Beacon",
              status: "available",
              attributes: sourceAttributes("world-foundry-coastal-starter-v1", "qst-022")
            },
            ...KEY_REFERENCES.cast.map((member) => ({
              id: member.id,
              entity_type: "character",
              name: member.name,
              status: "active",
              attributes: sourceAttributes(member.source_id, member.name, {
                facts: {
                  role: member.role,
                  wants: member.wants
                }
              })
            })),
            {
              id: "gb-thread-true-signal",
              entity_type: "campaign_thread",
              name: "Make the Light Tell the Truth",
              status: "open",
              attributes: sourceAttributes(
                "gullwatch-play-tonight-adventure-v1",
                "pitch-and-strong-start",
                {
                  facts: {
                    resolved: false,
                    grain_ship_redirected: false
                  }
                }
              )
            },
            {
              id: "gb-thread-beacon-fate",
              entity_type: "campaign_thread",
              name: "Choose What the Coast Remembers",
              status: "open",
              attributes: sourceAttributes(
                "gullwatch-play-tonight-adventure-v1",
                "scene-4-a-light-that-remembers",
                {
                  facts: {
                    resolved: false,
                    orren_fate_stated: false,
                    nera_cause_stated: false,
                    beacon_future_stated: false
                  }
                }
              )
            }
          ];
          const relationships = [
            ...CANONICAL_RELATIONSHIPS,
            {
              id: "gb-rel-mara-commissions-signal",
              from: "gb-cast-mara-vale",
              to: "gb-thread-true-signal",
              relationship_type: "commissions"
            },
            {
              id: "gb-rel-signal-at-beacon",
              from: "gb-thread-true-signal",
              to: "loc-coastal-02",
              relationship_type: "takes_place_at"
            },
            {
              id: "gb-rel-nera-opposes-signal",
              from: "gb-cast-nera-voss",
              to: "gb-thread-true-signal",
              relationship_type: "opposes"
            },
            {
              id: "gb-rel-orren-in-orb",
              from: "gb-cast-orren-saye",
              to: "pitm-0032",
              relationship_type: "bound_to"
            },
            {
              id: "gb-rel-orb-at-beacon",
              from: "pitm-0032",
              to: "loc-coastal-02",
              relationship_type: "located_at"
            },
            {
              id: "gb-rel-orren-controls-beacon",
              from: "gb-cast-orren-saye",
              to: "loc-coastal-02",
              relationship_type: "controls"
            },
            {
              id: "gb-rel-fate-at-beacon",
              from: "gb-thread-beacon-fate",
              to: "loc-coastal-02",
              relationship_type: "takes_place_at"
            },
            {
              id: "gb-rel-orren-fate",
              from: "gb-cast-orren-saye",
              to: "gb-thread-beacon-fate",
              relationship_type: "involved_in"
            },
            {
              id: "gb-rel-nera-fate",
              from: "gb-cast-nera-voss",
              to: "gb-thread-beacon-fate",
              relationship_type: "involved_in"
            },
            {
              id: "gb-rel-glassfin-threatens-beacon",
              from: "lpf-007",
              to: "loc-coastal-02",
              relationship_type: "threatens"
            }
          ];
          return { entities, relationships };
        }
        function buildCampaignStart() {
          return {
            schema_version: VERSION,
            seed_id: SEED_ID,
            campaign_id: CAMPAIGN_ID,
            campaign_name: CAMPAIGN_NAME,
            campaign_identity: cloneJson2(CAMPAIGN_IDENTITY),
            premise: cloneJson2(PREMISE),
            active_objectives: cloneJson2(ACTIVE_OBJECTIVES),
            active_pressures: cloneJson2(ACTIVE_PRESSURES),
            key_references: cloneJson2(KEY_REFERENCES),
            source_provenance: cloneJson2(SOURCE_PROVENANCE),
            registry: buildRegistry()
          };
        }
        function validateCampaignStart(input) {
          const errors = [];
          if (!isObject3(input)) {
            return {
              valid: false,
              errors: ["Campaign start payload must be an object."],
              summary: { campaignId: null, entities: 0, relationships: 0 }
            };
          }
          if (input.schema_version !== VERSION) errors.push(`Schema version must be ${VERSION}.`);
          if (input.seed_id !== SEED_ID) errors.push(`Seed ID must be ${SEED_ID}.`);
          if (input.campaign_id !== CAMPAIGN_ID) errors.push(`Campaign ID must be ${CAMPAIGN_ID}.`);
          if (input.campaign_name !== CAMPAIGN_NAME) errors.push(`Campaign name must be ${CAMPAIGN_NAME}.`);
          if (stableStringify(input.campaign_identity) !== stableStringify(CAMPAIGN_IDENTITY)) {
            errors.push("Campaign identity does not match the Gullwatch seed.");
          }
          if (stableStringify(input.premise) !== stableStringify(PREMISE)) {
            errors.push("Campaign premise does not match the Gullwatch source.");
          }
          if (stableStringify(input.active_objectives) !== stableStringify(ACTIVE_OBJECTIVES)) {
            errors.push("Active objectives do not match the Gullwatch source.");
          }
          if (stableStringify(input.active_pressures) !== stableStringify(ACTIVE_PRESSURES)) {
            errors.push("Active pressures do not match the Gullwatch source.");
          }
          if (stableStringify(input.key_references) !== stableStringify(KEY_REFERENCES)) {
            errors.push("Key references do not match the validated source catalog.");
          }
          if (stableStringify(input.source_provenance) !== stableStringify(SOURCE_PROVENANCE)) {
            errors.push("Source provenance does not match the validated Gullwatch inputs.");
          }
          const entities = input.registry?.entities;
          const relationships = input.registry?.relationships;
          if (!Array.isArray(entities)) errors.push("Registry entities must be an array.");
          if (!Array.isArray(relationships)) errors.push("Registry relationships must be an array.");
          const entityIds = /* @__PURE__ */ new Set();
          if (Array.isArray(entities)) {
            entities.forEach((entity, index) => {
              if (!isObject3(entity)) {
                errors.push(`Entity ${index + 1} must be an object.`);
                return;
              }
              if (typeof entity.id !== "string" || !entity.id) errors.push(`Entity ${index + 1} is missing an ID.`);
              else if (entityIds.has(entity.id)) errors.push(`Duplicate entity ID: ${entity.id}.`);
              else entityIds.add(entity.id);
              if (typeof entity.entity_type !== "string" || !entity.entity_type) {
                errors.push(`Entity ${index + 1} is missing entity_type.`);
              }
              if (typeof entity.name !== "string" || !entity.name) {
                errors.push(`Entity ${index + 1} is missing a name.`);
              }
              const clocks = entity.attributes?.clocks;
              if (isObject3(clocks)) {
                Object.entries(clocks).forEach(([clockId, clock]) => {
                  if (!isObject3(clock) || !Number.isInteger(clock.value) || !Number.isInteger(clock.minimum) || !Number.isInteger(clock.maximum) || clock.minimum >= clock.maximum || clock.value < clock.minimum || clock.value > clock.maximum) {
                    errors.push(`Clock ${entity.id}.${clockId} is invalid.`);
                  }
                });
              }
            });
          }
          const relationshipIds = /* @__PURE__ */ new Set();
          if (Array.isArray(relationships)) {
            relationships.forEach((relationship, index) => {
              if (!isObject3(relationship)) {
                errors.push(`Relationship ${index + 1} must be an object.`);
                return;
              }
              if (typeof relationship.id !== "string" || !relationship.id) {
                errors.push(`Relationship ${index + 1} is missing an ID.`);
              } else if (relationshipIds.has(relationship.id)) {
                errors.push(`Duplicate relationship ID: ${relationship.id}.`);
              } else relationshipIds.add(relationship.id);
              if (!entityIds.has(relationship.from)) {
                errors.push(`Relationship ${relationship.id ?? index + 1} has a missing from endpoint.`);
              }
              if (!entityIds.has(relationship.to)) {
                errors.push(`Relationship ${relationship.id ?? index + 1} has a missing to endpoint.`);
              }
              if (typeof relationship.relationship_type !== "string" || !relationship.relationship_type) {
                errors.push(`Relationship ${relationship.id ?? index + 1} is missing relationship_type.`);
              }
            });
          }
          const expected = buildCampaignStart();
          if (Array.isArray(entities) && stableStringify(entities) !== stableStringify(expected.registry.entities)) {
            errors.push("Registry entities do not match the deterministic Gullwatch campaign start.");
          }
          if (Array.isArray(relationships) && stableStringify(relationships) !== stableStringify(expected.registry.relationships)) {
            errors.push("Registry relationships do not match the deterministic Gullwatch campaign start.");
          }
          return {
            valid: errors.length === 0,
            errors,
            summary: {
              campaignId: input.campaign_id ?? null,
              entities: Array.isArray(entities) ? entities.length : 0,
              relationships: Array.isArray(relationships) ? relationships.length : 0,
              objectives: Array.isArray(input.active_objectives) ? input.active_objectives.length : 0,
              pressures: Array.isArray(input.active_pressures) ? input.active_pressures.length : 0
            }
          };
        }
        function createCampaignStart() {
          const payload = buildCampaignStart();
          const validation = validateCampaignStart(payload);
          if (!validation.valid) throw new Error(validation.errors.join("\n"));
          payload.validation = validation;
          return deepFreeze(payload);
        }
        function getCampaignSeed() {
          return deepFreeze({
            schema_version: VERSION,
            campaign_identity: cloneJson2(CAMPAIGN_IDENTITY),
            premise: cloneJson2(PREMISE),
            active_objectives: cloneJson2(ACTIVE_OBJECTIVES),
            active_pressures: cloneJson2(ACTIVE_PRESSURES),
            key_references: cloneJson2(KEY_REFERENCES),
            source_provenance: cloneJson2(SOURCE_PROVENANCE)
          });
        }
        return Object.freeze({
          VERSION,
          SEED_ID,
          CAMPAIGN_ID,
          CAMPAIGN_NAME,
          createCampaignStart,
          getCampaignSeed,
          validateCampaignStart
        });
      });
    }
  });

  // machines/machine-005/campaign-workspace/integrations/campaign-start-contract.js
  var require_campaign_start_contract = __commonJS({
    "machines/machine-005/campaign-workspace/integrations/campaign-start-contract.js"(exports, module) {
      (function attachCampaignStartContract(root, factory) {
        const api2 = factory();
        if (typeof module !== "undefined" && module.exports) module.exports = api2;
        if (root) root.CampaignStartContract = api2;
      })(typeof globalThis !== "undefined" ? globalThis : exports, function createCampaignStartContract() {
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
        function isObject3(value) {
          return value !== null && typeof value === "object" && !Array.isArray(value);
        }
        function isNonEmptyString(value) {
          return typeof value === "string" && value.trim().length > 0;
        }
        function hash2(text) {
          let value = 2166136261;
          for (const character of String(text)) {
            value ^= character.charCodeAt(0);
            value = Math.imul(value, 16777619);
          }
          return value >>> 0;
        }
        function hexHash(text) {
          return hash2(text).toString(16).padStart(8, "0");
        }
        function stableStringify(value) {
          if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
          if (isObject3(value)) {
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
          return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => value === right[index]);
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
          if (!isObject3(plan)) {
            return { valid: false, errors: ["launchpad: must be an object."] };
          }
          if (plan.generator !== LAUNCHPAD_GENERATOR) addError(errors, "launchpad.generator", `must equal "${LAUNCHPAD_GENERATOR}".`);
          if (plan.version !== "1.0.0") addError(errors, "launchpad.version", "must equal 1.0.0.");
          requireString(plan.title, "launchpad.title", errors);
          requireString(plan.promise, "launchpad.promise", errors);
          requireString(plan.scope_summary, "launchpad.scope_summary", errors);
          const options = plan.options;
          if (!isObject3(options)) {
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
            if (isNonEmptyString(options.seed) && SCOPE_PRESETS[options.scope] && SPOTLIGHT_PRESETS[options.spotlight] && Number.isInteger(options.party) && Number.isInteger(options.tier)) {
              const expectedId = expectedLaunchpadId(options);
              if (plan.plan_id !== expectedId) addError(errors, "launchpad.plan_id", `must equal deterministic ID ${expectedId}.`);
            }
          }
          if (!Array.isArray(plan.tools) || plan.tools.length !== TOOL_IDS.length) {
            addError(errors, "launchpad.tools", `must contain exactly ${TOOL_IDS.length} routes.`);
          } else {
            const seenIds = /* @__PURE__ */ new Set();
            plan.tools.forEach((tool, index) => {
              const path = `launchpad.tools[${index}]`;
              if (!isObject3(tool)) {
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
              if (query.utm_source !== "campaign_launchpad" || query.utm_medium !== "guided_workflow" || query.utm_campaign !== "campaign_launchpad_v1") {
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
              if (!isObject3(product)) {
                addError(errors, path, "must be an object.");
                return;
              }
              requireString(product.code, `${path}.code`, errors);
              requireString(product.title, `${path}.title`, errors);
              const query = parseQuery(product.tracked_url, `${path}.tracked_url`, errors);
              if (query.utm_source !== "campaign_launchpad" || query.utm_medium !== "guided_recommendation" || query.utm_campaign !== "campaign_launchpad_v1") {
                addError(errors, `${path}.tracked_url`, "recommendation attribution query is incomplete or malformed.");
              }
            });
          }
          if (plan.paid_total_usd !== 9) addError(errors, "launchpad.paid_total_usd", "must equal 9.");
          if (!isObject3(plan.validation) || plan.validation.valid !== true) {
            addError(errors, "launchpad.validation.valid", "must be true.");
          } else {
            if (plan.validation.free_tool_routes !== TOOL_IDS.length) addError(errors, "launchpad.validation.free_tool_routes", `must equal ${TOOL_IDS.length}.`);
            if (plan.validation.paid_destinations !== 3) addError(errors, "launchpad.validation.paid_destinations", "must equal 3.");
            if (plan.validation.gated_destinations !== 0) addError(errors, "launchpad.validation.gated_destinations", "must equal 0.");
          }
          return { valid: errors.length === 0, errors };
        }
        function collectExpectedOneShotReferences(oneShot, errors) {
          const ids = /* @__PURE__ */ new Set();
          const add = (value, path, required = false) => {
            if (isNonEmptyString(value)) ids.add(value);
            else if (required) addError(errors, path, "must be a non-empty source ID.");
          };
          const records = oneShot.source_records;
          if (!isObject3(records)) {
            addError(errors, "oneShot.source_records", "must be an object.");
            return [];
          }
          const quest = records.quest;
          const encounter = records.encounter;
          const location = records.location;
          const merchant = records.merchant;
          const lootProfile = records.loot_profile;
          if (!isObject3(quest)) addError(errors, "oneShot.source_records.quest", "must be an object.");
          if (!isObject3(encounter)) addError(errors, "oneShot.source_records.encounter", "must be an object.");
          if (!isObject3(location)) addError(errors, "oneShot.source_records.location", "must be an object.");
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
            if (!isObject3(lootProfile)) {
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
          if (!isObject3(oneShot)) {
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
          if (isNonEmptyString(oneShot.seed) && ["heroic", "mystery", "peril"].includes(oneShot.tone) && Object.hasOwn(THREAT_SEGMENTS, oneShot.threat) && [120, 180, 240].includes(oneShot.duration_minutes) && Number.isInteger(oneShot.party_size) && Number.isInteger(oneShot.maximum_tier)) {
            const expectedId = expectedAdventureId(oneShot);
            if (oneShot.adventure_id !== expectedId) addError(errors, "oneShot.adventure_id", `must equal deterministic ID ${expectedId}.`);
          }
          let scheduledMinutes = 0;
          if (!Array.isArray(oneShot.scenes) || oneShot.scenes.length !== 5) {
            addError(errors, "oneShot.scenes", "must contain exactly five scenes.");
          } else {
            const sceneIds = /* @__PURE__ */ new Set();
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
            const characterIds = /* @__PURE__ */ new Set();
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
          if (!isObject3(oneShot.countdown) || oneShot.countdown.segments !== THREAT_SEGMENTS[oneShot.threat]) {
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
          if (!isObject3(oneShot.validation) || oneShot.validation.valid !== true) {
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
          if (!isObject3(start)) return { valid: false, errors: ["campaignStart: must be an object."] };
          if (start.schema_version !== VERSION) addError(errors, "campaignStart.schema_version", `must equal ${VERSION}.`);
          if (start.document_type !== DOCUMENT_TYPE) addError(errors, "campaignStart.document_type", `must equal "${DOCUMENT_TYPE}".`);
          if (!isObject3(start.campaign)) addError(errors, "campaignStart.campaign", "must be an object.");
          if (!isObject3(start.workflow)) addError(errors, "campaignStart.workflow", "must be a Campaign Launchpad document.");
          if (!isObject3(start.opening_session)) addError(errors, "campaignStart.opening_session", "must be a One-Shot Forge document.");
          if (isObject3(start.workflow) && isObject3(start.opening_session)) {
            const pairValidation = validateSourcePair(start.workflow, start.opening_session);
            errors.push(...pairValidation.errors);
            if (pairValidation.valid && isObject3(start.campaign)) {
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
          if (!isObject3(start.source_ledger)) {
            addError(errors, "campaignStart.source_ledger", "must be an object.");
          } else if (isObject3(start.workflow) && isObject3(start.opening_session)) {
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
          if (!isObject3(start.validation) || start.validation.valid !== true) {
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
          if (!isObject3(input)) throw new Error("Campaign Start input must be an object.");
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
          hash: hash2,
          stableStringify,
          validateLaunchpad,
          validateOneShot,
          validateSourcePair,
          validateCampaignStart,
          createCampaignStart
        };
      });
    }
  });

  // machines/machine-005/campaign-workspace/campaign-workspace-runtime-entry.js
  var campaign_workspace_runtime_entry_exports = {};
  __export(campaign_workspace_runtime_entry_exports, {
    default: () => campaign_workspace_runtime_entry_default
  });

  // machines/machine-005/campaign-workspace/campaign-workspace-state.mjs
  var import_campaign_workspace_core = __toESM(require_campaign_workspace_core(), 1);
  var import_gullwatch_campaign_seed = __toESM(require_gullwatch_campaign_seed(), 1);
  var import_campaign_start_contract = __toESM(require_campaign_start_contract(), 1);

  // machines/machine-005/campaign-workspace/faction-fronts-workspace-data.js
  globalThis.FactionFrontsWorkspaceSource = { "schema_version": "1.0.0", "product_id": "world-foundry-faction-fronts-sample-v1-rc1", "title": "World Foundry Faction Fronts Sample", "region": { "id": "reference-saltglass-coast", "key": "coast", "name": "Saltglass Coast", "faction_ids": ["fac-old-harbor-compact", "fac-tidebreak-freebooters", "fac-drowned-fleet", "fac-archive-crews", "fac-shoal-of-knives", "fac-deep-nest"], "front_ids": ["front-coast-01", "front-coast-02", "front-coast-03", "front-coast-04", "front-coast-05", "front-coast-06", "front-coast-07", "front-coast-08", "front-coast-09", "front-coast-10", "front-coast-11", "front-coast-12", "front-coast-13", "front-coast-14", "front-coast-15"], "power_map_id": "pmap-coast" }, "factions": [{ "faction_id": "fac-old-harbor-compact", "name": "Old Harbor Compact", "archetype": "stewardship", "active_project": { "project_id": "project-old-harbor-compact", "title": "Old Harbor Compact: Proof Initiative", "clock_max": 6 } }, { "faction_id": "fac-tidebreak-freebooters", "name": "Tidebreak Freebooters", "archetype": "covert-network", "active_project": { "project_id": "project-tidebreak-freebooters", "title": "Tidebreak Freebooters: Passage Initiative", "clock_max": 6 } }, { "faction_id": "fac-drowned-fleet", "name": "Drowned Fleet", "archetype": "claimant", "active_project": { "project_id": "project-drowned-fleet", "title": "Drowned Fleet: Mandate Initiative", "clock_max": 6 } }, { "faction_id": "fac-archive-crews", "name": "Archive Recovery Crews", "archetype": "institution", "active_project": { "project_id": "project-archive-crews", "title": "Archive Recovery Crews: Mandate Initiative", "clock_max": 6 } }, { "faction_id": "fac-shoal-of-knives", "name": "Shoal of Knives", "archetype": "covert-network", "active_project": { "project_id": "project-shoal-of-knives", "title": "Shoal of Knives: Mandate Initiative", "clock_max": 6 } }, { "faction_id": "fac-deep-nest", "name": "Deep Nest", "archetype": "coalition", "active_project": { "project_id": "project-deep-nest", "title": "Deep Nest: Proof Initiative", "clock_max": 6 } }], "fronts": [{ "front_id": "front-coast-01", "title": "The Necessary Share: Old Harbor Compact / Tidebreak Freebooters", "front_type": "resource", "status": "cold", "pressure_max": 6, "faction_a": { "id": "fac-old-harbor-compact", "name": "Old Harbor Compact" }, "faction_b": { "id": "fac-tidebreak-freebooters", "name": "Tidebreak Freebooters" } }, { "front_id": "front-coast-02", "title": "The Boundary of Duty: Old Harbor Compact / Drowned Fleet", "front_type": "jurisdiction", "status": "contested", "pressure_max": 6, "faction_a": { "id": "fac-old-harbor-compact", "name": "Old Harbor Compact" }, "faction_b": { "id": "fac-drowned-fleet", "name": "Drowned Fleet" } }, { "front_id": "front-coast-03", "title": "The Necessary Share: Old Harbor Compact / Archive Recovery Crews", "front_type": "resource", "status": "brittle-truce", "pressure_max": 6, "faction_a": { "id": "fac-old-harbor-compact", "name": "Old Harbor Compact" }, "faction_b": { "id": "fac-archive-crews", "name": "Archive Recovery Crews" } }, { "front_id": "front-coast-04", "title": "The Necessary Share: Old Harbor Compact / Shoal of Knives", "front_type": "resource", "status": "hidden-war", "pressure_max": 6, "faction_a": { "id": "fac-old-harbor-compact", "name": "Old Harbor Compact" }, "faction_b": { "id": "fac-shoal-of-knives", "name": "Shoal of Knives" } }, { "front_id": "front-coast-05", "title": "The Necessary Share: Old Harbor Compact / Deep Nest", "front_type": "resource", "status": "open-pressure", "pressure_max": 6, "faction_a": { "id": "fac-old-harbor-compact", "name": "Old Harbor Compact" }, "faction_b": { "id": "fac-deep-nest", "name": "Deep Nest" } }, { "front_id": "front-coast-06", "title": "The Claim Behind the Claim: Tidebreak Freebooters / Drowned Fleet", "front_type": "proxy", "status": "brittle-truce", "pressure_max": 6, "faction_a": { "id": "fac-tidebreak-freebooters", "name": "Tidebreak Freebooters" }, "faction_b": { "id": "fac-drowned-fleet", "name": "Drowned Fleet" } }, { "front_id": "front-coast-07", "title": "The Unrecorded Chain: Tidebreak Freebooters / Archive Recovery Crews", "front_type": "exposure", "status": "brittle-truce", "pressure_max": 6, "faction_a": { "id": "fac-tidebreak-freebooters", "name": "Tidebreak Freebooters" }, "faction_b": { "id": "fac-archive-crews", "name": "Archive Recovery Crews" } }, { "front_id": "front-coast-08", "title": "The Necessary Share: Tidebreak Freebooters / Shoal of Knives", "front_type": "resource", "status": "contested", "pressure_max": 6, "faction_a": { "id": "fac-tidebreak-freebooters", "name": "Tidebreak Freebooters" }, "faction_b": { "id": "fac-shoal-of-knives", "name": "Shoal of Knives" } }, { "front_id": "front-coast-09", "title": "The Necessary Share: Tidebreak Freebooters / Deep Nest", "front_type": "resource", "status": "open-pressure", "pressure_max": 6, "faction_a": { "id": "fac-tidebreak-freebooters", "name": "Tidebreak Freebooters" }, "faction_b": { "id": "fac-deep-nest", "name": "Deep Nest" } }, { "front_id": "front-coast-10", "title": "The Disputed Record: Drowned Fleet / Archive Recovery Crews", "front_type": "custody", "status": "open-pressure", "pressure_max": 6, "faction_a": { "id": "fac-drowned-fleet", "name": "Drowned Fleet" }, "faction_b": { "id": "fac-archive-crews", "name": "Archive Recovery Crews" } }, { "front_id": "front-coast-11", "title": "The Claim Behind the Claim: Drowned Fleet / Shoal of Knives", "front_type": "proxy", "status": "brittle-truce", "pressure_max": 6, "faction_a": { "id": "fac-drowned-fleet", "name": "Drowned Fleet" }, "faction_b": { "id": "fac-shoal-of-knives", "name": "Shoal of Knives" } }, { "front_id": "front-coast-12", "title": "The Necessary Share: Drowned Fleet / Deep Nest", "front_type": "resource", "status": "cold", "pressure_max": 6, "faction_a": { "id": "fac-drowned-fleet", "name": "Drowned Fleet" }, "faction_b": { "id": "fac-deep-nest", "name": "Deep Nest" } }, { "front_id": "front-coast-13", "title": "The Unrecorded Chain: Archive Recovery Crews / Shoal of Knives", "front_type": "exposure", "status": "cold", "pressure_max": 6, "faction_a": { "id": "fac-archive-crews", "name": "Archive Recovery Crews" }, "faction_b": { "id": "fac-shoal-of-knives", "name": "Shoal of Knives" } }, { "front_id": "front-coast-14", "title": "The Necessary Share: Archive Recovery Crews / Deep Nest", "front_type": "resource", "status": "contested", "pressure_max": 6, "faction_a": { "id": "fac-archive-crews", "name": "Archive Recovery Crews" }, "faction_b": { "id": "fac-deep-nest", "name": "Deep Nest" } }, { "front_id": "front-coast-15", "title": "The Necessary Share: Shoal of Knives / Deep Nest", "front_type": "resource", "status": "cold", "pressure_max": 6, "faction_a": { "id": "fac-shoal-of-knives", "name": "Shoal of Knives" }, "faction_b": { "id": "fac-deep-nest", "name": "Deep Nest" } }], "campaign_state_template": { "state_version": "1.0.0", "front_pressure": { "front-coast-01": 4, "front-coast-02": 2, "front-coast-03": 1, "front-coast-04": 2, "front-coast-05": 3, "front-coast-06": 2, "front-coast-07": 1, "front-coast-08": 2, "front-coast-09": 3, "front-coast-10": 3, "front-coast-11": 4, "front-coast-12": 1, "front-coast-13": 3, "front-coast-14": 2, "front-coast-15": 1 }, "faction_posture": { "fac-old-harbor-compact": "watchful", "fac-tidebreak-freebooters": "watchful", "fac-drowned-fleet": "watchful", "fac-archive-crews": "watchful", "fac-shoal-of-knives": "watchful", "fac-deep-nest": "watchful" }, "faction_project_segments": { "fac-old-harbor-compact": 1, "fac-tidebreak-freebooters": 3, "fac-drowned-fleet": 3, "fac-archive-crews": 2, "fac-shoal-of-knives": 2, "fac-deep-nest": 3 } } };

  // shared/world-foundry/canon-engine/src/index.js
  var CANON_SCHEMA_VERSION = "1.0.0";
  var CANON_EVENT_TYPES = Object.freeze([
    "entity.created",
    "entity.updated",
    "entity.archived",
    "relationship.added",
    "relationship.removed",
    "fact.set",
    "clock.adjusted"
  ]);
  var EVENT_TYPE_SET = new Set(CANON_EVENT_TYPES);
  var BLOCKED_KEYS = /* @__PURE__ */ new Set(["__proto__", "prototype", "constructor"]);
  var MUTABLE_ENTITY_FIELDS = /* @__PURE__ */ new Set(["name", "status", "tags", "attributes"]);
  function cloneJson(value) {
    return value === void 0 ? void 0 : JSON.parse(JSON.stringify(value));
  }
  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function isSafeKey(value) {
    return typeof value === "string" && value.length > 0 && !BLOCKED_KEYS.has(value);
  }
  function compareIds(left, right) {
    return left.id.localeCompare(right.id);
  }
  function findSourceRecords(world) {
    const records = /* @__PURE__ */ new Map();
    for (const [moduleName, rows] of Object.entries(world?.data ?? {})) {
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        if (!isObject(row)) continue;
        const candidateKeys = Object.keys(row).filter((key) => key === "id" || key.endsWith("_id"));
        const idKey = candidateKeys.find((key) => typeof row[key] === "string" && row[key].length > 0);
        if (idKey) records.set(row[idKey], { moduleName, record: row });
      }
    }
    return records;
  }
  function normalizeEntity(node, source, world) {
    const record = source?.record ?? {};
    const tags = [node.biome ?? record.biome ?? world.biome, node.source_module ?? source?.moduleName].filter((value) => typeof value === "string" && value.length > 0);
    return {
      id: node.id,
      entity_type: node.entity_type ?? source?.moduleName?.replace(/s$/, "") ?? "entity",
      name: node.name ?? record.name ?? node.id,
      status: "active",
      tags: [...new Set(tags)].sort(),
      attributes: {
        source_module: node.source_module ?? source?.moduleName ?? null,
        biome: node.biome ?? record.biome ?? world.biome ?? null,
        tier: node.tier ?? record.tier ?? null,
        graph_metadata: cloneJson(node.metadata ?? {}),
        source_record: cloneJson(record)
      }
    };
  }
  function normalizeRelationship(edge) {
    return {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      relationship_type: edge.edge_type ?? edge.type ?? "related_to",
      attributes: {
        source_module: edge.source_module ?? null,
        graph_metadata: cloneJson(edge.metadata ?? {})
      }
    };
  }
  function assertAssembly(world) {
    if (!isObject(world)) throw new Error("World assembly must be an object.");
    if (world.schema_version !== "1.0.0") throw new Error("Unsupported assembly schema version.");
    if (typeof world.assembly_id !== "string" || !world.assembly_id) throw new Error("Assembly ID is required.");
    if (!Array.isArray(world?.relationships?.nodes)) throw new Error("Assembly graph nodes are required.");
    if (!Array.isArray(world?.relationships?.edges)) throw new Error("Assembly graph edges are required.");
    const nodeIds = /* @__PURE__ */ new Set();
    for (const node of world.relationships.nodes) {
      if (typeof node?.id !== "string" || !node.id) throw new Error("Every assembly node needs an ID.");
      if (nodeIds.has(node.id)) throw new Error(`Duplicate assembly node ID: ${node.id}.`);
      nodeIds.add(node.id);
    }
    const edgeIds = /* @__PURE__ */ new Set();
    for (const edge of world.relationships.edges) {
      if (typeof edge?.id !== "string" || !edge.id) throw new Error("Every assembly relationship needs an ID.");
      if (edgeIds.has(edge.id)) throw new Error(`Duplicate assembly relationship ID: ${edge.id}.`);
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        throw new Error(`Assembly relationship endpoint missing: ${edge.id}.`);
      }
      edgeIds.add(edge.id);
    }
  }
  function createCanonDocumentFromAssembly(world, options = {}) {
    assertAssembly(world);
    const createdAt = options.createdAt ?? (/* @__PURE__ */ new Date()).toISOString();
    const sourceRecords = findSourceRecords(world);
    const entities = world.relationships.nodes.map((node) => normalizeEntity(node, sourceRecords.get(node.id), world)).sort(compareIds);
    const relationships = world.relationships.edges.map(normalizeRelationship).sort(compareIds);
    const document = {
      schema_version: CANON_SCHEMA_VERSION,
      campaign_id: options.campaignId ?? `wfc-${world.assembly_id}`,
      name: options.campaignName ?? `${world.world_seed ?? world.assembly_id} campaign`,
      created_at: createdAt,
      updated_at: createdAt,
      source: {
        assembly_id: world.assembly_id,
        world_seed: world.world_seed ?? null,
        biome: world.biome ?? null,
        maximum_tier: world.maximum_tier ?? null,
        scale: world.scale ?? null
      },
      baseline: {
        entities,
        relationships
      },
      ledger: {
        version: 1,
        events: []
      }
    };
    const validation = validateCanonDocument(document);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return document;
  }
  function validateEntity(entity, label, errors) {
    if (!isObject(entity)) {
      errors.push(`${label} must be an object.`);
      return;
    }
    if (typeof entity.id !== "string" || !entity.id) errors.push(`${label} is missing an ID.`);
    if (typeof entity.entity_type !== "string" || !entity.entity_type) {
      errors.push(`${label} is missing an entity type.`);
    }
    if (typeof entity.name !== "string" || !entity.name) errors.push(`${label} is missing a name.`);
    if (entity.status !== void 0 && (typeof entity.status !== "string" || !entity.status)) {
      errors.push(`${label} has an invalid status.`);
    }
    if (entity.tags !== void 0 && !Array.isArray(entity.tags)) errors.push(`${label} tags must be an array.`);
    if (entity.attributes !== void 0 && !isObject(entity.attributes)) {
      errors.push(`${label} attributes must be an object.`);
    }
  }
  function validateRelationship(relationship, label, errors) {
    if (!isObject(relationship)) {
      errors.push(`${label} must be an object.`);
      return;
    }
    for (const field of ["id", "from", "to", "relationship_type"]) {
      if (typeof relationship[field] !== "string" || !relationship[field]) {
        errors.push(`${label} is missing ${field}.`);
      }
    }
    if (relationship.attributes !== void 0 && !isObject(relationship.attributes)) {
      errors.push(`${label} attributes must be an object.`);
    }
  }
  function validateEventShape(event, index, errors) {
    const label = `Event ${index + 1}`;
    if (!isObject(event)) {
      errors.push(`${label} must be an object.`);
      return;
    }
    if (typeof event.event_id !== "string" || !event.event_id) errors.push(`${label} is missing an event ID.`);
    if (event.sequence !== index + 1) errors.push(`${label} has a non-contiguous sequence.`);
    if (!EVENT_TYPE_SET.has(event.event_type)) errors.push(`${label} has an unsupported event type.`);
    if (typeof event.occurred_at !== "string" || Number.isNaN(Date.parse(event.occurred_at))) {
      errors.push(`${label} has an invalid occurred_at timestamp.`);
    }
    if (typeof event.actor_id !== "string" || !event.actor_id) errors.push(`${label} is missing actor_id.`);
    if (typeof event.source !== "string" || !event.source) errors.push(`${label} is missing source.`);
    if (typeof event.target_id !== "string" || !event.target_id) errors.push(`${label} is missing target_id.`);
    if (!isObject(event.payload)) errors.push(`${label} payload must be an object.`);
    if (event.transaction_id !== void 0 && (typeof event.transaction_id !== "string" || !event.transaction_id)) {
      errors.push(`${label} has an invalid transaction_id.`);
    }
  }
  function applyEventToMaps(entities, relationships, event) {
    const payload = event.payload;
    if (event.event_type === "entity.created") {
      if (!isObject(payload.entity) || payload.entity.id !== event.target_id) {
        throw new Error("Created entity must match the event target.");
      }
      if (entities.has(event.target_id)) throw new Error(`Entity already exists: ${event.target_id}.`);
      const errors = [];
      validateEntity(payload.entity, "Created entity", errors);
      if (errors.length) throw new Error(errors.join("\n"));
      entities.set(event.target_id, cloneJson(payload.entity));
      return;
    }
    if (event.event_type === "entity.updated") {
      const entity = entities.get(event.target_id);
      if (!entity) throw new Error(`Entity not found: ${event.target_id}.`);
      if (!isObject(payload.patch)) throw new Error("Entity update requires a patch object.");
      for (const key of Object.keys(payload.patch)) {
        if (!isSafeKey(key) || !MUTABLE_ENTITY_FIELDS.has(key)) {
          throw new Error(`Entity field cannot be changed: ${key}.`);
        }
      }
      const next = cloneJson(entity);
      if (payload.patch.name !== void 0) {
        if (typeof payload.patch.name !== "string" || !payload.patch.name) throw new Error("Entity name is invalid.");
        next.name = payload.patch.name;
      }
      if (payload.patch.status !== void 0) {
        if (typeof payload.patch.status !== "string" || !payload.patch.status) {
          throw new Error("Entity status is invalid.");
        }
        next.status = payload.patch.status;
      }
      if (payload.patch.tags !== void 0) {
        if (!Array.isArray(payload.patch.tags) || payload.patch.tags.some((tag) => typeof tag !== "string")) {
          throw new Error("Entity tags must be strings.");
        }
        next.tags = [...new Set(payload.patch.tags)].sort();
      }
      if (payload.patch.attributes !== void 0) {
        if (!isObject(payload.patch.attributes)) throw new Error("Entity attributes must be an object.");
        for (const key of Object.keys(payload.patch.attributes)) {
          if (!isSafeKey(key)) throw new Error(`Unsafe entity attribute key: ${key}.`);
        }
        next.attributes = { ...next.attributes ?? {}, ...cloneJson(payload.patch.attributes) };
      }
      entities.set(event.target_id, next);
      return;
    }
    if (event.event_type === "entity.archived") {
      const entity = entities.get(event.target_id);
      if (!entity) throw new Error(`Entity not found: ${event.target_id}.`);
      entities.set(event.target_id, { ...entity, status: "archived" });
      return;
    }
    if (event.event_type === "relationship.added") {
      const relationship = payload.relationship;
      const errors = [];
      validateRelationship(relationship, "Added relationship", errors);
      if (errors.length) throw new Error(errors.join("\n"));
      if (relationship.id !== event.target_id) {
        throw new Error("Added relationship must match the event target.");
      }
      if (relationships.has(event.target_id)) {
        throw new Error(`Relationship already exists: ${event.target_id}.`);
      }
      if (!entities.has(relationship.from) || !entities.has(relationship.to)) {
        throw new Error(`Relationship endpoint missing: ${relationship.id}.`);
      }
      relationships.set(event.target_id, cloneJson(relationship));
      return;
    }
    if (event.event_type === "relationship.removed") {
      if (!relationships.has(event.target_id)) {
        throw new Error(`Relationship not found: ${event.target_id}.`);
      }
      relationships.delete(event.target_id);
      return;
    }
    if (event.event_type === "fact.set") {
      const entity = entities.get(event.target_id);
      if (!entity) throw new Error(`Entity not found: ${event.target_id}.`);
      if (!isSafeKey(payload.key)) throw new Error("Fact key is invalid.");
      const next = cloneJson(entity);
      next.attributes = next.attributes ?? {};
      next.attributes.facts = next.attributes.facts ?? {};
      next.attributes.facts[payload.key] = cloneJson(payload.value);
      entities.set(event.target_id, next);
      return;
    }
    if (event.event_type === "clock.adjusted") {
      const entity = entities.get(event.target_id);
      if (!entity) throw new Error(`Entity not found: ${event.target_id}.`);
      if (!isSafeKey(payload.clock_id)) throw new Error("Clock ID is invalid.");
      if (!Number.isInteger(payload.delta) || payload.delta === 0) throw new Error("Clock delta must be a non-zero integer.");
      const next = cloneJson(entity);
      next.attributes = next.attributes ?? {};
      next.attributes.clocks = next.attributes.clocks ?? {};
      const current = next.attributes.clocks[payload.clock_id];
      const minimum = current?.minimum ?? payload.minimum ?? 0;
      const maximum = current?.maximum ?? payload.maximum;
      if (!Number.isInteger(minimum)) throw new Error("An integer clock minimum is required.");
      if (!Number.isInteger(maximum) || maximum < 1) throw new Error("A positive clock maximum is required.");
      if (minimum >= maximum) throw new Error("Clock minimum must be lower than its maximum.");
      if (current && payload.minimum !== void 0 && payload.minimum !== current.minimum) {
        throw new Error("Clock minimum cannot change after creation.");
      }
      if (current && payload.maximum !== void 0 && payload.maximum !== current.maximum) {
        throw new Error("Clock maximum cannot change after creation.");
      }
      const previousValue = current?.value ?? payload.initial ?? 0;
      if (!Number.isInteger(previousValue) || previousValue < minimum || previousValue > maximum) {
        throw new Error(`Initial clock value must stay between ${minimum} and ${maximum}.`);
      }
      const value = previousValue + payload.delta;
      if (value < minimum || value > maximum) {
        throw new Error(`Clock value must stay between ${minimum} and ${maximum}.`);
      }
      next.attributes.clocks[payload.clock_id] = {
        label: current?.label ?? payload.label ?? payload.clock_id,
        value,
        minimum,
        maximum
      };
      entities.set(event.target_id, next);
    }
  }
  function materializeUnchecked(document) {
    const entities = new Map(document.baseline.entities.map((entity) => [entity.id, cloneJson(entity)]));
    const relationships = new Map(
      document.baseline.relationships.map((relationship) => [relationship.id, cloneJson(relationship)])
    );
    for (const event of document.ledger.events) applyEventToMaps(entities, relationships, event);
    return {
      entities: [...entities.values()].sort(compareIds),
      relationships: [...relationships.values()].sort(compareIds)
    };
  }
  function validateCanonDocument(document) {
    const errors = [];
    const warnings = [];
    if (!isObject(document)) {
      return {
        valid: false,
        errors: ["Canon document must be an object."],
        warnings,
        summary: { campaignId: null, entities: 0, relationships: 0, events: 0 }
      };
    }
    if (document.schema_version !== CANON_SCHEMA_VERSION) errors.push("Unsupported canon schema version.");
    if (typeof document.campaign_id !== "string" || !document.campaign_id) errors.push("Campaign ID is required.");
    if (typeof document.name !== "string" || !document.name) errors.push("Campaign name is required.");
    if (Number.isNaN(Date.parse(document.created_at))) errors.push("created_at is invalid.");
    if (Number.isNaN(Date.parse(document.updated_at))) errors.push("updated_at is invalid.");
    if (!Number.isNaN(Date.parse(document.created_at)) && !Number.isNaN(Date.parse(document.updated_at))) {
      if (Date.parse(document.updated_at) < Date.parse(document.created_at)) {
        errors.push("updated_at cannot precede created_at.");
      }
    }
    if (!isObject(document.source)) errors.push("Source metadata is required.");
    if (!isObject(document.baseline)) errors.push("Baseline registry is required.");
    if (!isObject(document.ledger) || document.ledger.version !== 1) errors.push("Ledger version 1 is required.");
    const entities = Array.isArray(document?.baseline?.entities) ? document.baseline.entities : [];
    const relationships = Array.isArray(document?.baseline?.relationships) ? document.baseline.relationships : [];
    const events = Array.isArray(document?.ledger?.events) ? document.ledger.events : [];
    if (!Array.isArray(document?.baseline?.entities)) errors.push("Baseline entities must be an array.");
    if (!Array.isArray(document?.baseline?.relationships)) errors.push("Baseline relationships must be an array.");
    if (!Array.isArray(document?.ledger?.events)) errors.push("Ledger events must be an array.");
    const entityIds = /* @__PURE__ */ new Set();
    entities.forEach((entity, index) => {
      validateEntity(entity, `Baseline entity ${index + 1}`, errors);
      if (entity?.id && entityIds.has(entity.id)) errors.push(`Duplicate baseline entity ID: ${entity.id}.`);
      if (entity?.id) entityIds.add(entity.id);
    });
    const relationshipIds = /* @__PURE__ */ new Set();
    relationships.forEach((relationship, index) => {
      validateRelationship(relationship, `Baseline relationship ${index + 1}`, errors);
      if (relationship?.id && relationshipIds.has(relationship.id)) {
        errors.push(`Duplicate baseline relationship ID: ${relationship.id}.`);
      }
      if (relationship?.id) relationshipIds.add(relationship.id);
      if (relationship?.from && relationship?.to && (!entityIds.has(relationship.from) || !entityIds.has(relationship.to))) {
        errors.push(`Baseline relationship endpoint missing: ${relationship.id ?? "unknown"}.`);
      }
    });
    const eventIds = /* @__PURE__ */ new Set();
    let previousTimestamp = Date.parse(document.created_at);
    events.forEach((event, index) => {
      validateEventShape(event, index, errors);
      if (event?.event_id && eventIds.has(event.event_id)) errors.push(`Duplicate event ID: ${event.event_id}.`);
      if (event?.event_id) eventIds.add(event.event_id);
      const timestamp = Date.parse(event?.occurred_at);
      if (!Number.isNaN(timestamp)) {
        if (!Number.isNaN(previousTimestamp) && timestamp < previousTimestamp) {
          errors.push(`Event ${index + 1} precedes the previous canon timestamp.`);
        }
        previousTimestamp = timestamp;
      }
    });
    if (errors.length === 0) {
      try {
        materializeUnchecked(document);
      } catch (error) {
        errors.push(error.message);
      }
    }
    if (events.length > 0 && document.updated_at !== events.at(-1).occurred_at) {
      warnings.push("updated_at does not match the latest event timestamp.");
    }
    let materialized = { entities, relationships };
    if (errors.length === 0) materialized = materializeUnchecked(document);
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        campaignId: document.campaign_id ?? null,
        entities: materialized.entities.length,
        relationships: materialized.relationships.length,
        events: events.length
      }
    };
  }
  function materializeCanon(document) {
    const validation = validateCanonDocument(document);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return materializeUnchecked(document);
  }
  function appendCanonEvent(document, input) {
    const currentValidation = validateCanonDocument(document);
    if (!currentValidation.valid) throw new Error(currentValidation.errors.join("\n"));
    if (!isObject(input)) throw new Error("Canon event must be an object.");
    const event = {
      event_id: input.event_id,
      sequence: document.ledger.events.length + 1,
      event_type: input.event_type,
      occurred_at: input.occurred_at ?? (/* @__PURE__ */ new Date()).toISOString(),
      actor_id: input.actor_id,
      source: input.source,
      target_id: input.target_id,
      payload: cloneJson(input.payload ?? {})
    };
    if (input.transaction_id !== void 0) event.transaction_id = input.transaction_id;
    const candidate = cloneJson(document);
    candidate.updated_at = event.occurred_at;
    candidate.ledger.events.push(event);
    const validation = validateCanonDocument(candidate);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return candidate;
  }
  function appendCanonTransaction(document, inputs, options) {
    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new Error("A canon transaction requires at least one event.");
    }
    if (!isObject(options) || typeof options.transactionId !== "string" || !options.transactionId) {
      throw new Error("A canon transaction ID is required.");
    }
    let candidate = document;
    for (const input of inputs) {
      if (input.transaction_id !== void 0 && input.transaction_id !== options.transactionId) {
        throw new Error("Transaction event IDs must match the transaction.");
      }
      candidate = appendCanonEvent(candidate, {
        ...input,
        transaction_id: options.transactionId
      });
    }
    return candidate;
  }

  // machines/machine-005/campaign-workspace/campaign-workspace-state.mjs
  var WORKSPACE_SCHEMA_VERSION = "1.0.0";
  var WORKSPACE_GENERATOR = "Loot Table Works Gullwatch Campaign Workspace";
  var FACTION_FRONTS_INTEGRATION_VERSION = "1.0.0";
  var OUTCOMES = /* @__PURE__ */ new Set(["victory", "costly_win", "setback"]);
  var FACTION_POSTURES = /* @__PURE__ */ new Set(["cooperative", "watchful", "strained", "hostile", "fractured"]);
  var GULLWATCH_LOCATION_ID = "loc-coastal-02";
  function clone(value) {
    return value === void 0 ? void 0 : JSON.parse(JSON.stringify(value));
  }
  function slug(value) {
    return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  }
  function hash(value) {
    let result = 2166136261;
    for (const character of String(value)) {
      result ^= character.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(16).padStart(8, "0");
  }
  function stableIso(value, floor) {
    const parsed = Date.parse(value);
    const floorParsed = Date.parse(floor);
    if (Number.isNaN(parsed)) throw new Error("A valid timestamp is required.");
    if (Number.isNaN(floorParsed) || parsed >= floorParsed) return new Date(parsed).toISOString();
    return new Date(floorParsed).toISOString();
  }
  function isObject2(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function factionFrontsContract() {
    const contract = globalThis.FactionFrontsWorkspaceSource;
    if (!isObject2(contract) || contract.schema_version !== "1.0.0") {
      throw new Error("Faction Fronts workspace contract is unavailable.");
    }
    return contract;
  }
  function exactIds(actual, expected, label, errors) {
    if (!isObject2(actual)) {
      errors.push(`${label} must be an object.`);
      return false;
    }
    const actualIds = Object.keys(actual).sort();
    const expectedIds = [...expected].sort();
    const unknown = actualIds.filter((id) => !expectedIds.includes(id));
    const missing = expectedIds.filter((id) => !actualIds.includes(id));
    if (unknown.length || missing.length) {
      const detail = [
        unknown.length ? `unknown: ${unknown.join(", ")}` : null,
        missing.length ? `missing: ${missing.join(", ")}` : null
      ].filter(Boolean).join("; ");
      errors.push(`${label} does not match authored IDs (${detail}).`);
      return false;
    }
    return true;
  }
  function validateFactionFrontsState(state) {
    const contract = factionFrontsContract();
    const errors = [];
    if (!isObject2(state)) return { valid: false, errors: ["Faction Fronts state must be an object."] };
    if (state.state_version !== "1.0.0") errors.push("Unsupported Faction Fronts state version.");
    const frontIds = contract.fronts.map((front) => front.front_id);
    const factionIds = contract.factions.map((faction) => faction.faction_id);
    const pressureIdsValid = exactIds(state.front_pressure, frontIds, "Faction Fronts front_pressure", errors);
    const postureIdsValid = exactIds(state.faction_posture, factionIds, "Faction Fronts faction_posture", errors);
    const projectIdsValid = exactIds(state.faction_project_segments, factionIds, "Faction Fronts faction_project_segments", errors);
    if (pressureIdsValid) {
      contract.fronts.forEach((front) => {
        const value = state.front_pressure[front.front_id];
        if (!Number.isInteger(value) || value < 0 || value > front.pressure_max) {
          errors.push(`Faction Fronts pressure for ${front.front_id} must be an integer between 0 and ${front.pressure_max}.`);
        }
      });
    }
    if (postureIdsValid) {
      contract.factions.forEach((faction) => {
        if (!FACTION_POSTURES.has(state.faction_posture[faction.faction_id])) {
          errors.push(`Faction Fronts posture for ${faction.faction_id} is invalid.`);
        }
      });
    }
    if (projectIdsValid) {
      contract.factions.forEach((faction) => {
        const value = state.faction_project_segments[faction.faction_id];
        const maximum = faction.active_project.clock_max;
        if (!Number.isInteger(value) || value < 0 || value > maximum) {
          errors.push(`Faction Fronts project progress for ${faction.faction_id} must be an integer between 0 and ${maximum}.`);
        }
      });
    }
    return { valid: errors.length === 0, errors: [...new Set(errors)] };
  }
  function createDefaultFactionFrontsSlice(updatedAt) {
    const contract = factionFrontsContract();
    return {
      integration_version: FACTION_FRONTS_INTEGRATION_VERSION,
      product_id: contract.product_id,
      updated_at: stableIso(updatedAt, "1970-01-01T00:00:00.000Z"),
      state: clone(contract.campaign_state_template)
    };
  }
  function validateFactionFrontsSlice(slice) {
    const contract = factionFrontsContract();
    const errors = [];
    if (!isObject2(slice)) return { valid: false, errors: ["Workspace Faction Fronts slice must be an object."] };
    if (slice.integration_version !== FACTION_FRONTS_INTEGRATION_VERSION) {
      errors.push("Unsupported workspace Faction Fronts integration version.");
    }
    if (slice.product_id !== contract.product_id) errors.push("Workspace Faction Fronts product ID does not match.");
    if (Number.isNaN(Date.parse(slice.updated_at))) errors.push("Workspace Faction Fronts updated_at must be a valid timestamp.");
    const stateValidation = validateFactionFrontsState(slice.state);
    errors.push(...stateValidation.errors);
    return { valid: errors.length === 0, errors: [...new Set(errors)] };
  }
  function normalizeFactionFrontsImport(input, updatedAt) {
    const contract = factionFrontsContract();
    if (!isObject2(input)) throw new Error("A Faction Fronts browser state object is required.");
    if (input.product_id !== void 0 && input.product_id !== contract.product_id) {
      throw new Error("Faction Fronts product ID does not match the Gullwatch workspace contract.");
    }
    const state = isObject2(input.state) ? input.state : input;
    const validation = validateFactionFrontsState(state);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return {
      integration_version: FACTION_FRONTS_INTEGRATION_VERSION,
      product_id: contract.product_id,
      updated_at: stableIso(updatedAt, "1970-01-01T00:00:00.000Z"),
      state: clone(state)
    };
  }
  function factionFrontsSliceFor(value) {
    return value.faction_fronts ?? createDefaultFactionFrontsSlice(value.updated_at ?? value.created_at);
  }
  function mergeGullwatchRegistry(canon, campaignStart) {
    const candidate = clone(canon);
    const entities = new Map(candidate.baseline.entities.map((entity) => [entity.id, entity]));
    const relationships = new Map(candidate.baseline.relationships.map((relationship) => [relationship.id, relationship]));
    for (const seeded of campaignStart.registry.entities) {
      const current = entities.get(seeded.id);
      if (current) {
        current.name = seeded.name;
        current.status = seeded.status;
        current.attributes = {
          ...current.attributes ?? {},
          ...clone(seeded.attributes) ?? {},
          facts: {
            ...current.attributes?.facts ?? {},
            ...clone(seeded.attributes?.facts) ?? {}
          },
          clocks: {
            ...current.attributes?.clocks ?? {},
            ...clone(seeded.attributes?.clocks) ?? {}
          }
        };
      } else {
        entities.set(seeded.id, clone(seeded));
      }
    }
    const followOnThread = entities.get("gb-thread-beacon-fate");
    if (followOnThread) {
      followOnThread.status = "planned";
      delete followOnThread.attributes?.facts?.resolved;
    }
    for (const seeded of campaignStart.registry.relationships) {
      if (!relationships.has(seeded.id)) {
        relationships.set(seeded.id, {
          id: seeded.id,
          from: seeded.from,
          to: seeded.to,
          relationship_type: seeded.relationship_type,
          attributes: {
            source_module: seeded.source_module ?? "gullwatch_campaign_seed",
            graph_metadata: clone(seeded.metadata ?? {})
          }
        });
      }
    }
    candidate.baseline.entities = [...entities.values()].sort((left, right) => left.id.localeCompare(right.id));
    candidate.baseline.relationships = [...relationships.values()].sort((left, right) => left.id.localeCompare(right.id));
    const validation = validateCanonDocument(candidate);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return candidate;
  }
  function buildCanon(source, campaignStart, createdAt) {
    const base = createCanonDocumentFromAssembly(source, {
      campaignId: campaignStart.campaign_id,
      campaignName: campaignStart.campaign_name,
      createdAt
    });
    return mergeGullwatchRegistry(base, campaignStart);
  }
  function generateBriefFor(workspace) {
    const registry = materializeCanon(workspace.canon);
    return globalThis.CampaignWorkspaceCore.generate(
      {
        campaign_id: workspace.canon.campaign_id,
        registry
      },
      {
        seed: `${workspace.seed}|session-${workspace.session_number}`,
        tone: workspace.tone,
        sessionNumber: workspace.session_number,
        sceneCount: 5,
        entityLimit: 7,
        callbackLimit: 4
      }
    );
  }
  function validateWorkspace(value) {
    const errors = [];
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { valid: false, errors: ["Campaign Workspace save must be an object."], summary: null };
    }
    if (value.schema_version !== WORKSPACE_SCHEMA_VERSION) errors.push("Unsupported Campaign Workspace schema version.");
    if (value.generator !== WORKSPACE_GENERATOR) errors.push("Campaign Workspace generator does not match.");
    if (typeof value.workspace_id !== "string" || !value.workspace_id) errors.push("Workspace ID is required.");
    if (typeof value.seed !== "string" || !value.seed) errors.push("Workspace seed is required.");
    if (!Number.isInteger(value.session_number) || value.session_number < 1) errors.push("Session number must be a positive integer.");
    if (!Array.isArray(value.sessions)) errors.push("Workspace sessions must be an array.");
    if (Array.isArray(value.sessions) && value.sessions.length !== Math.max(0, (value.session_number ?? 1) - 1)) {
      errors.push("Workspace session count does not match the next session number.");
    }
    if (Array.isArray(value.sessions)) {
      value.sessions.forEach((session, index) => {
        if (session.session_number !== index + 1) errors.push(`Workspace session ${index + 1} is out of order.`);
        if (!OUTCOMES.has(session.outcome)) errors.push(`Workspace session ${index + 1} has an unsupported outcome.`);
        if (typeof session.truth !== "string" || !session.truth.trim()) errors.push(`Workspace session ${index + 1} is missing its truth.`);
        if (typeof session.next_thread !== "string" || !session.next_thread.trim()) errors.push(`Workspace session ${index + 1} is missing its next thread.`);
      });
    }
    const seedValidation = globalThis.GullwatchCampaignSeed.validateCampaignStart(value.campaign_start);
    if (!seedValidation.valid) errors.push(...seedValidation.errors);
    if (value.producer_start !== null && value.producer_start !== void 0) {
      const producerValidation = globalThis.CampaignStartContract.validateCampaignStart(value.producer_start);
      if (!producerValidation.valid) errors.push(...producerValidation.errors);
    }
    if (value.faction_fronts !== null && value.faction_fronts !== void 0) {
      const factionValidation = validateFactionFrontsSlice(value.faction_fronts);
      if (!factionValidation.valid) errors.push(...factionValidation.errors);
    }
    const canonValidation = validateCanonDocument(value.canon);
    if (!canonValidation.valid) errors.push(...canonValidation.errors);
    if (canonValidation.valid && value.canon.campaign_id !== value.campaign_start?.campaign_id) {
      errors.push("Canon campaign ID does not match the campaign start.");
    }
    if (!value.brief?.validation?.valid) errors.push("A valid current session brief is required.");
    if (value.brief?.campaign_id !== value.canon?.campaign_id) errors.push("Session brief campaign ID does not match Canon.");
    if (value.brief?.session_number !== value.session_number) errors.push("Session brief number does not match the workspace.");
    if (Date.parse(value.updated_at) < Date.parse(value.created_at)) errors.push("Workspace updated_at cannot precede created_at.");
    return {
      valid: errors.length === 0,
      errors: [...new Set(errors)],
      summary: {
        workspaceId: value.workspace_id ?? null,
        sessionNumber: value.session_number ?? null,
        sessions: Array.isArray(value.sessions) ? value.sessions.length : 0,
        entities: canonValidation.summary?.entities ?? 0,
        relationships: canonValidation.summary?.relationships ?? 0,
        events: canonValidation.summary?.events ?? 0
      }
    };
  }
  function createDefaultWorkspace(source, adventure, options = {}) {
    if (source?.validation?.valid !== true) throw new Error("A validated World Foundry assembly is required.");
    if (adventure?.product?.adventure_title !== "Signal at Gullwatch") throw new Error("The validated Gullwatch adventure is required.");
    const campaignStart = globalThis.GullwatchCampaignSeed.createCampaignStart();
    const createdAt = stableIso(options.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(), "1970-01-01T00:00:00.000Z");
    const seed = slug(options.seed ?? "gullwatch-first-light") || "gullwatch-first-light";
    const workspace = {
      schema_version: WORKSPACE_SCHEMA_VERSION,
      generator: WORKSPACE_GENERATOR,
      workspace_id: `gww-${hash(`${campaignStart.campaign_id}|${seed}|${createdAt}`)}`,
      seed,
      title: options.title ?? "Gullwatch: First Light",
      tone: options.tone ?? "grounded",
      created_at: createdAt,
      updated_at: createdAt,
      session_number: 1,
      campaign_start: clone(campaignStart),
      producer_start: null,
      adventure: clone(adventure),
      faction_fronts: createDefaultFactionFrontsSlice(createdAt),
      canon: buildCanon(source, campaignStart, createdAt),
      sessions: [],
      brief: null
    };
    workspace.brief = clone(generateBriefFor(workspace));
    const validation = validateWorkspace(workspace);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return workspace;
  }
  function createWorkspaceFromCampaignStart(source, adventure, producerStart, options = {}) {
    const producerValidation = globalThis.CampaignStartContract.validateCampaignStart(producerStart);
    if (!producerValidation.valid) throw new Error(producerValidation.errors.join("\n"));
    const toneMap = { heroic: "heroic", mystery: "intrigue", peril: "grounded" };
    const workspace = createDefaultWorkspace(source, adventure, {
      ...options,
      seed: producerStart.campaign.seed,
      title: `${producerStart.campaign.title} / Gullwatch`,
      tone: toneMap[producerStart.opening_session.tone] ?? "grounded"
    });
    workspace.producer_start = clone(producerStart);
    workspace.brief = clone(generateBriefFor(workspace));
    const validation = validateWorkspace(workspace);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return workspace;
  }
  function normalizeAdjustments(value) {
    const result = {};
    for (const [clockId, raw] of Object.entries(value ?? {})) {
      const delta = Number(raw);
      if (!["flood_tide", "false_signal"].includes(clockId)) continue;
      if (!Number.isInteger(delta)) throw new Error(`Clock adjustment for ${clockId} must be an integer.`);
      if (delta !== 0) result[clockId] = delta;
    }
    return result;
  }
  function recordWorkspaceSession(value, input, occurredAt = (/* @__PURE__ */ new Date()).toISOString()) {
    const validation = validateWorkspace(value);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    if (!OUTCOMES.has(input?.outcome)) throw new Error("Outcome must be victory, costly win, or setback.");
    if (typeof input?.truth !== "string" || !input.truth.trim()) throw new Error("A new campaign truth is required.");
    if (typeof input?.nextThread !== "string" || !input.nextThread.trim()) throw new Error("A next unresolved choice is required.");
    const materialized = materializeCanon(value.canon);
    const target = materialized.entities.find((entity) => entity.id === input.targetId);
    if (!target) throw new Error("The campaign target does not exist in Canon.");
    const sessionNumber = value.session_number;
    const timestamp = stableIso(occurredAt, value.updated_at);
    const sessionKey = String(sessionNumber).padStart(3, "0");
    const transactionId = `gww-tx-${value.workspace_id}-${sessionKey}`;
    const nextThreadId = `gb-thread-${value.workspace_id}-${sessionKey}-next`;
    const nextThreadName = input.nextThread.trim().replace(/[.!?]+$/, "");
    const events = [
      {
        event_id: `gww-evt-${value.workspace_id}-${sessionKey}-truth`,
        event_type: "fact.set",
        occurred_at: timestamp,
        actor_id: "campaign-workspace-gm",
        source: WORKSPACE_GENERATOR,
        target_id: target.id,
        payload: { key: `session_${sessionKey}_truth`, value: input.truth.trim() }
      },
      {
        event_id: `gww-evt-${value.workspace_id}-${sessionKey}-outcome`,
        event_type: "fact.set",
        occurred_at: timestamp,
        actor_id: "campaign-workspace-gm",
        source: WORKSPACE_GENERATOR,
        target_id: target.id,
        payload: { key: `session_${sessionKey}_outcome`, value: input.outcome }
      },
      {
        event_id: `gww-evt-${value.workspace_id}-${sessionKey}-next-thread`,
        event_type: "entity.created",
        occurred_at: timestamp,
        actor_id: "campaign-workspace-gm",
        source: WORKSPACE_GENERATOR,
        target_id: nextThreadId,
        payload: {
          entity: {
            id: nextThreadId,
            entity_type: "campaign_thread",
            name: nextThreadName,
            status: "open",
            tags: ["gullwatch", "session-continuity"],
            attributes: {
              source_module: "campaign_workspace",
              facts: {
                source_session: sessionNumber
              }
            }
          }
        }
      },
      {
        event_id: `gww-evt-${value.workspace_id}-${sessionKey}-next-link`,
        event_type: "relationship.added",
        occurred_at: timestamp,
        actor_id: "campaign-workspace-gm",
        source: WORKSPACE_GENERATOR,
        target_id: `gb-rel-${value.workspace_id}-${sessionKey}-next`,
        payload: {
          relationship: {
            id: `gb-rel-${value.workspace_id}-${sessionKey}-next`,
            from: target.id,
            to: nextThreadId,
            relationship_type: "follows_from",
            attributes: {
              source_module: "campaign_workspace",
              graph_metadata: { source_session: sessionNumber }
            }
          }
        }
      }
    ];
    if (/thread/i.test(target.entity_type) && input.outcome !== "setback") {
      events.splice(
        2,
        0,
        {
          event_id: `gww-evt-${value.workspace_id}-${sessionKey}-resolve-status`,
          event_type: "entity.updated",
          occurred_at: timestamp,
          actor_id: "campaign-workspace-gm",
          source: WORKSPACE_GENERATOR,
          target_id: target.id,
          payload: { patch: { status: "resolved" } }
        },
        {
          event_id: `gww-evt-${value.workspace_id}-${sessionKey}-resolve-fact`,
          event_type: "fact.set",
          occurred_at: timestamp,
          actor_id: "campaign-workspace-gm",
          source: WORKSPACE_GENERATOR,
          target_id: target.id,
          payload: { key: "resolved", value: true }
        }
      );
    }
    const adjustments = normalizeAdjustments(input.clockAdjustments);
    for (const [clockId, delta] of Object.entries(adjustments)) {
      events.push({
        event_id: `gww-evt-${value.workspace_id}-${sessionKey}-${clockId}`,
        event_type: "clock.adjusted",
        occurred_at: timestamp,
        actor_id: "campaign-workspace-gm",
        source: WORKSPACE_GENERATOR,
        target_id: GULLWATCH_LOCATION_ID,
        payload: { clock_id: clockId, delta }
      });
    }
    const next = hydrateWorkspace(value);
    next.canon = appendCanonTransaction(next.canon, events, { transactionId });
    next.sessions.push({
      session_number: sessionNumber,
      occurred_at: timestamp,
      outcome: input.outcome,
      target_id: target.id,
      target_name: target.name,
      truth: input.truth.trim(),
      next_thread: input.nextThread.trim(),
      clock_adjustments: adjustments,
      transaction_id: transactionId
    });
    next.session_number += 1;
    next.updated_at = timestamp;
    next.brief = clone(generateBriefFor(next));
    const nextValidation = validateWorkspace(next);
    if (!nextValidation.valid) throw new Error(nextValidation.errors.join("\n"));
    return next;
  }
  function regenerateWorkspaceBrief(value) {
    const validation = validateWorkspace(value);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    const next = hydrateWorkspace(value);
    next.brief = clone(generateBriefFor(next));
    const nextValidation = validateWorkspace(next);
    if (!nextValidation.valid) throw new Error(nextValidation.errors.join("\n"));
    return next;
  }
  function hydrateWorkspace(value) {
    const candidate = clone(value);
    if (isObject2(candidate) && (candidate.faction_fronts === null || candidate.faction_fronts === void 0)) {
      candidate.faction_fronts = createDefaultFactionFrontsSlice(candidate.updated_at ?? candidate.created_at);
    }
    const validation = validateWorkspace(candidate);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return candidate;
  }
  function isFactionFrontsStateDocument(value) {
    return isObject2(value) && (value.state_version === "1.0.0" || isObject2(value.state) && value.state.state_version === "1.0.0" || typeof value.product_id === "string" && /faction-fronts/i.test(value.product_id));
  }
  function importFactionFrontsState(value, input, occurredAt = (/* @__PURE__ */ new Date()).toISOString()) {
    const next = hydrateWorkspace(value);
    const timestamp = stableIso(occurredAt, next.updated_at);
    next.faction_fronts = normalizeFactionFrontsImport(input, timestamp);
    next.updated_at = timestamp;
    const validation = validateWorkspace(next);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return next;
  }
  function updateFactionFrontsState(value, change, occurredAt = (/* @__PURE__ */ new Date()).toISOString()) {
    const next = hydrateWorkspace(value);
    if (!isObject2(change)) throw new Error("A Faction Fronts state change is required.");
    const contract = factionFrontsContract();
    const timestamp = stableIso(occurredAt, next.updated_at);
    const state = next.faction_fronts.state;
    if (change.kind === "front_pressure") {
      const front = contract.fronts.find((entry) => entry.front_id === change.id);
      if (!front) throw new Error(`Unknown Faction Fronts front ID: ${change.id}.`);
      if (!Number.isInteger(change.value) || change.value < 0 || change.value > front.pressure_max) {
        throw new Error(`Faction Fronts pressure for ${change.id} must be an integer between 0 and ${front.pressure_max}.`);
      }
      state.front_pressure[change.id] = change.value;
    } else if (change.kind === "faction_posture") {
      const faction = contract.factions.find((entry) => entry.faction_id === change.id);
      if (!faction) throw new Error(`Unknown Faction Fronts faction ID: ${change.id}.`);
      if (!FACTION_POSTURES.has(change.value)) throw new Error(`Faction Fronts posture for ${change.id} is invalid.`);
      state.faction_posture[change.id] = change.value;
    } else if (change.kind === "faction_project_segments") {
      const faction = contract.factions.find((entry) => entry.faction_id === change.id);
      if (!faction) throw new Error(`Unknown Faction Fronts faction ID: ${change.id}.`);
      const maximum = faction.active_project.clock_max;
      if (!Number.isInteger(change.value) || change.value < 0 || change.value > maximum) {
        throw new Error(`Faction Fronts project progress for ${change.id} must be an integer between 0 and ${maximum}.`);
      }
      state.faction_project_segments[change.id] = change.value;
    } else {
      throw new Error(`Unsupported Faction Fronts state change: ${change.kind}.`);
    }
    next.faction_fronts.updated_at = timestamp;
    next.updated_at = timestamp;
    const validation = validateWorkspace(next);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return next;
  }
  function resetFactionFrontsState(value, occurredAt = (/* @__PURE__ */ new Date()).toISOString()) {
    const next = hydrateWorkspace(value);
    const timestamp = stableIso(occurredAt, next.updated_at);
    next.faction_fronts = createDefaultFactionFrontsSlice(timestamp);
    next.updated_at = timestamp;
    const validation = validateWorkspace(next);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return next;
  }
  function factionFrontsStateDocument(value) {
    const hydrated = hydrateWorkspace(value);
    const contract = factionFrontsContract();
    return {
      product_id: hydrated.faction_fronts.product_id,
      exported_at: hydrated.faction_fronts.updated_at,
      region: clone(contract.region),
      state: clone(hydrated.faction_fronts.state)
    };
  }
  function serializeFactionFrontsState(value) {
    return `${JSON.stringify(factionFrontsStateDocument(value), null, 2)}
`;
  }
  function currentClockNotes(adventure, clocks) {
    return Object.fromEntries(Object.entries(clocks).map(([id, clock]) => {
      const source = adventure.clocks.find((entry) => slug(entry.name).replaceAll("-", "_") === id);
      const effectIndex = Math.max(0, Math.min((source?.effects?.length ?? 1) - 1, Math.floor(clock.value / clock.maximum * (source?.effects?.length ?? 1))));
      return [id, source?.effects?.[effectIndex] ?? source?.advance_when ?? `${clock.label} is at ${clock.value}/${clock.maximum}.`];
    }));
  }
  function workspaceProduct(product, index) {
    const url = new URL(product.url);
    url.searchParams.set("utm_source", "campaign_workspace");
    url.searchParams.set("utm_medium", "web");
    url.searchParams.set("utm_campaign", "gullwatch_campaign_workspace_v1");
    url.searchParams.set("utm_content", ["encounter", "quest", "loot"][index] ?? `offer_${index + 1}`);
    return { ...clone(product), url: url.toString() };
  }
  function summarizeWorkspace(value) {
    const validation = validateWorkspace(value);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    const factionSlice = factionFrontsSliceFor(value);
    const factionValidation = validateFactionFrontsSlice(factionSlice);
    if (!factionValidation.valid) throw new Error(factionValidation.errors.join("\n"));
    const factionContract = factionFrontsContract();
    const registry = materializeCanon(value.canon);
    const byId = new Map(registry.entities.map((entity) => [entity.id, entity]));
    const location = byId.get(GULLWATCH_LOCATION_ID);
    const clocks = Object.entries(location.attributes?.clocks ?? {}).map(([id, clock]) => ({ id, ...clone(clock) }));
    const sessions = value.sessions.map((session) => ({
      label: `Session ${session.session_number}`,
      title: session.target_name,
      detail: `${session.truth} Next: ${session.next_thread}`
    }));
    const timeline = [
      {
        label: "Campaign start",
        title: value.campaign_start.active_objectives[0].label,
        detail: value.campaign_start.premise.player_facing
      },
      ...sessions
    ];
    const focusIds = [
      "gb-thread-true-signal",
      "gb-thread-beacon-fate",
      "gb-cast-mara-vale",
      "gb-cast-nera-voss",
      "gb-cast-orren-saye",
      GULLWATCH_LOCATION_ID,
      "pitm-0032"
    ];
    const canonFocus = focusIds.map((id) => byId.get(id)).filter(Boolean).map((entity) => ({
      id: entity.id,
      name: entity.name,
      type: entity.entity_type,
      detail: entity.status ?? "active"
    }));
    const recordTargets = canonFocus.map((entry) => ({ id: entry.id, name: entry.name, type: entry.type })).sort((left, right) => {
      return Number(right.id === value.brief.objective.primary_entity_id) - Number(left.id === value.brief.objective.primary_entity_id);
    });
    const factionState = factionContract.factions.map((faction) => ({
      id: faction.faction_id,
      name: faction.name,
      archetype: faction.archetype,
      posture: factionSlice.state.faction_posture[faction.faction_id],
      project: faction.active_project.title,
      projectSegments: factionSlice.state.faction_project_segments[faction.faction_id],
      projectMaximum: faction.active_project.clock_max
    }));
    const frontState = factionContract.fronts.map((front) => ({
      id: front.front_id,
      title: front.title,
      type: front.front_type,
      authoredStatus: front.status,
      factionA: clone(front.faction_a),
      factionB: clone(front.faction_b),
      pressure: factionSlice.state.front_pressure[front.front_id],
      pressureMaximum: front.pressure_max
    }));
    return {
      title: value.title,
      adventureTitle: value.campaign_start.campaign_name,
      pitch: value.campaign_start.premise.player_facing,
      strongStart: value.adventure.strong_start,
      playerRange: value.adventure.product.players,
      duration: value.adventure.product.duration,
      sessionNumber: value.session_number,
      objective: value.brief.objective.text,
      objectiveUrgency: value.brief.stakes[0]?.urgency ?? "active",
      nextDecision: {
        label: value.brief.continuity_callbacks[0]?.urgency ?? "active",
        text: value.brief.continuity_callbacks[0]?.text ?? value.campaign_start.active_objectives[1].player_facing
      },
      clocks,
      clockNotes: currentClockNotes(value.adventure, Object.fromEntries(clocks.map((clock) => [clock.id, clock]))),
      cast: value.campaign_start.key_references.cast,
      timeline,
      brief: value.brief,
      products: value.adventure.paid_expansions.map(workspaceProduct),
      gmTruths: value.adventure.gm_truths,
      routes: value.adventure.routes,
      endings: value.adventure.endings,
      recordTargets,
      canonFocus,
      factionFronts: {
        productId: factionSlice.product_id,
        updatedAt: factionSlice.updated_at,
        region: clone(factionContract.region),
        factions: factionState,
        fronts: frontState,
        highPressureFronts: frontState.filter((front) => front.pressure >= 4).length,
        advancedProjects: factionState.filter((faction) => faction.projectSegments >= 4).length
      },
      schemaVersion: value.schema_version,
      entityCount: registry.entities.length,
      relationshipCount: registry.relationships.length,
      eventCount: value.canon.ledger.events.length
    };
  }
  function serializeWorkspace(value) {
    const hydrated = hydrateWorkspace(value);
    return `${JSON.stringify(hydrated, null, 2)}
`;
  }
  function workspaceToMarkdown(value) {
    const summary = summarizeWorkspace(value);
    const lines = [
      `# ${summary.title}`,
      "",
      `**Campaign:** ${value.canon.campaign_id}  `,
      `**Workspace:** ${value.workspace_id}  `,
      `**Next session:** ${value.session_number}  `,
      `**Canon:** ${summary.entityCount} entities / ${summary.relationshipCount} relationships / ${summary.eventCount} events`,
      "",
      "## Current Objective",
      "",
      summary.objective,
      "",
      "## Pressure Clocks",
      ""
    ];
    summary.clocks.forEach((clock) => lines.push(`- **${clock.label}:** ${clock.value}/${clock.maximum}`));
    lines.push("", "## Faction Fronts", "");
    lines.push(`- **Region:** ${summary.factionFronts.region.name}`);
    lines.push(`- **High-pressure fronts:** ${summary.factionFronts.highPressureFronts}/${summary.factionFronts.fronts.length}`);
    lines.push(`- **Advanced projects:** ${summary.factionFronts.advancedProjects}/${summary.factionFronts.factions.length}`);
    lines.push("", "## Recorded Sessions", "");
    value.sessions.forEach((session) => lines.push(`${session.session_number}. **${session.target_name}:** ${session.truth} Next: ${session.next_thread}`));
    lines.push("", "## Source Provenance", "");
    value.campaign_start.source_provenance.forEach((source) => lines.push(`- ${source.source_id}: ${source.path} (${source.sha256})`));
    return lines.join("\n");
  }

  // machines/machine-005/campaign-workspace/campaign-workspace-runtime-entry.js
  var api = Object.freeze({
    createDefault: createDefaultWorkspace,
    createFromCampaignStart: createWorkspaceFromCampaignStart,
    exportFactionState: factionFrontsStateDocument,
    hydrate: hydrateWorkspace,
    importFactionState: importFactionFrontsState,
    isFactionStateDocument: isFactionFrontsStateDocument,
    recordSession: recordWorkspaceSession,
    generateBrief: regenerateWorkspaceBrief,
    resetFactionState: resetFactionFrontsState,
    serializeFactionState: serializeFactionFrontsState,
    serialize: serializeWorkspace,
    summarize: summarizeWorkspace,
    updateFactionState: updateFactionFrontsState,
    validate: validateWorkspace,
    toCampaignMarkdown: workspaceToMarkdown,
    briefToMarkdown: globalThis.CampaignWorkspaceCore.toMarkdown
  });
  globalThis.CampaignWorkspaceRuntime = api;
  var campaign_workspace_runtime_entry_default = api;
  return __toCommonJS(campaign_workspace_runtime_entry_exports);
})();
