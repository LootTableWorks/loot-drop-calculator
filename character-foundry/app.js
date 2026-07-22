(function startCharacterFoundry() {
  "use strict";

  const core = window.CharacterFoundryCore;
  const source = window.CharacterFoundrySource;
  const state = { campaignMode: "expedition", tone: "grounded", cohesion: "new_crew", activeTab: "overview", party: null };
  const productDescriptions = {
    items: "Expand signature gear, provenance clues, economy hooks, and item drawbacks.",
    merchants: "Add patrons, rivals, shop identities, prices, stock, and stable item links.",
    recipes: "Turn signature items and recovered materials into linked advancement goals.",
    loot_profiles: "Connect threats to auditable rewards and deterministic drop evidence.",
    quests: "Build contract chains, consequences, factions, and persistent campaign state.",
    encounters: "Add structured threats, hazards, enemy groups, exits, and alternate resolutions."
  };

  const elements = {
    seed: document.querySelector("#seed"),
    partySize: document.querySelector("#party-size"),
    partySizeOutput: document.querySelector("#party-size-output"),
    maximumTier: document.querySelector("#maximum-tier"),
    tierOutput: document.querySelector("#tier-output"),
    validity: document.querySelector("#validity"),
    validityDot: document.querySelector("#validity-dot"),
    title: document.querySelector("#party-title"),
    meta: document.querySelector("#party-meta"),
    statCharacters: document.querySelector("#stat-characters"),
    statBonds: document.querySelector("#stat-bonds"),
    statThreads: document.querySelector("#stat-threads"),
    statReferences: document.querySelector("#stat-references"),
    statMissing: document.querySelector("#stat-missing"),
    artLabel: document.querySelector("#art-label"),
    artProof: document.querySelector("#art-proof"),
    campaignFrame: document.querySelector("#campaign-frame"),
    homeBase: document.querySelector("#home-base"),
    patron: document.querySelector("#patron"),
    incitingContract: document.querySelector("#inciting-contract"),
    groupResource: document.querySelector("#group-resource"),
    sharedHistory: document.querySelector("#shared-history"),
    overviewPanel: document.querySelector("#overview-panel"),
    dossiersPanel: document.querySelector("#dossiers-panel"),
    bondsPanel: document.querySelector("#bonds-panel"),
    sessionPanel: document.querySelector("#session-panel"),
    dataPanel: document.querySelector("#data-panel"),
    referenceLedger: document.querySelector("#reference-ledger"),
    jsonOutput: document.querySelector("#json-output"),
    recommendationGrid: document.querySelector("#recommendation-grid"),
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

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => elements.toast.classList.remove("visible"), 1800);
  }

  function downloadText(contents, type, filename) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function setSegment(container, key, value) {
    document.querySelectorAll(`${container} button`).forEach((button) => {
      const selected = String(button.dataset[key]) === String(value);
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function writeUrl() {
    const params = new URLSearchParams({
      seed: elements.seed.value.trim(),
      campaign: state.campaignMode,
      tone: state.tone,
      cohesion: state.cohesion,
      party: elements.partySize.value,
      tier: elements.maximumTier.value
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  function loadUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("seed")) elements.seed.value = params.get("seed").slice(0, 64);
    if (core.CAMPAIGN_MODES[params.get("campaign")]) state.campaignMode = params.get("campaign");
    if (core.TONES[params.get("tone")]) state.tone = params.get("tone");
    if (core.COHESION[params.get("cohesion")]) state.cohesion = params.get("cohesion");
    const partySize = Number(params.get("party"));
    if (Number.isInteger(partySize) && partySize >= 3 && partySize <= 6) elements.partySize.value = String(partySize);
    const tier = Number(params.get("tier"));
    if (Number.isInteger(tier) && tier >= 1 && tier <= 5) elements.maximumTier.value = String(tier);
  }

  function trackedProductUrl(product, placement) {
    const url = new URL(product.url);
    url.searchParams.set("utm_source", "character_foundry");
    url.searchParams.set("utm_medium", "free_tool");
    url.searchParams.set("utm_campaign", "character_value_launch");
    url.searchParams.set("utm_content", `${product.id}_${placement}`);
    return url.toString();
  }

  function renderOverview() {
    const party = state.party;
    elements.overviewPanel.innerHTML = `
      <div class="overview-grid">
        <section class="contract-block">
          <p class="section-label">Inciting contract</p>
          <h3>${escapeHtml(party.inciting_contract.title)}</h3>
          <p>${escapeHtml(party.inciting_contract.objective)}</p>
          <p class="pressure-line"><strong>Complication:</strong> ${escapeHtml(party.inciting_contract.complication)}</p>
          <p class="source-line">${escapeHtml(party.inciting_contract.quest_id)}</p>
        </section>
        <section class="threat-block">
          <p class="section-label">First threat</p>
          <h3>${escapeHtml(party.first_threat.name)}</h3>
          <p>${escapeHtml(party.first_threat.setup)}</p>
          <p class="source-line">${escapeHtml(party.first_threat.encounter_id)}</p>
        </section>
      </div>
      <div class="thread-heading"><div><p class="section-label">Campaign runway</p><h3>Three linked threads</h3></div><span>${party.source_summary.entities} entities / ${party.source_summary.relationships} relationships</span></div>
      <div class="thread-grid">${party.campaign_threads.map((thread, index) => `
        <article class="thread-row">
          <span class="thread-number">0${index + 1}</span>
          <div><h4>${escapeHtml(thread.title)}</h4><p>${escapeHtml(thread.invitation)}</p><small>${escapeHtml(thread.quest_id)}</small></div>
        </article>`).join("")}
      </div>`;
  }

  function renderDossiers() {
    elements.dossiersPanel.innerHTML = `<div class="dossier-grid">${state.party.characters.map((character) => `
      <article class="dossier-card">
        <header><div><span>${escapeHtml(character.role)}</span><h3>${escapeHtml(character.name)}</h3><p>${escapeHtml(character.pronouns)} / ${escapeHtml(character.table_presence)}</p></div><button type="button" data-copy-character="${escapeHtml(character.character_id)}">Copy dossier</button></header>
        <p class="contribution">${escapeHtml(character.contribution)}</p>
        <dl>
          <div><dt>Drive</dt><dd>${escapeHtml(character.drive)}</dd></div>
          <div><dt>Ideal</dt><dd>${escapeHtml(character.ideal)}</dd></div>
          <div><dt>Edge</dt><dd>${escapeHtml(character.edge)}</dd></div>
          <div><dt>Burden</dt><dd>${escapeHtml(character.burden)}</dd></div>
          <div><dt>Private fear</dt><dd>${escapeHtml(character.private_fear)}</dd></div>
        </dl>
        <section class="signature-item"><span>Signature item / tier ${character.signature_item.tier}</span><h4>${escapeHtml(character.signature_item.name)}</h4><p>${escapeHtml(character.signature_item.function)}</p><small>${escapeHtml(character.signature_item.item_id)} / ${escapeHtml(character.signature_item.category)}</small></section>
        <p class="stake"><strong>Campaign stake:</strong> ${escapeHtml(character.campaign_stake)}</p>
        <p class="spotlight"><strong>Spotlight:</strong> ${escapeHtml(character.spotlight_question)}</p>
        <footer><span>${escapeHtml(character.character_id)}</span><span>${character.advancement_hooks.length} advancement hooks</span></footer>
      </article>`).join("")}</div>`;
  }

  function renderBonds() {
    const party = state.party;
    elements.bondsPanel.innerHTML = `
      <div class="bond-map" aria-label="Party relationship summary">
        <div class="party-node"><span>${escapeHtml(party.cohesion_label)}</span><strong>${escapeHtml(party.party_name)}</strong><small>${party.relationships.length} documented bonds</small></div>
        <div class="member-ring">${party.characters.map((character) => `<span><strong>${escapeHtml(character.name)}</strong><small>${escapeHtml(character.role)}</small></span>`).join("")}</div>
      </div>
      <div class="bond-list">${party.relationships.map((bond, index) => `
        <article class="bond-row">
          <span class="bond-index">${String(index + 1).padStart(2, "0")}</span>
          <div><h3>${escapeHtml(bond.from_name)} <span>+</span> ${escapeHtml(bond.to_name)}</h3><p>${escapeHtml(bond.shared_history)}</p><dl><div><dt>Tension</dt><dd>${escapeHtml(bond.tension)}</dd></div><div><dt>Repair question</dt><dd>${escapeHtml(bond.repair_question)}</dd></div></dl></div>
          <small>${escapeHtml(bond.trust)} trust</small>
        </article>`).join("")}</div>`;
  }

  function renderSessionZero() {
    const session = state.party.session_zero;
    elements.sessionPanel.innerHTML = `
      <div class="session-lead"><p class="section-label">Campaign promise</p><h3>${escapeHtml(session.campaign_promise)}</h3><p>${escapeHtml(session.tone_guidance)}</p></div>
      <div class="session-columns">
        <section><h3>Table boundaries</h3><ol>${session.content_conversation.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}</ol></section>
        <section><h3>Party questions</h3><ol>${session.party_questions.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}</ol></section>
      </div>
      <section class="relationship-prompts"><h3>Relationship repair prompts</h3><div>${session.relationship_questions.map((prompt) => `<p>${escapeHtml(prompt)}</p>`).join("")}</div></section>
      <section class="opening-scene"><span>Opening scene</span><p>${escapeHtml(session.first_scene_prompt)}</p></section>`;
  }

  function renderData() {
    elements.referenceLedger.innerHTML = state.party.reference_ledger.map((id) => `<code>${escapeHtml(id)}</code>`).join("");
    elements.jsonOutput.textContent = JSON.stringify(state.party, null, 2);
  }

  function renderRecommendations() {
    elements.recommendationGrid.innerHTML = core.PRODUCTS.map((product) => `
      <article class="recommendation-card">
        <span>${escapeHtml(product.proof)}</span>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${escapeHtml(productDescriptions[product.id])}</p>
        <a href="${escapeHtml(trackedProductUrl(product, "catalog"))}">View $3 module</a>
      </article>`).join("");
  }

  function activateTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll("[role=tab]").forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.tab === tabName)));
    for (const name of ["overview", "dossiers", "bonds", "session", "data"]) elements[`${name}Panel`].hidden = name !== tabName;
  }

  function render() {
    const party = state.party;
    elements.title.textContent = party.party_name;
    elements.meta.textContent = `${party.party_id} / ${party.campaign_mode_label} / ${party.tone_label} / ${party.cohesion_label}`;
    elements.statCharacters.textContent = party.validation.character_count;
    elements.statBonds.textContent = party.validation.relationship_count;
    elements.statThreads.textContent = party.campaign_threads.length;
    elements.statReferences.textContent = party.reference_ledger.length;
    elements.statMissing.textContent = party.validation.missing_reference_count;
    elements.artLabel.textContent = `${party.campaign_mode_label} company`;
    elements.artProof.textContent = `${party.party_size} dossiers / ${party.relationships.length} bonds`;
    elements.campaignFrame.textContent = party.campaign_frame;
    elements.homeBase.textContent = `${party.home_base.name} [${party.home_base.location_id}]`;
    elements.patron.textContent = `${party.patron.name} / ${party.patron.shop}`;
    elements.incitingContract.textContent = `${party.inciting_contract.title} [${party.inciting_contract.quest_id}]`;
    elements.groupResource.textContent = party.group_resource;
    elements.sharedHistory.textContent = party.shared_history;
    elements.validity.textContent = party.validation.valid ? "Validated party packet" : "Validation failed";
    elements.validityDot.classList.toggle("invalid", !party.validation.valid);
    renderOverview();
    renderDossiers();
    renderBonds();
    renderSessionZero();
    renderData();
    renderRecommendations();
    activateTab(state.activeTab);
  }

  function generate() {
    try {
      elements.partySizeOutput.value = elements.partySize.value;
      elements.tierOutput.value = elements.maximumTier.value;
      state.party = core.generate({
        seed: elements.seed.value,
        campaignMode: state.campaignMode,
        tone: state.tone,
        cohesion: state.cohesion,
        partySize: Number(elements.partySize.value),
        maximumTier: Number(elements.maximumTier.value)
      }, source);
      writeUrl();
      render();
    } catch (error) {
      elements.validity.textContent = "Generation failed";
      elements.validityDot.classList.add("invalid");
      showToast(error.message);
    }
  }

  async function copyText(value, message) {
    await navigator.clipboard.writeText(value);
    showToast(message);
  }

  document.querySelector("#campaign-mode-control").addEventListener("click", (event) => {
    if (!event.target.dataset.campaign) return;
    state.campaignMode = event.target.dataset.campaign;
    setSegment("#campaign-mode-control", "campaign", state.campaignMode);
    generate();
  });
  document.querySelector("#tone-control").addEventListener("click", (event) => {
    if (!event.target.dataset.tone) return;
    state.tone = event.target.dataset.tone;
    setSegment("#tone-control", "tone", state.tone);
    generate();
  });
  document.querySelector("#cohesion-control").addEventListener("click", (event) => {
    if (!event.target.dataset.cohesion) return;
    state.cohesion = event.target.dataset.cohesion;
    setSegment("#cohesion-control", "cohesion", state.cohesion);
    generate();
  });
  document.querySelector(".tabs").addEventListener("click", (event) => { if (event.target.dataset.tab) activateTab(event.target.dataset.tab); });
  elements.partySize.addEventListener("input", () => { elements.partySizeOutput.value = elements.partySize.value; generate(); });
  elements.maximumTier.addEventListener("input", () => { elements.tierOutput.value = elements.maximumTier.value; generate(); });
  elements.seed.addEventListener("change", generate);
  document.querySelector("#generate").addEventListener("click", generate);
  document.querySelector("#random-seed").addEventListener("click", () => {
    const values = new Uint32Array(2);
    window.crypto.getRandomValues(values);
    elements.seed.value = `company-${values[0].toString(36)}${values[1].toString(36)}`.slice(0, 32);
    generate();
  });
  document.querySelector("#print").addEventListener("click", () => window.print());
  document.querySelector("#copy-link").addEventListener("click", () => copyText(window.location.href, "Share link copied"));
  document.querySelector("#copy-markdown").addEventListener("click", () => copyText(core.toMarkdown(state.party), "Party Markdown copied"));
  document.querySelector("#download-json").addEventListener("click", () => downloadText(`${JSON.stringify(state.party, null, 2)}\n`, "application/json", `${state.party.party_id}.json`));
  elements.dossiersPanel.addEventListener("click", (event) => {
    const id = event.target.dataset.copyCharacter;
    if (!id) return;
    const character = state.party.characters.find((candidate) => candidate.character_id === id);
    if (character) copyText(core.toCharacterMarkdown(character, state.party), `${character.name} copied`);
  });

  loadUrl();
  setSegment("#campaign-mode-control", "campaign", state.campaignMode);
  setSegment("#tone-control", "tone", state.tone);
  setSegment("#cohesion-control", "cohesion", state.cohesion);
  generate();
})();
