export type ItemState = "raw" | "refined" | "component" | "finished" | "consumable" | "key-item";
export type ItemBiome = "coastal" | "forest" | "highland" | "marsh" | "desert" | "tundra" | "ruins" | "urban" | "river" | "underground";

export interface WorldFoundryItem {
  schema_version: "2.0.0";
  id: string;
  family_id: string;
  name: string;
  category: string;
  object_type: string;
  rarity: "common" | "uncommon" | "rare" | "epic";
  tier: number;
  biome: ItemBiome;
  faction_affinity: string;
  state: ItemState;
  composition: string[];
  material_class: string;
  crafting_roles: string[];
  compatible_disciplines: string[];
  durability_class: string;
  weight_class: string;
  function: string;
  mechanical_hook: string;
  trade_use: string;
  quest_use: string;
  visual_identity: string;
  drawback: string;
  salvage_outputs: string[];
  tags: string[];
  base_value: number;
  scarcity_multiplier: number;
  suggested_value: number;
  stack_limit: number;
  tone: string;
}

export const indexItems = (items: WorldFoundryItem[]) => new Map(items.map((item) => [item.id, item]));
export const filterItems = (items: WorldFoundryItem[], biome = "", maximumTier = 5, category = "") => items.filter((item) => (!biome || item.biome === biome) && item.tier <= maximumTier && (!category || item.category === category));
export const craftingItems = (items: WorldFoundryItem[], role = "") => items.filter((item) => !item.crafting_roles.includes("none") && (!role || item.crafting_roles.includes(role)));
