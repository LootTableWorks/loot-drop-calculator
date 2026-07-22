# Player Chronicle

Player Chronicle is a local-first, system-neutral TTRPG player journal. It turns each session into a structured consequence, downtime action, relationship change, and next-session intention while retaining closed references to the World Foundry sample graph.

## Run

Open `index.html` after running the data build, or serve the repository root with any static server.

```powershell
node scripts/build-data.js
node test/player-chronicle-core.test.js
```

## Data contract

- One generated character or one imported Character Foundry party member
- Up to 12 immutable session entries
- Five session focuses, three outcomes, and five downtime modes
- Momentum, strain, bond, and reputation tracks
- Portable JSON import/export and Markdown export
- Stable-ID references against the 74-entity / 199-relationship Coastal Starter graph
- Six attributed links to the paid World Foundry modules

The browser app does not use accounts, analytics, local storage, hosted AI, or runtime network dependencies.
