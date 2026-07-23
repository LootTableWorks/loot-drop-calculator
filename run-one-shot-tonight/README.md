# Run a One-Shot Tonight

Search-focused, system-neutral GM field guide for the verified Loot Table Works flagship workflow:

1. choose one urgent promise;
2. prepare only reachable material;
3. start at the point of pressure;
4. record the ending as facts; and
5. prepare the next session from consequences.

The page routes readers to the complete free Gullwatch Beacon kit, One-Shot Forge, Campaign Workspace, and three already-public $3 contextual modules. It contains no background analytics, hosted runtime dependency, bundle link, or third-party compatibility claim.

## Validate

```powershell
node test/guide.test.js
node scripts/validate.js
```

## Build

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
```

The build stages the reviewed source into `../dist/github-pages-root/run-one-shot-tonight/`. Publication is controlled by `release-approval.json`, the quality packet, and the live deployment workflow.
