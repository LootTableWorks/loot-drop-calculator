# World Seed Studio

Status: `public_v2_approved`

A free, static, no-login discovery tool for Loot Table Works: World Foundry. It generates deterministic coastal world subsets from the isolated 74-entity, 199-relationship Starter dataset.

## Buyer path

1. Choose a full world, town economy, quest arc, encounter loop, or custom module mix.
2. Generate and inspect a dependency-closed world seed.
3. Copy the configuration URL or GM brief, then export the exact assembly as JSON or CSV.
4. Open a contextual recommendation or compare all six live standalone modules at `$3` each.

The public funnel contains no starter, bundle, collection, private-tool, or draft-listing link. Bundle publication remains controlled by the separate verified-sales gate.

## Build

Run `scripts/build.ps1` from PowerShell. The build embeds the current validated Starter source, runs deterministic and funnel-boundary tests, copies the static site under the existing GitHub Pages root, creates a SHA-256 manifest, and validates the release archive.

Public v2 deployment, the Item Catalog devlog, and the reviewed announcement copy were approved by the owner on 2026-07-21. Every remote file and outbound destination must still pass round-trip verification after deployment.
