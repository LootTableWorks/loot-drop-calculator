# Character Foundry

Status: `approved_public_release`

Character Foundry is a local-first, system-neutral fantasy character and party generator built on the validated World Foundry coastal sample graph.

Each seed generates:

- three to six unique player-character dossiers;
- a coherent party frame, patron, home base, inciting contract, and first threat;
- source-linked signature items with stable IDs;
- pairwise bonds, tensions, and repair questions;
- session-zero safety and campaign prompts;
- three linked campaign threads;
- shareable URL state, printable output, Markdown copy, individual dossier copy, and JSON download.

The runtime uses no login, analytics, remote API, external library, or persistent storage. Product links point only to the six public $3 standalone modules and include campaign attribution. No gated or private destination is exposed.

## Build

Run `powershell -ExecutionPolicy Bypass -File scripts/build.ps1` from this directory. The build writes only inside `machines/machine-005/dist/` and creates `character-foundry-static-site-v1.zip`. It does not deploy or publish.
