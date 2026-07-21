# RPG Game Data Doctor

Status: `approved_for_deployment`

RPG Game Data Doctor is a static, no-login utility for auditing common RPG JSON and CSV structures. Imported text stays in the current browser tab. The runtime has no network requests, external libraries, analytics, persistent storage, or raw-HTML rendering path.

## Audit coverage

- JSON and RFC-style CSV parsing with a strict 5,000,000-byte cap
- Common record and nested-array detection
- Duplicate primary IDs and unresolved `*_id` / `*_ids` references
- Invalid values and normalization drift in probability or reward-weight pools
- Likely buy/sell price inversions
- Recipe ingredient, quantity, output, and output-reference gaps
- Quest endpoint and reward gaps
- Encounter transition reference gaps
- Severity/category/search filters and portable text-report export

The included sample is original Loot Table Works content created specifically to exercise every audit family. This focused structural audit does not replace a project's own schemas, engine tests, balance review, accessibility review, or editorial review.

## Conversion boundary

Recommendations are generated only from finding categories present in the current audit. The catalog contains exactly six already-public `$3` Loot Table Works standalone modules. Each results card and report link uses `utm_source=rpg_data_doctor`, `utm_medium=free_tool`, and a module-specific placement value. An attributed handoff routes audited data into RPG Data Bridge for engine-model generation. No gated or draft destination is present.

## Build and review

Run `scripts/build.ps1` in PowerShell. The build stays inside this folder, runs the focused Node tests and source validator, copies the static runtime to `dist/site`, creates a SHA-256 manifest, archives the review candidate, and validates every archived byte.

The generated manifest records the completed code, privacy, destination, desktop, and mobile review. Deployment remains a separate exact-file operation with a post-launch round-trip check.
