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
- Close a committed session with primary save, next-session Markdown, and scoped print actions.
- Keep an optional content-free return receipt in separate local storage without changing campaign JSON or recovery.
- Confirm a later return only from a separate page session on a later date and only after explicit user consent.
- See exactly one optional Gullwatch Aftermath continuation after saving the campaign and copying or printing the next-session brief.
- Open a non-purchase Aftermath preview while the storefront gate is closed; the same slot can become one attributed `Get Gullwatch Aftermath - $3` action only after a public storefront URL is supplied.
- Run a voluntary first-pass GM field test with direct source-kit and one-shot-guide handoffs, a local progress rail, and a source-attributed report.

The browser package has no analytics, hosted AI, remote runtime dependency, paid infrastructure, or gated bundle destination. The field-test report and return receipt stay in the browser until the tester explicitly copies, downloads, or opens a prefilled email in their own mail application. The default report excludes workspace IDs, campaign prose, player data, and save contents.

## Field-Test Activation Rail

The Field test view presents one bounded local workflow: open the included Source kit, commit a campaign outcome, save portable JSON, and return to an editable plain-text report. It also links to the complete free Gullwatch Beacon kit and the worked one-shot guide in new tabs so a source-coded field-test URL remains intact.

A first visit without an existing local save or an explicit `view` query now
opens a focused starting gate instead of the advanced workspace. It offers
exactly three honest paths: open the Gullwatch source kit, build a different
Campaign Start in Campaign Launchpad, or open portable campaign JSON. Existing
local campaigns and source-coded field-test routes bypass the gate without
changing their state.

Source-kit opened, outcome committed, portable JSON saved, and campaign state reopened are rendered from the current page session and existing local milestone state. They are not transmitted or counted as demand. The report preserves the four inbound UTM values by default, omits `workspace_id`, and is never stored automatically. Copy failure leaves the report selected and available for browser copy or `.txt` download. Email remains a user-initiated `mailto:` draft and is the verified external reporting route.

## Creation Disclosure

Loot Table Works used generative AI assistance during development and editorial production. The released content and code were human-directed and QA-reviewed. The browser tool runs locally and does not call an AI service or upload campaign data.

## Session Closeout And Return Checkpoint

After a session transaction is successfully written to the validated local campaign journal, the next-session view adds an unframed closeout checkpoint. Its primary actions:

1. Download the existing portable Campaign Workspace JSON.
2. Copy the deterministic next-session brief as Markdown.
3. Print only the scoped next-session run sheet, including objective, stakes, callbacks, cast, faction consequence, and five scene beats without app navigation or campaign-management chrome.

The closeout also offers two secondary actions to copy or download a content-free checkpoint receipt. That receipt is built by `campaign-workspace-return-loop.js` and stored under `loot-table-works:campaign-workspace:return-loop:v1`, separate from the primary campaign and backup keys. Its exact bounded fields are a random receipt ID, producer class, route attribution, completion booleans, session count, approved product IDs, and a coarse age bucket. It excludes campaign and player names; campaign, workspace, player, entity, transaction, event, mapping, source, and device IDs; campaign prose; save contents; hashes; exact timestamps; credentials; and recovery data.

The module records campaign start/import, committed session count, portable export, next-session copy or print, explicit separate-session return, and the one recommended or clicked approved product locally. No event is sent in the background. Copying or downloading a receipt is always user-controlled. This optional local receipt is not proof of play, return, demand, a paid visit, purchase, or revenue, and it is never sent automatically.

A return cannot be confirmed in the same page session or on the milestone's local calendar creation day. A page-session nonce is kept in `sessionStorage`, so reloading the same tab does not manufacture a return. If session storage is unavailable, this local checkpoint gate fails closed. On a later local calendar date, the user must open a new tab or browser session and check the explicit confirmation before the local receipt changes. Changing the device time zone can change this coarse local-day boundary, so the checkpoint remains supporting evidence rather than verified retention.

Both supported Campaign Start fixtures normalize Campaign Launchpad workflow data and One-Shot Forge opening-session data into the same validated v1 document. Because that document does not preserve which tool initiated the export, the receipt uses the truthful bounded producer class `campaign_launchpad` for either Campaign Start fixture rather than inventing a One-Shot-specific origin.

The recommendation is intentionally secondary to preservation and preparation. The GM closeout presents exactly one product, Gullwatch Aftermath, regardless of the recorded target kind. Generic encounter, quest, and enemy-loot data kits remain available in the separate source-kit/developer path but cannot appear in this GM recommendation slot.

`campaign-workspace-offer-manifest.js` owns the commercial gate. Its default `closed` state contains no storefront URL and resolves the CTA to the owned public Aftermath preview with the existing Campaign Workspace UTM contract. A later release may set `storefront_gate` to `public` and supply one query-free HTTPS project URL on `loot-table-works.itch.io`; only that validated state resolves the exact `Get Gullwatch Aftermath - $3` CTA and permits a local paid-handoff milestone. Query-bearing, credential-bearing, fragment-bearing, non-Loot-Table-Works, and private/draft/secret-looking storefront paths are rejected. The release process must independently verify that the supplied project is public before changing the manifest.

The CTA remains withheld until the current closeout records both a portable campaign export and a next-session copy or print action. A later session commit resets those two prerequisites. The closed state never exposes an itch.io URL, and neither state links to a bundle.

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

The build writes `machines/machine-005/dist/campaign-workspace-static-site-v1-3-0.zip` and the matching GitHub Pages directory. It does not deploy or publish.
