# RPG Data Bridge

Status: `approved_for_public_release`

RPG Data Bridge is a static, local-only conversion utility for turning user-supplied JSON or RFC-style CSV into deterministic starter integration code. It generates TypeScript interfaces, Unity C# serializable classes with a JSON wrapper, and Godot 4 GDScript Resource classes.

## Conversion boundary

- Strict 5,000,000-byte UTF-8 input cap sized for current premium module exports
- Multiple top-level JSON collections and top-level arrays
- RFC-style CSV fields with quoted commas, escaped quotes, and embedded line breaks
- Conservative field inference across every record
- Nested object and array types
- Stable-ID detection and prominent generated comments
- Relationship-ID evidence and collection hints without inspecting or exporting record values
- Reserved, invalid, numeric, hostile, and colliding identifier sanitization
- Actionable warnings for null-only, mixed, missing, empty, skipped, or renamed schema elements
- Deterministic JSON mapping download for source fields, generated names, inferred target types, stable IDs, and relationship evidence

Imported source is parsed as inert text in the current tab. The app has no upload path, external runtime, analytics, login, persistent storage, `fetch`, XHR, WebSocket, or raw-HTML rendering path. Imported records are never executed.

Generated output is a starter integration layer, not a complete serializer or engine import pipeline. Unity `JsonUtility` users must normalize nullable primitives and mixed fields. Godot users must save each marked Resource section to its own script. TypeScript users must map sanitized property names when they differ from source keys. The deterministic mapping contains schema names and evidence only; imported record values are excluded from generated code comments and mapping metadata.

RPG Data Bridge is explicitly paired with RPG Game Data Doctor. Doctor checks structural integrity first; Bridge then carries stable IDs and relationship fields into TypeScript, Unity, or Godot models.

## Catalog boundary

The interface contains exactly six already-public `$3` Loot Table Works standalone module destinations. Each uses `utm_source=rpg_data_bridge`, `utm_medium=free_tool`, `utm_campaign=integration_code`, and a unique module placement. There are no bundle, draft, or private destinations. The live RPG Data Doctor handoff has separate bridge attribution.

## Build

Run `scripts/build.ps1` in PowerShell. The build stays inside this folder, runs the focused Node tests and source validator, copies the static runtime to `dist/site`, creates a SHA-256 manifest, writes a deterministic ZIP with fixed timestamps and sorted entries, and validates every archived byte.

The internal AAA gate covers source integrity, security, deterministic generation, destination accuracy, archive verification, generated-code checks, and desktop/mobile browser workflows. Public release authority is delegated after that gate passes.
