# Example Uses

## Random Loot Table

Roll 1d10 and select from `source_table = starter-pack-01`.

| Roll | Use |
|---:|---|
| 1-3 | Common shop inventory |
| 4-6 | Travel reward |
| 7-8 | Quest clue |
| 9 | Rare discovery |
| 10 | Item with a complication |

## Shop Filter

For a low-tier settlement shop:

- Include `tier = 1` or `tier = 2`.
- Prefer `rarity = common` and `rarity = uncommon`.
- Exclude `category = relic` unless the shop has a story reason.

## Crafting Filter

For crafting components:

- Include `category = material`.
- Sort by `value`.
- Use `tags` to group trade goods and components.

## Design Notes

- All item names and descriptions are original draft content.
- The pack is system-neutral and does not assume a specific rule set.
- Values and weights are placeholders for game balancing, not real-world pricing.

