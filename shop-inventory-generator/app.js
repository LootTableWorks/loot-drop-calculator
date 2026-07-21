const data = window.ShopGeneratorData;
const controls = {
  seed: document.querySelector("#seed"),
  shopType: document.querySelector("#shop-type"),
  tier: document.querySelector("#tier"),
  market: document.querySelector("#market"),
  slots: document.querySelector("#slots")
};
const tierOutput = document.querySelector("#tier-output");
const toast = document.querySelector("#toast");
let currentShop;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function titleCase(value) {
  return String(value).replace(/(^|[-_ ])([a-z])/g, (_, prefix, character) => `${prefix === "-" || prefix === "_" ? " " : prefix}${character.toUpperCase()}`);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 1400);
}

function readConfig() {
  return {
    seed: controls.seed.value,
    shopType: controls.shopType.value,
    tier: controls.tier.value,
    market: controls.market.value,
    slots: controls.slots.value
  };
}

function updateUrl(config) {
  const params = new URLSearchParams({
    seed: config.seed,
    type: config.shopType,
    tier: String(config.tier),
    market: config.market,
    slots: String(config.slots)
  });
  window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
}

function applyUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("seed")) controls.seed.value = params.get("seed").slice(0, 64);
  if (params.has("type") && [...controls.shopType.options].some((option) => option.value === params.get("type"))) controls.shopType.value = params.get("type");
  if (params.has("tier")) controls.tier.value = Math.min(5, Math.max(1, Number(params.get("tier")) || 2));
  if (params.has("market") && window.ShopGenerator.MARKET_MODES[params.get("market")]) controls.market.value = params.get("market");
  if (params.has("slots")) controls.slots.value = Math.min(12, Math.max(5, Number(params.get("slots")) || 8));
}

function render(shop) {
  currentShop = shop;
  tierOutput.textContent = shop.merchant.tier;
  document.querySelector("#shop-name").textContent = shop.merchant.shop_name;
  document.querySelector("#shop-meta").textContent = `${titleCase(shop.merchant.shop_type)} | ${titleCase(shop.merchant.region)} | Tier ${shop.merchant.tier} | ${shop.market.label} | Seed ${shop.seed} | ${shop.signature}`;
  document.querySelector("#proprietor").textContent = shop.merchant.proprietor;
  document.querySelector("#customers").textContent = shop.merchant.customer_profile;
  document.querySelector("#stock-policy").textContent = shop.merchant.stock_policy;
  document.querySelector("#negotiation").textContent = shop.merchant.negotiation_style;

  document.querySelector("#stats").innerHTML = [
    [shop.summary.inventory_slots, "Inventory slots"],
    [shop.summary.total_units, "Total units"],
    [shop.summary.average_shop_price, "Average price"],
    [shop.merchant.restock_schedule, "Restock"]
  ].map(([value, label]) => `<div class="stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("");

  document.querySelector("#inventory-rows").innerHTML = shop.inventory.map((item) => `
    <tr>
      <td><strong>${escapeHtml(item.item_name)}</strong>${item.featured ? '<small class="featured">Featured</small>' : ""}</td>
      <td><code>${escapeHtml(item.item_id)}</code></td>
      <td>${escapeHtml(titleCase(item.category))}</td>
      <td><span class="rarity rarity-${escapeHtml(item.rarity)}">${escapeHtml(titleCase(item.rarity))}</span></td>
      <td>${item.quantity}</td>
      <td>${item.shop_price}</td>
      <td>${item.buyback_price}</td>
    </tr>`).join("");
  document.querySelector("#json-output").textContent = JSON.stringify(shop, null, 2);
  updateUrl(readConfig());
}

function generate() {
  render(window.ShopGenerator.generateShop(readConfig(), data));
}

function download(filename, type, contents) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([contents], { type }));
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

for (const shopType of [...new Set(data.templates.map((template) => template.shop_type))]) {
  controls.shopType.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(shopType)}">${escapeHtml(titleCase(shopType))}</option>`);
}
applyUrl();

controls.tier.addEventListener("input", () => { tierOutput.textContent = controls.tier.value; });
document.querySelector("#generate").addEventListener("click", generate);
document.querySelector("#new-seed").addEventListener("click", () => {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  controls.seed.value = `shop-${values[0].toString(36)}`;
  generate();
});
document.querySelector("#copy-link").addEventListener("click", async () => {
  await navigator.clipboard.writeText(window.location.href);
  showToast("Share link copied");
});
document.querySelector("#copy-json").addEventListener("click", async () => {
  await navigator.clipboard.writeText(JSON.stringify(currentShop, null, 2));
  showToast("JSON copied");
});
document.querySelector("#download-csv").addEventListener("click", () => {
  download(`shop-${currentShop.signature}.csv`, "text/csv;charset=utf-8", window.ShopGenerator.toCsv(currentShop));
  showToast("CSV downloaded");
});

for (const tab of document.querySelectorAll("[data-tab]")) {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("active", button === tab));
    document.querySelector("#inventory-panel").hidden = tab.dataset.tab !== "inventory";
    document.querySelector("#json-panel").hidden = tab.dataset.tab !== "json";
  });
}

generate();
