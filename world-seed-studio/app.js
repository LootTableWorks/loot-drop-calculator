(function startWorldSeedStudio() {
  "use strict";

  const core = window.WorldSeedCore;
  const source = window.WorldSeedSource;
  const labels = {
    items: "Items",
    merchants: "Merchants",
    recipes: "Recipes",
    quests: "Quests",
    locations: "Locations",
    loot_profiles: "Loot",
    encounters: "Encounters"
  };
  const state = { audience: "developer", scale: "district", activeTab: "brief", activePreset: null, world: null };
  const attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  const initialSearchParams = new URLSearchParams(window.location.search);
  const attribution = new Map(attributionKeys
    .map((key) => [key, initialSearchParams.get(key)])
    .filter(([, value]) => value)
    .map(([key, value]) => [key, value.slice(0, 128)]));
  const elements = {
    seed: document.querySelector("#seed"),
    tier: document.querySelector("#tier"),
    tierOutput: document.querySelector("#tier-output"),
    modules: document.querySelector("#module-controls"),
    title: document.querySelector("#world-title"),
    meta: document.querySelector("#world-meta"),
    validity: document.querySelector("#validity"),
    validityDot: document.querySelector("#validity-dot"),
    stats: document.querySelector("#stats"),
    markers: document.querySelector("#map-markers"),
    mapCaption: document.querySelector("#map-caption"),
    mapClosure: document.querySelector("#map-closure"),
    inspectorType: document.querySelector("#inspector-type"),
    inspectorTitle: document.querySelector("#inspector-title"),
    inspectorDescription: document.querySelector("#inspector-description"),
    inspectorFields: document.querySelector("#inspector-fields"),
    briefPanel: document.querySelector("#brief-panel"),
    recordsPanel: document.querySelector("#records-panel"),
    relationshipsPanel: document.querySelector("#relationships-panel"),
    jsonOutput: document.querySelector("#json-output"),
    quickOfferTitle: document.querySelector("#quick-offer-title"),
    quickOfferProof: document.querySelector("#quick-offer-proof"),
    quickOfferLink: document.querySelector("#quick-offer-link"),
    recommendationSummary: document.querySelector("#recommendation-summary"),
    recommendationGrid: document.querySelector("#recommendation-grid"),
    moduleCatalog: document.querySelector("#module-catalog"),
    toast: document.querySelector("#toast")
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function selectedModules() {
    return [...elements.modules.querySelectorAll("input:checked")].map((input) => input.value);
  }

  function activePresetId() {
    const selected = selectedModules();
    return Object.entries(core.PRESETS).find(([, preset]) => preset.modules.length === selected.length && preset.modules.every((moduleId) => selected.includes(moduleId)))?.[0] || null;
  }

  function syncPresetSelection() {
    state.activePreset = activePresetId();
    document.querySelectorAll("#preset-control button").forEach((button) => {
      const selected = button.dataset.preset === state.activePreset;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function trackedProductUrl(product, placement) {
    const url = new URL(product.url);
    url.searchParams.set("utm_source", "world_seed_studio");
    url.searchParams.set("utm_medium", "free_tool");
    url.searchParams.set("utm_campaign", "world_foundry_traffic_test");
    url.searchParams.set("utm_content", `${product.id}_${placement}`);
    return url.toString();
  }

  function downloadText(contents, type, filename) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => elements.toast.classList.remove("visible"), 1800);
  }

  function writeUrl() {
    const params = new URLSearchParams({
      seed: elements.seed.value.trim(),
      scale: state.scale,
      tier: elements.tier.value,
      view: state.audience,
      modules: selectedModules().join(",")
    });
    attribution.forEach((value, key) => params.set(key, value));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  function loadUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("seed")) elements.seed.value = params.get("seed").slice(0, 64);
    if (["outpost", "district", "region"].includes(params.get("scale"))) state.scale = params.get("scale");
    if (["developer", "gm"].includes(params.get("view"))) state.audience = params.get("view");
    const tier = Number(params.get("tier"));
    if (Number.isInteger(tier) && tier >= 1 && tier <= 5) elements.tier.value = String(tier);
    const modules = params.get("modules")?.split(",").filter((moduleId) => core.MODULES.includes(moduleId));
    if (modules?.length) {
      elements.modules.querySelectorAll("input").forEach((input) => { input.checked = modules.includes(input.value); });
    }
  }

  function descriptionFor(moduleId, record) {
    if (!record) return "No record resolved for this marker.";
    if (moduleId === "quests") return record.summary || record.objective || record.complication || "A staged quest connected to canonical world records.";
    if (moduleId === "encounters") return record.setup || record.objective || record.description || "A staged encounter with linked objectives and rewards.";
    if (moduleId === "merchants") return record.description || record.shop_description || record.specialty || "A regional merchant with validated stock relationships.";
    if (moduleId === "locations") return record.description || record.local_hazard || "A stable location in the coastal relationship graph.";
    return record.short_description || record.table_description || record.description || "A canonical World Foundry record.";
  }

  function inspectRecord(id, typeLabel) {
    const match = core.findRecord(state.world, id);
    if (!match) return;
    const { module: moduleId, record } = match;
    const recordId = core.recordId(moduleId, record);
    const connected = state.world.relationships.edges.filter((edge) => edge.from === recordId || edge.to === recordId).length;
    elements.inspectorType.textContent = typeLabel || labels[moduleId];
    elements.inspectorTitle.textContent = core.recordName(record);
    elements.inspectorDescription.textContent = descriptionFor(moduleId, record);
    elements.inspectorFields.innerHTML = [
      ["Stable ID", recordId],
      ["System", labels[moduleId]],
      ["Tier", record.tier || "Derived"],
      ["Connections", connected]
    ].map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
    elements.markers.querySelectorAll("button").forEach((button) => button.classList.toggle("selected", button.dataset.id === id));
  }

  function renderStats() {
    elements.stats.innerHTML = core.MODULES.map((moduleId) => `
      <div class="stat">
        <strong>${state.world.counts[moduleId]}</strong>
        <span>${labels[moduleId]}</span>
      </div>`).join("");
  }

  function renderMarkers() {
    elements.markers.innerHTML = state.world.markers.map((marker, index) => `
      <button type="button" class="map-marker marker-${escapeHtml(marker.module)}${index === 0 ? " selected" : ""}" style="left:${marker.x}%;top:${marker.y}%" data-id="${escapeHtml(marker.id)}" aria-label="Inspect ${escapeHtml(marker.label)}">
        <span>${index + 1}</span>
        <small>${escapeHtml(marker.label)}</small>
      </button>`).join("");
    elements.markers.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => inspectRecord(button.dataset.id)));
    if (state.world.markers[0]) inspectRecord(state.world.markers[0].id, "Recommended start");
  }

  function renderBrief() {
    const world = state.world;
    const startLocation = core.findRecord(world, world.recommended_start.location_id)?.record;
    const startQuest = core.findRecord(world, world.recommended_start.quest_id)?.record;
    const startEncounter = core.findRecord(world, world.recommended_start.encounter_id)?.record;
    const merchant = world.data.merchants[0];
    if (state.audience === "developer") {
      elements.briefPanel.innerHTML = `
        <div class="brief-grid">
          <section><p class="section-label">Integration contract</p><h3>${world.relationships.nodes.length} closed entities</h3><p>${world.relationships.edges.length} relationships resolve inside this export with ${world.validation.missing_reference_count} missing endpoints.</p></section>
          <section><p class="section-label">Entry point</p><h3>${escapeHtml(world.recommended_start.quest_id || "No quest")}</h3><p>Load the JSON by stable ID, then traverse quest, location, encounter, merchant, item, recipe, and reward edges.</p></section>
          <section><p class="section-label">Build fingerprint</p><h3>${escapeHtml(world.assembly_id)}</h3><p>Seed, scale, tier, and requested systems reproduce this exact payload.</p></section>
        </div>`;
    } else {
      elements.briefPanel.innerHTML = `
        <div class="brief-grid">
          <section><p class="section-label">Start here</p><h3>${escapeHtml(core.recordName(startLocation || {}))}</h3><p>${escapeHtml(descriptionFor("locations", startLocation))}</p></section>
          <section><p class="section-label">First pressure</p><h3>${escapeHtml(core.recordName(startQuest || {}))}</h3><p>${escapeHtml(descriptionFor("quests", startQuest))}</p></section>
          <section><p class="section-label">Escalation</p><h3>${escapeHtml(core.recordName(startEncounter || merchant || {}))}</h3><p>${escapeHtml(descriptionFor(startEncounter ? "encounters" : "merchants", startEncounter || merchant))}</p></section>
        </div>`;
    }
  }

  function renderRecords() {
    const rows = [];
    for (const moduleId of core.MODULES) {
      state.world.data[moduleId].slice(0, 12).forEach((record) => rows.push({ moduleId, record }));
    }
    elements.recordsPanel.innerHTML = `
      <div class="table-wrap"><table><thead><tr><th>Record</th><th>System</th><th>Stable ID</th><th>Tier</th></tr></thead><tbody>
      ${rows.map(({ moduleId, record }) => `<tr><td>${escapeHtml(core.recordName(record))}</td><td>${labels[moduleId]}</td><td><code>${escapeHtml(core.recordId(moduleId, record))}</code></td><td>${escapeHtml(record.tier || "-")}</td></tr>`).join("")}
      </tbody></table></div>`;
  }

  function renderRelationships() {
    const nodeMap = new Map(state.world.relationships.nodes.map((node) => [node.id, node]));
    elements.relationshipsPanel.innerHTML = `<div class="relationship-list">${state.world.relationships.edges.slice(0, 60).map((edge) => `
      <div class="relationship-row">
        <span>${escapeHtml(nodeMap.get(edge.from)?.name || edge.from)}</span>
        <strong>${escapeHtml(edge.edge_type.replaceAll("_", " "))}</strong>
        <span>${escapeHtml(nodeMap.get(edge.to)?.name || edge.to)}</span>
      </div>`).join("")}</div>`;
  }

  function productLink(product, location) {
    return `<a class="product-link" href="${escapeHtml(trackedProductUrl(product, location))}" target="_blank" rel="noopener" data-product="${escapeHtml(product.id)}" data-placement="${escapeHtml(location)}" aria-label="Open ${escapeHtml(product.title)} for $3">Get ${escapeHtml(product.proof.toLowerCase())} - $3</a>`;
  }

  function renderRecommendations() {
    const products = core.recommendProducts(state.world.requested_modules, state.world.resolved_modules, 3);
    const presetLabel = state.activePreset ? core.PRESETS[state.activePreset].label : "custom workflow";
    elements.recommendationSummary.textContent = `Best matches for the ${presetLabel.toLowerCase()} selection. Every pack uses stable World Foundry IDs and includes offline tools plus JSON and CSV.`;
    elements.recommendationGrid.innerHTML = products.map((product) => `
      <article class="recommendation-card">
        <span class="product-proof">${escapeHtml(product.proof)}</span>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${escapeHtml(product.description)}</p>
        ${productLink(product, "recommended")}
      </article>`).join("");
    const quickProduct = products[0];
    elements.quickOfferTitle.textContent = quickProduct.title;
    elements.quickOfferProof.textContent = quickProduct.description;
    elements.quickOfferLink.textContent = `Get ${quickProduct.proof.toLowerCase()} - $3`;
    elements.quickOfferLink.href = trackedProductUrl(quickProduct, "quick_offer");
    elements.quickOfferLink.target = "_blank";
    elements.quickOfferLink.rel = "noopener";
  }

  function renderCatalog() {
    elements.moduleCatalog.innerHTML = core.PRODUCTS.map((product) => `
      <article class="catalog-row">
        <div><span class="product-proof">${escapeHtml(product.proof)}</span><h4>${escapeHtml(product.title)}</h4></div>
        <p>${escapeHtml(product.description)}</p>
        ${productLink(product, "catalog")}
      </article>`).join("");
  }

  function render() {
    const world = state.world;
    elements.title.textContent = world.title;
    elements.meta.textContent = `${world.assembly_id} | ${world.scale} | tier ${world.maximum_tier}`;
    elements.validity.textContent = world.validation.valid ? "Validated assembly" : "Validation failed";
    elements.validityDot.classList.toggle("invalid", !world.validation.valid);
    elements.mapCaption.textContent = `${world.scale.charAt(0).toUpperCase()}${world.scale.slice(1)} seed`;
    elements.mapClosure.textContent = `${world.validation.missing_reference_count} missing references`;
    renderStats();
    renderMarkers();
    renderBrief();
    renderRecords();
    renderRelationships();
    renderRecommendations();
    elements.jsonOutput.textContent = JSON.stringify(world, null, 2);
  }

  function generate() {
    const modules = selectedModules();
    if (!modules.length) {
      showToast("Select at least one system");
      return;
    }
    state.world = core.assemble({ seed: elements.seed.value, maximumTier: Number(elements.tier.value), scale: state.scale, modules }, source);
    elements.tierOutput.value = elements.tier.value;
    writeUrl();
    render();
  }

  function setSegment(containerSelector, dataName, value) {
    document.querySelectorAll(`${containerSelector} button`).forEach((button) => button.classList.toggle("selected", button.dataset[dataName] === value));
  }

  core.MODULES.forEach((moduleId) => {
    elements.modules.insertAdjacentHTML("beforeend", `<label><input type="checkbox" value="${moduleId}" checked><span>${labels[moduleId]}</span></label>`);
  });
  loadUrl();
  syncPresetSelection();
  setSegment("#audience-control", "audience", state.audience);
  setSegment("#scale-control", "scale", state.scale);
  elements.tierOutput.value = elements.tier.value;
  renderCatalog();

  document.querySelector("#generate").addEventListener("click", generate);
  document.querySelector("#random-seed").addEventListener("click", () => {
    elements.seed.value = `coast-${Math.random().toString(36).slice(2, 9)}`;
    generate();
  });
  document.querySelectorAll("#preset-control button").forEach((button) => button.addEventListener("click", () => {
    const preset = core.PRESETS[button.dataset.preset];
    elements.modules.querySelectorAll("input").forEach((input) => { input.checked = preset.modules.includes(input.value); });
    syncPresetSelection();
    generate();
  }));
  elements.modules.addEventListener("change", (event) => {
    if (!selectedModules().length) {
      event.target.checked = true;
      showToast("Keep at least one system selected");
    }
    syncPresetSelection();
    generate();
  });
  elements.tier.addEventListener("input", () => { elements.tierOutput.value = elements.tier.value; });
  document.querySelectorAll("#audience-control button").forEach((button) => button.addEventListener("click", () => {
    state.audience = button.dataset.audience;
    setSegment("#audience-control", "audience", state.audience);
    writeUrl();
    renderBrief();
  }));
  document.querySelectorAll("#scale-control button").forEach((button) => button.addEventListener("click", () => {
    state.scale = button.dataset.scale;
    setSegment("#scale-control", "scale", state.scale);
    generate();
  }));
  document.querySelectorAll(".result-tabs button").forEach((button) => button.addEventListener("click", () => {
    state.activeTab = button.dataset.tab;
    document.querySelectorAll(".result-tabs button").forEach((tab) => tab.classList.toggle("active", tab === button));
    document.querySelectorAll(".result-panel").forEach((panel) => { panel.hidden = panel.id !== `${state.activeTab}-panel`; });
  }));
  document.querySelector("#copy-link").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Share link copied");
    } catch {
      showToast("Copy unavailable in this browser");
    }
  });
  document.querySelector("#copy-brief").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(core.createGmBrief(state.world));
      showToast("GM brief copied");
    } catch {
      showToast("Copy unavailable in this browser");
    }
  });
  document.querySelector("#copy-json").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(state.world, null, 2));
      showToast("World JSON copied");
    } catch {
      showToast("Copy unavailable in this browser");
    }
  });
  document.querySelector("#download-json").addEventListener("click", () => {
    downloadText(JSON.stringify(state.world, null, 2), "application/json", `${state.world.assembly_id}.json`);
  });
  document.querySelector("#download-csv").addEventListener("click", () => {
    downloadText(core.worldToCsv(state.world), "text/csv;charset=utf-8", `${state.world.assembly_id}.csv`);
  });

  generate();
})();
