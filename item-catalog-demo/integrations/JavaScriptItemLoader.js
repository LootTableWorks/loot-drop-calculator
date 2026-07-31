export async function loadItems(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not load item database: " + response.status);
  }

  const items = await response.json();
  if (!Array.isArray(items)) {
    throw new Error("Expected a top-level JSON array.");
  }
  if (items.some((item) => item.schema_version && item.schema_version !== "2.0.0")) {
    throw new Error("This loader expects item schema 2.0.0.");
  }
  return items;
}

export function indexById(items) {
  return new Map(items.map((item) => [item.id, item]));
}

export function filterItems(items, filters = {}) {
  return items.filter((item) =>
    Object.entries(filters).every(([key, value]) => !value || String(item[key]) === String(value))
  );
}

export function randomItem(items) {
  return items.length ? items[Math.floor(Math.random() * items.length)] : null;
}

export function filterByCraftingRole(items, role) {
  return items.filter((item) => (item.crafting_roles || []).includes(role));
}

export function groupByFamily(items) {
  return items.reduce((groups, item) => {
    const family = item.family_id || "unassigned";
    if (!groups.has(family)) groups.set(family, []);
    groups.get(family).push(item);
    return groups;
  }, new Map());
}

// Node.js example:
// const fs = require("fs");
// const items = JSON.parse(fs.readFileSync("./items-premium.json", "utf8"));
