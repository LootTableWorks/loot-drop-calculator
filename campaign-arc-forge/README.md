# Campaign Arc Forge

Campaign Arc Forge is a free, deterministic, system-neutral campaign planner from Loot Table Works. It turns the validated Coastal Starter World Foundry graph into a coherent 3, 6, or 9-session arc with:

- three linked acts and explicit session handoffs;
- three faction fronts with live consequence clocks;
- three to six character stake slots;
- session-ready objectives, evidence, encounters, decisions, rewards, and outcomes;
- recorded clean-win, cost, and setback states;
- reproducible share URLs plus Markdown, JSON, and print export; and
- attributed paths to the six public $3 World Foundry modules.

The tool runs entirely in the browser. It has no account requirement, analytics dependency, external runtime, or private bundle destination.

## Build

Run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build.ps1` from this directory. The build validates the source graph, core behavior, runtime assets, conversion boundaries, archive manifest, and file hashes.

## Source Contract

The embedded source is `shared/world-foundry/assembler/output/coastal-starter-world.json`: 74 entities and 199 validated relationships. Generated references must close over this graph with zero missing IDs.
