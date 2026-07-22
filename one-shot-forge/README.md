# One-Shot Forge

One-Shot Forge is a local-first, system-neutral fantasy adventure generator built on the validated World Foundry coastal sample graph.

Each seed generates:

- a five-scene run sheet with an exact two-, three-, or four-hour budget;
- four fail-forward clues and a four- to six-segment pressure clock;
- opposition scaled for three to six players;
- three to six linked pregenerated character dossiers;
- a stable reference ledger with zero unresolved source IDs;
- shareable URL state, printable output, Markdown copy, and JSON download.

The runtime uses no login, analytics, remote API, external library, or persistent storage. Product links point only to the six public $3 standalone modules and include campaign attribution. No bundle or private-offer destination is exposed.

## Build

Run `powershell -ExecutionPolicy Bypass -File scripts/build.ps1` from this directory. The build writes only inside `machines/machine-005/dist/` and creates `one-shot-forge-static-site-v1.zip`. It does not deploy or publish.
