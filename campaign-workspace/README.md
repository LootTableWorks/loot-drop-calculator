# Gullwatch Campaign Workspace

Campaign Workspace converts current Canon state into a deterministic next-session brief. It does not invent an unrelated adventure. It ranks consequences already present in the campaign, follows their graph connections, and produces scenes that expose, pressure, resolve, and record those consequences.

The dedicated Gullwatch browser workspace adds a complete local-first campaign surface around that core:

- Start from the source-verified Gullwatch seed or import a validated Campaign Start from Campaign Launchpad plus One-Shot Forge.
- Persist campaign state locally without an account.
- Record a victory, costly win, or setback against a canonical target.
- Move Flood Tide and False Signal within authored bounds.
- Commit facts and clock movement as one append-only Canon transaction.
- Track all six Saltglass factions, fifteen fronts, faction postures, and project clocks in the same local save.
- Import the validated JSON wrapper exported by the Faction Fronts browser and export the normalized state again.
- Generate the next five-beat GM brief from materialized state.
- Export and reopen portable workspace JSON or copy Markdown.
- Reach three attributed `$3` standalone modules from the complete free campaign outcome.

The browser package has no analytics, hosted AI, remote runtime dependency, paid infrastructure, or gated bundle destination.

## Runtime Contract

`campaign-workspace-core.js` is a dependency-free UMD module:

- CommonJS: `require("./campaign-workspace-core.js")`
- Browser: `globalThis.CampaignWorkspaceCore`

The core accepts either a materialized Canon registry:

```js
{
  entities: CanonEntity[],
  relationships: CanonRelationship[]
}
```

or an index-friendly wrapper:

```js
{
  campaign_id: "wfc-example",
  registry: {
    entities: CanonEntity[],
    relationships: CanonRelationship[]
  }
}
```

Every relationship endpoint must resolve to an entity. Facts must be objects. Clocks require integer `value`, `minimum`, and `maximum` fields with a value inside those bounds.

## Generate A Brief

```js
const workspace = require("./campaign-workspace-core.js");

const brief = workspace.generate(
  {
    campaign_id: canonDocument.campaign_id,
    registry: materializeCanon(canonDocument)
  },
  {
    seed: "harbor-return-41",
    tone: "grounded",
    sessionNumber: 4,
    sceneCount: 5,
    entityLimit: 6,
    callbackLimit: 4
  }
);
```

The seed is required. The same materialized state and options produce the same brief and `brief_id`.

## Continuity Priority

The core ranks state without a model call:

1. Near-full bounded clocks
2. Open campaign threads, fronts, projects, mysteries, and problems
3. Facts whose values explicitly indicate an unresolved, blocked, contested, threatened, missing, or incomplete state
4. Lower-pressure clocks
5. Graph-connected active entities when no explicit mutable state exists

Authored quest records become continuity signals only when Canon gives them an explicit unresolved fact or converts them into a campaign thread. Archived entities and resolved facts or threads do not become objectives.

## Brief Output

Each validated brief contains:

- One objective tied to the highest-priority Canon signal
- Up to three explicit stakes, completed with closed graph connections when fewer than three mutable signals exist
- Ranked involved entities
- Continuity callbacks quoting current facts, clocks, or open threads
- Three through seven ordered session scenes
- Source references for every reused entity and relationship
- A compatibility `reference_ledger`
- State and validation summaries

`validateBrief(brief, snapshot)` rechecks scene ordering and source closure. `toMarkdown(brief)` creates a portable GM-facing brief without changing its content.

## Design Boundary

Campaign Workspace is system-neutral and uses only original Loot Table Works terminology and source content. It contains no third-party setting, character, or rules text. A later interface can render and edit these briefs, but the deterministic core remains the authority for continuity selection and reference closure.

## Supporting Contracts

- `gullwatch-campaign-seed.js` supplies the source-verified 10-entity Gullwatch seed registry and authored provenance hashes.
- `integrations/campaign-start-contract.js` normalizes matching Campaign Launchpad and One-Shot Forge outputs.
- `faction-fronts-workspace-data.js` is a generated compact contract sourced from the six-faction Saltglass sample.
- `campaign-workspace-state.mjs` owns the 79-entity campaign Canon, faction state slice, session transactions, save validation, and summaries.
- `campaign-workspace-runtime.js` is the generated browser bundle.

## Test

From the repository root:

```powershell
node .\machines\machine-005\campaign-workspace\test\campaign-workspace-core.test.js
```

The test suite covers deterministic generation, priority ordering, graph fallback, invalid references, invalid clocks, immutable output, Markdown export, and an integration path from the existing coastal assembly through Canon Engine materialization.

The focused Faction Fronts suite covers authored defaults, strict ID and range validation, browser-wrapper import/export, immutable edits, deterministic serialization, and migration of pre-integration campaign saves.

Run the complete package build from this directory:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build.ps1
```

The build writes `machines/machine-005/dist/campaign-workspace-static-site-v1.zip` and the matching GitHub Pages directory. It does not deploy or publish.
