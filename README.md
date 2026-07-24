# Loot Table Works: Play Tonight, Continue Next Week

Create a system-neutral fantasy one-shot, run it, record what changed, and prepare the next session from the same coherent world. The flagship workflow is free, local-first, and works without an account or hosted AI service.

[Run a one-shot tonight](https://loottableworks.github.io/loot-drop-calculator/run-one-shot-tonight/) · [Open Campaign Workspace](https://loottableworks.github.io/loot-drop-calculator/campaign-workspace/?view=field-test&utm_source=github&utm_medium=repository&utm_campaign=wf4w_revenue_v1&utm_content=readme_flagship) · [Download Gullwatch Beacon](https://loot-table-works.itch.io/gullwatch-beacon-play-tonight-kit?utm_source=github&utm_medium=repository&utm_campaign=wf4w_revenue_v1&utm_content=readme_gullwatch) · [Browse all free RPG tools](https://loottableworks.github.io/loot-drop-calculator/free-rpg-tools/)

![Gullwatch Beacon free Play Tonight Kit cover](campaign-workspace/assets/gullwatch-beacon-cover-v1.png)

## The Free Flagship Workflow

1. **Create tonight's adventure.** Use [One-Shot Forge](https://loottableworks.github.io/loot-drop-calculator/one-shot-forge/) or start with the complete [Gullwatch Beacon kit](https://loottableworks.github.io/loot-drop-calculator/gullwatch-beacon/).
2. **Run it with usable table material.** Gullwatch includes an adventure, GM run sheet, player and GM maps, six VTT tokens, printable tokens, and three handouts.
3. **Record what changed.** [Campaign Workspace](https://loottableworks.github.io/loot-drop-calculator/campaign-workspace/) preserves outcomes, unresolved choices, clocks, factions, clues, and location changes in a portable local save.
4. **Continue next week.** Generate a next-session brief from the same campaign state, then export JSON or Markdown without creating an account.

The voluntary [ten-minute GM field test](https://loottableworks.github.io/loot-drop-calculator/campaign-workspace/?view=field-test&utm_source=github&utm_medium=repository&utm_campaign=wf4w_revenue_v1&utm_content=readme_field_test) reports only when the tester explicitly copies or emails the result. It has no background analytics or campaign-data upload. Testers with a GitHub account can instead submit a [structured public field-test report](https://github.com/LootTableWorks/loot-drop-calculator/issues/new?template=campaign-workspace-field-test.yml); the report and the tester's GitHub username and profile are public, while the form disables attachments and prohibits private campaign data.

## Free Browser Tools

| Tool | Use it for |
|---|---|
| [Campaign Workspace](https://loottableworks.github.io/loot-drop-calculator/campaign-workspace/) | Import a Campaign Start, run Gullwatch, record outcomes and faction pressure, recover local saves, and prepare the next session. |
| [Campaign Launchpad](https://loottableworks.github.io/loot-drop-calculator/campaign-launchpad/) | Route one shared seed through a world, linked party, one-shot, campaign arc, and player chronicle, then see three contextual production-data recommendations. |
| [Loot Drop Probability Calculator](https://loottableworks.github.io/loot-drop-calculator/) | Calculate independent drop odds, expected rewards, and attempts needed for a target confidence. |
| [Fantasy Shop Inventory Generator](https://loottableworks.github.io/loot-drop-calculator/shop-inventory-generator/) | Generate deterministic shop stock, prices, shareable configurations, JSON, and CSV. |
| [World Seed Studio](https://loottableworks.github.io/loot-drop-calculator/world-seed-studio/) | Assemble dependency-closed regions, economies, quest arcs, and encounter loops. |
| [RPG Game Data Doctor](https://loottableworks.github.io/loot-drop-calculator/rpg-data-doctor/) | Audit JSON and CSV for duplicate IDs, missing references, broken weights, economy loops, quest gaps, and encounter transitions. |
| [RPG Data Bridge](https://loottableworks.github.io/loot-drop-calculator/rpg-data-bridge/) | Convert inspected JSON or CSV schemas into Unity C#, Godot 4 GDScript, and TypeScript starter models. |
| [One-Shot Forge](https://loottableworks.github.io/loot-drop-calculator/one-shot-forge/) | Generate a deterministic five-scene adventure, scaled opposition, fail-forward clues, and a ready-to-play pregenerated party. |
| [Character Foundry](https://loottableworks.github.io/loot-drop-calculator/character-foundry/) | Forge a deterministic 3-6 character party with complete dossiers, campaign stakes, bonds, repair prompts, and session-zero support. |
| [Campaign Arc Forge](https://loottableworks.github.io/loot-drop-calculator/campaign-arc-forge/) | Build a deterministic 3, 6, or 9-session arc with faction clocks, character stakes, playable decisions, tracked consequences, and Markdown or JSON export. |
| [Player Chronicle](https://loottableworks.github.io/loot-drop-calculator/player-chronicle/) | Carry one character through 12 sessions with consequences, downtime, evolving bonds, private notes, next-session intentions, and portable JSON or Markdown export. |

All tools run in the browser without an account. Imported data is not uploaded or analyzed remotely. Campaign Workspace can deliberately preserve a local two-slot recovery journal; portable exports remain under the user's control.

## Integration Guides

The public guide cluster covers RPG JSON schema design, Unity JsonUtility imports, Godot 4 Resource imports, TypeScript data models, loot-table validation, and game-economy integration. Each article includes original examples, relevant free-tool workflows, and links only to the six verified public standalone modules.

## Original `$3` Data Modules

The paid modules contain structured production data, offline workflow tools, documented schemas, free demos, and engine integration starters. Each module is sold independently for `$3` on [itch.io](https://loot-table-works.itch.io/).

| Module | Production boundary |
|---|---|
| [Item Catalog & Economy Kit](https://loot-table-works.itch.io/original-fantasy-item-data-pack) | 500 stable item records |
| [Merchant & Shop Kit](https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit) | 150 merchants and 1,500 stock relationships |
| [Crafting & Recipe Kit](https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit) | 300 recipes and 900 ingredient relationships |
| [Enemy Loot & Reward Kit](https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit) | 250 profiles and 2,000 reward records |
| [Quest, Contract & Reward Kit](https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit) | 240 quests arranged into 40 connected arcs |
| [Encounter & Threat Kit](https://loot-table-works.itch.io/fantasy-encounter-room-data-kit) | 180 encounters and 540 phases |

## Data Principles

- Stable IDs are durable integration keys; names are presentation labels.
- References must resolve across the selected data boundary.
- Random generation is deterministic when a seed is supplied.
- JSON and CSV exports remain inspectable without proprietary software.
- Free demos disclose their exact record boundaries.
- Generated content is reviewed with automated integrity, reference, packaging, runtime, and visual checks.

## Content Disclosure

Loot Table Works products contain original AI-assisted structured data, text, code, and marketing artwork. They do not include copyrighted characters, branded settings, protected game text, or rules-specific content from another publisher.

This repository hosts the public static tools. Individual product archives and their commercial-use terms are distributed through their verified itch.io pages.
