# World Foundry Field Guide & Catalog

Status: `approved_for_deployment`

A dependency-free static learning and catalog hub for Loot Table Works / World Foundry. It provides:

- one first-viewport index to the three public free utilities;
- a six-module standalone catalog with placement-specific campaign attribution;
- substantive guides to dependency-closed world seeds and merchant economies;
- canonical, Open Graph, X card, JSON-LD, sitemap, and crawl metadata;
- a copied, reviewed World Seed Studio v2 screenshot;
- deterministic file hashing and archive validation.

Reviewed public path after approval: `https://loottableworks.github.io/loot-drop-calculator/world-foundry/`.

The source and build output intentionally contain no gated destination. The generated manifest records the completed content, destination, desktop, and mobile review; deployment remains a separate, exact-file operation.

## Validate

```powershell
node --test test/hub.test.js
node scripts/validate.js
```

## Build deployment archive

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build.ps1
```

The build writes only to `dist/` inside this project and creates `world-foundry-hub-static-site-v1.zip`. It does not deploy or publish.
