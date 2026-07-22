# World Foundry Field Guide & Catalog

Status: `approved_for_deployment`

A dependency-free static learning and catalog hub for Loot Table Works / World Foundry. It provides:

- one first-viewport index to the six public free utilities, including a complete one-shot and pregenerated-party generator;
- a six-module standalone catalog with placement-specific campaign attribution;
- substantive guides to dependency-closed world seeds, merchant economies, and engine data contracts;
- canonical, Open Graph, X card, JSON-LD, sitemap, and crawl metadata;
- a copied, reviewed World Seed Studio v2 screenshot;
- deterministic file hashing and archive validation.

Reviewed public path after approval: `https://loottableworks.github.io/loot-drop-calculator/world-foundry/`.

The source and build output intentionally contain no gated destination. The generated manifest records the completed content and destination QA; deployment remains a separate, exact-file operation after internal desktop and mobile review.

## Validate

```powershell
node --test test/hub.test.js
node scripts/validate.js
```

## Build deployment archive

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build.ps1
```

The build writes only to `dist/` inside this project and creates `world-foundry-hub-static-site-v1-3.zip`. It does not deploy or publish.
