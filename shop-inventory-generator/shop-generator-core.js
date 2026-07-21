(function attachShopGenerator(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ShopGenerator = api;
})(typeof window !== "undefined" ? window : globalThis, function createShopGenerator() {
  const MARKET_MODES = {
    stable: { label: "Stable trade", price: 1, quantity: 1 },
    scarce: { label: "Scarce supply", price: 1.25, quantity: 0.6 },
    festival: { label: "Festival demand", price: 1.1, quantity: 1.4 },
    surplus: { label: "Market surplus", price: 0.85, quantity: 1.7 },
    wartime: { label: "Wartime pressure", price: 1.3, quantity: 0.75 }
  };

  function hashSeed(value) {
    let hash = 2166136261;
    const text = String(value || "shop-seed");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRandom(seed) {
    let state = hashSeed(seed);
    return function random() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function normalizeConfig(config, data) {
    const shopTypes = [...new Set(data.templates.map((template) => template.shop_type))];
    return {
      seed: String(config.seed || "breakwater-17").trim().slice(0, 64) || "breakwater-17",
      shopType: shopTypes.includes(config.shopType) ? config.shopType : shopTypes[0],
      tier: clamp(Math.round(Number(config.tier) || 1), 1, 5),
      market: MARKET_MODES[config.market] ? config.market : "stable",
      slots: clamp(Math.round(Number(config.slots) || 8), 5, 12)
    };
  }

  function weightedOrder(items, random) {
    return items
      .map((item) => {
        const weight = Math.max(1, item.restock_weight || 1);
        const score = -Math.log(Math.max(Number.EPSILON, random())) / weight;
        return { item, score };
      })
      .sort((left, right) => left.score - right.score)
      .map((entry) => entry.item);
  }

  function generateShop(config, data) {
    if (!data || !Array.isArray(data.templates) || !Array.isArray(data.items)) {
      throw new Error("Shop generator data is unavailable.");
    }

    const normalized = normalizeConfig(config, data);
    const random = createRandom(`${normalized.seed}|${normalized.shopType}|${normalized.tier}|${normalized.market}|${normalized.slots}`);
    const market = MARKET_MODES[normalized.market];
    const template = data.templates.find((candidate) => candidate.shop_type === normalized.shopType && candidate.tier === normalized.tier);
    if (!template) throw new Error("No merchant template matches the selected shop type and tier.");

    const preferred = data.items.filter((item) => item.shop_types.includes(normalized.shopType) && item.item_tier <= normalized.tier + 1);
    const fallback = data.items.filter((item) => item.item_tier <= normalized.tier + 1);
    const ordered = weightedOrder(preferred.length >= normalized.slots ? preferred : fallback, random);
    const inventory = ordered.slice(0, normalized.slots).map((item, index) => {
      const demand = 0.92 + random() * 0.18;
      const shopPrice = Math.max(1, Math.round(item.catalog_value * template.markup_multiplier * market.price * demand));
      const quantity = Math.max(1, Math.round(item.base_quantity * market.quantity * (0.75 + random() * 0.5)));
      return {
        stock_id: `generated-${String(index + 1).padStart(2, "0")}`,
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        rarity: item.rarity,
        item_tier: item.item_tier,
        quantity,
        shop_price: shopPrice,
        buyback_price: Math.max(1, Math.round(shopPrice * template.buyback_rate)),
        featured: index < 2
      };
    });

    const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const averagePrice = Math.round(inventory.reduce((sum, item) => sum + item.shop_price, 0) / inventory.length);
    return {
      schema_version: "1.0.0",
      generator: "Loot Table Works Free Shop Inventory Generator",
      seed: normalized.seed,
      signature: hashSeed(`${normalized.seed}|${normalized.shopType}|${normalized.tier}`).toString(16).padStart(8, "0"),
      market: { key: normalized.market, label: market.label },
      merchant: {
        shop_name: template.shop_name,
        proprietor: template.proprietor,
        shop_type: template.shop_type,
        region: template.region,
        tier: template.tier,
        customer_profile: template.customer_profile,
        stock_policy: template.stock_policy,
        negotiation_style: template.negotiation_style,
        restock_schedule: template.restock_schedule
      },
      summary: {
        inventory_slots: inventory.length,
        total_units: totalUnits,
        average_shop_price: averagePrice,
        featured_items: inventory.filter((item) => item.featured).length
      },
      inventory
    };
  }

  function toCsv(shop) {
    const columns = ["stock_id", "item_id", "item_name", "category", "rarity", "item_tier", "quantity", "shop_price", "buyback_price", "featured"];
    const escape = (value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return [columns.join(","), ...shop.inventory.map((item) => columns.map((column) => escape(item[column])).join(","))].join("\n");
  }

  return { MARKET_MODES, createRandom, generateShop, hashSeed, normalizeConfig, toCsv };
});
