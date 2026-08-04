# Integration Quickstart

The pack is system-neutral. Start with item-explorer.html if you want to browse or export a smaller subset without writing code.

## Unity

Use integrations/UnityItemDatabase.cs as a starting point.

1. Place `items.json` in `Assets/Resources/`.
2. Add `UnityItemDatabase` to a GameObject.
3. Call `FindById`, `FindByCategory`, `FindByBiome`, `FindByCraftingRole`, or `RandomItem`.

Unity's built-in JSON utility does not accept a top-level array, so the example wraps the array before parsing it.

## Godot 4

Use integrations/GodotItemDatabase.gd.

1. Place the JSON file in the project, such as `res://data/items.json`.
2. Attach the script or autoload it.
3. Call load_items, then use find_by_id, filter_by_category, filter_by_biome, filter_by_crafting_role, or random_item.

## TypeScript, Browser, Or Node.js

Use `integrations/items.ts` for typed projects or `integrations/JavaScriptItemLoader.js` for plain JavaScript.

- In a browser project, fetch the JSON through your local development server.
- In Node.js, read and parse the file with the built-in fs module.

## Schema V2 And Migration

- Preserve `pitm-####` item IDs and `itm-fam-###` family IDs when adding local fields.
- The paid edition includes `migration-v1-to-v2.json` for updating saved v1 names and biome labels without breaking foreign keys. The free demo starts at schema v2 and does not include that migration file.
- Prefer `mechanical_hook`, `suggested_value`, and `weight_class`; `effect`, `value`, and numeric `weight` are compatibility aliases.
- Select recipe ingredients by `crafting_roles` and `compatible_disciplines`, not by noun or category alone.
- Economy values and mechanical hooks should be balanced for the target project.
- Validate edited JSON against schema.json.
