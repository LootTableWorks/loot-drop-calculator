# Loot Table Works Integration Guides

This project is a dependency-free static SEO guide cluster for RPG data implementation. It contains one index page and six original technical guides:

1. RPG JSON schema design
2. Unity JsonUtility stable-ID import
3. Godot 4 Resource data import
4. TypeScript RPG data models
5. Loot table validation
6. Game economy and shop data integration

## Commercial boundary

Every guide links to relevant free Loot Table Works tools and exactly the six already-public `$3` standalone modules. Each outbound placement has unique `utm_source=integration_guides`, `utm_medium=seo_guide`, page-level campaign, and placement content attribution. No bundle, private, preview, or unpublished product destination is present.

## Privacy and runtime

The release is plain HTML and CSS. It has no external runtime dependency, network request code, analytics, cookies, local storage, session storage, or indexed database use. Brand images are packaged locally.

## Quality and release authority

Release authority is `delegated_internal_aaa_qa`. Routine owner review is not required after the complete automated and browser QA gate passes. Version `1.0.1` records the cluster's current public state: publication, deployment, and published status are enabled, and the canonical public files must match the release manifest.

Every public article includes canonical and indexable metadata, TechArticle JSON-LD, responsive navigation, schema and code examples, contextual free-tool links, exactly six public standalone offers, internal related-guide links, and an AI-assisted content disclosure.

## Validation

From this directory:

```powershell
node --test test\guides.test.js
node scripts\validate.js
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build.ps1
```

The build writes only to `dist/` inside this project. It creates `dist/site/`, a hashed `MANIFEST.json`, and `dist/loot-table-works-integration-guides-v1-0-1.zip` with sorted entries and a fixed UTC timestamp. It validates the archive after creation; deployment remains a separate reviewed operation.

## Intended public path

`https://loottableworks.github.io/loot-drop-calculator/integration-guides/`
