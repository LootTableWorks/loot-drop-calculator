# Free RPG Tools Directory

Status: `approved_public_release`

A dependency-free acquisition and navigation page for the eight public Loot Table Works browser tools. The page routes visitors by outcome rather than presenting an undifferentiated list:

- plan a campaign arc, prepare a complete one-shot, and build a linked party;
- assemble a coherent world and shop economy;
- validate and bridge RPG game data;
- calculate exact loot probabilities.

The directory exposes exactly eight public free-tool destinations and six verified `$3` standalone destinations. It contains no bundle, private, draft, account, analytics, or runtime API dependency.

## Build

Run `powershell -ExecutionPolicy Bypass -File scripts/build.ps1` from this directory. The build writes only inside this project and creates `dist/free-rpg-tools-static-site-v1.zip`. It does not publish.
