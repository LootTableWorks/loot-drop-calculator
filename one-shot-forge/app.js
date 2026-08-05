(function startOneShotForge() {
  "use strict";

  const core = window.OneShotCore;
  const source = window.OneShotSource;
  const startAdapter = window.OneShotCampaignStartAdapter;
  if (!startAdapter) throw new Error("Campaign Start adapter is missing");
  const allowedCampaignOrigins = new Set([
    "awesome_dnd",
    "bluesky",
    "gamingtrend",
    "github",
    "instagram",
    "itch_io",
    "mastodon",
    "organic_search",
    "owned_site",
    "pinterest",
    "press_kit",
    "rpggen_dev",
    "run_one_shot_guide",
    "the_compendium",
    "tiktok",
    "tinytools",
    "tribality",
    "user_share",
    "youtube"
  ]);
  const allowedInboundMediums = new Set([
    "community_test",
    "free_tool",
    "organic_social",
    "organic_video",
    "owned_search",
    "referral_directory"
  ]);
  const allowedInboundCampaigns = new Set([
    "ltw_free_tool_directory_v1",
    "ltw_instagram_7d_v1",
    "ltw_one_shot_intent_v1",
    "ltw_pinterest_launch_v1",
    "ltw_youtube_editorial_batch_v1",
    "one_shot_forge_share",
    "one_shot_ideas_v1",
    "one_shot_value_launch",
    "wf4w_revenue_v1"
  ]);
  const allowedInboundContents = new Set([
    "complete_one_shot_generator",
    "d04_one_shot_forge",
    "generated_one_shot",
    "hero_generate_one_shot",
    "one_shot_field_test",
    "one_shot_forge",
    "one_shot_forge_generator",
    "route_one_shot_forge",
    "ytb1_short_01_gullwatch_ready_tonight",
    "ytb1_short_02_connected_record_trace"
  ]);
  const allowedReferrerOrigins = new Map([
    ["bsky.app", "bluesky"],
    ["compendium.tools", "the_compendium"],
    ["github.com", "github"],
    ["instagram.com", "instagram"],
    ["itch.io", "itch_io"],
    ["mastodon.social", "mastodon"],
    ["pinterest.com", "pinterest"],
    ["rpggen.dev", "rpggen_dev"],
    ["tiktok.com", "tiktok"],
    ["tinytools.directory", "tinytools"],
    ["youtube.com", "youtube"],
    ["youtu.be", "youtube"]
  ]);
  const acquisitionOrigin = readAcquisitionOrigin();
  const preservedInboundParams = readPreservedInboundParams();
  const state = {
    tone: "heroic",
    threat: "standard",
    region: "any",
    durationMinutes: 180,
    activeTab: "run-sheet",
    campaignScope: null,
    campaignSpotlight: null,
    oneShot: null
  };
  const productDescriptions = {
    items: "Expand every reward, clue object, and signature item with economy-ready records.",
    merchants: "Add contract givers, stock, prices, restocks, and canonical item links.",
    recipes: "Turn recovered materials into linked crafting objectives and outputs.",
    loot_profiles: "Use exact reward probabilities, enemy identities, and audit tools.",
    quests: "Build full contract chains with stages, consequences, and state operations.",
    encounters: "Add three-phase threats, hazards, enemy groups, and reward evidence."
  };
  const elements = {
    seed: document.querySelector("#seed"),
    region: document.querySelector("#region"),
    partySize: document.querySelector("#party-size"),
    partySizeOutput: document.querySelector("#party-size-output"),
    maximumTier: document.querySelector("#maximum-tier"),
    tierOutput: document.querySelector("#tier-output"),
    validity: document.querySelector("#validity"),
    validityDot: document.querySelector("#validity-dot"),
    title: document.querySelector("#adventure-title"),
    meta: document.querySelector("#adventure-meta"),
    railMissing: document.querySelector("#rail-missing"),
    statMinutes: document.querySelector("#stat-minutes"),
    statScenes: document.querySelector("#stat-scenes"),
    statCharacters: document.querySelector("#stat-characters"),
    statClues: document.querySelector("#stat-clues"),
    statReferences: document.querySelector("#stat-references"),
    mapLabel: document.querySelector("#map-label"),
    mapProof: document.querySelector("#map-proof"),
    loglineTitle: document.querySelector("#logline-title"),
    logline: document.querySelector("#logline"),
    countdownLabel: document.querySelector("#countdown-label"),
    countdownFinal: document.querySelector("#countdown-final"),
    rewardSummary: document.querySelector("#reward-summary"),
    contentNotes: document.querySelector("#content-notes"),
    contextualItemName: document.querySelector("#contextual-item-name"),
    contextualItemReason: document.querySelector("#contextual-item-reason"),
    contextualItemDemo: document.querySelector("#contextual-item-demo"),
    contextualItemBuy: document.querySelector("#contextual-item-buy"),
    runSheetPanel: document.querySelector("#run-sheet-panel"),
    scenesPanel: document.querySelector("#scenes-panel"),
    partyPanel: document.querySelector("#party-panel"),
    referencesPanel: document.querySelector("#references-panel"),
    jsonOutput: document.querySelector("#json-output"),
    campaignOfferLink: document.querySelector("#campaign-offer-link"),
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

  function attributionToken(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 64);
  }

  function readAcquisitionOrigin() {
    const querySource = attributionToken(
      new URLSearchParams(window.location.search).get("utm_source")
    );
    if (allowedCampaignOrigins.has(querySource)) return querySource;

    try {
      const currentHost = window.location.hostname
        .replace(/^www\./, "")
        .toLowerCase();
      const referrerHost = new URL(document.referrer).hostname
        .replace(/^www\./, "")
        .toLowerCase();
      if (referrerHost && referrerHost !== currentHost) {
        return allowedReferrerOrigins.get(referrerHost) || "";
      }
    } catch {
      // Missing and malformed referrers are intentionally ignored.
    }
    return "";
  }

  function readPreservedInboundParams() {
    const incoming = new URLSearchParams(window.location.search);
    const preserved = new URLSearchParams();
    const source = attributionToken(incoming.get("utm_source"));
    if (allowedCampaignOrigins.has(source)) {
      preserved.set("utm_source", source);
      for (const [key, allowlist] of [
        ["utm_medium", allowedInboundMediums],
        ["utm_campaign", allowedInboundCampaigns],
        ["utm_content", allowedInboundContents]
      ]) {
        const value = attributionToken(incoming.get(key));
        if (allowlist.has(value)) preserved.set(key, value);
      }
    }
    if (incoming.get("ltw_qa") === "1") preserved.set("ltw_qa", "1");
    return preserved;
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
    link.click();
    URL.revokeObjectURL(url);
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
      tone: state.tone,
      threat: state.threat,
      region: state.region,
      duration: String(state.durationMinutes),
      party: elements.partySize.value,
      tier: elements.maximumTier.value
    });
    if (state.campaignScope) params.set("scope", state.campaignScope);
    if (state.campaignSpotlight) params.set("spotlight", state.campaignSpotlight);
    preservedInboundParams.forEach((value, key) => params.set(key, value));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  function shareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("utm_source", "user_share");
    url.searchParams.set("utm_medium", "social");
    url.searchParams.set("utm_campaign", "one_shot_forge_share");
    url.searchParams.set("utm_content", "generated_one_shot");
    return url.toString();
  }

  function loadUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("seed")) elements.seed.value = params.get("seed").slice(0, 64);
    if (core.TONES[params.get("tone")]) state.tone = params.get("tone");
    if (core.THREATS[params.get("threat")]) state.threat = params.get("threat");
    if (core.REGIONS[params.get("region")]) state.region = params.get("region");
    elements.region.value = state.region;
    const duration = Number(params.get("duration"));
    if ([120, 180, 240].includes(duration)) state.durationMinutes = duration;
    const party = Number(params.get("party"));
    if (Number.isInteger(party) && party >= 3 && party <= 6) elements.partySize.value = String(party);
    const tier = Number(params.get("tier"));
    if (Number.isInteger(tier) && tier >= 1 && tier <= 5) elements.maximumTier.value = String(tier);
    if (window.CampaignStartContract.SCOPE_PRESETS[params.get("scope")]) state.campaignScope = params.get("scope");
    if (window.CampaignStartContract.SPOTLIGHT_PRESETS[params.get("spotlight")]) state.campaignSpotlight = params.get("spotlight");
  }

  function trackedProductUrl(product, placement) {
    const url = new URL(product.url);
    const originSuffix = acquisitionOrigin ? `_origin_${acquisitionOrigin}` : "";
    url.searchParams.set("utm_source", "one_shot_forge");
    url.searchParams.set("utm_medium", "free_tool");
    url.searchParams.set("utm_campaign", "one_shot_value_launch");
    url.searchParams.set("utm_content", `${product.id}_${placement}${originSuffix}`);
    return url.toString();
  }

  function trackedCampaignUrl() {
    return trackedProductUrl({
      id: "gullwatch_harbor",
      url: "https://loottableworks.github.io/loot-drop-calculator/buy/?offer=gullwatch_harbor"
    }, "featured_campaign");
  }

  function trackedItemProofUrl(destination, placement) {
    const url = new URL(destination, window.location.href);
    const originSuffix = acquisitionOrigin ? `_origin_${acquisitionOrigin}` : "";
    url.searchParams.set("utm_source", "one_shot_forge");
    url.searchParams.set("utm_medium", "free_tool");
    url.searchParams.set("utm_campaign", "one_shot_value_launch");
    url.searchParams.set("utm_content", `${placement}${originSuffix}`);
    if (url.pathname.endsWith("/buy/")) url.searchParams.set("utm_term", "direct");
    return url.toString();
  }

  function renderRunSheet() {
    const oneShot = state.oneShot;
    elements.runSheetPanel.innerHTML = `
      <div class="run-grid">
        <div class="timeline">
          ${oneShot.scenes.map((scene) => `
            <article class="timeline-row">
              <span class="timeline-index">${scene.order}</span>
              <div><h3>${escapeHtml(scene.title)}</h3><p>${escapeHtml(scene.purpose)}</p></div>
              <strong class="timeline-time">${scene.minutes} min</strong>
            </article>`).join("")}
        </div>
        <aside class="countdown-card">
          <p class="section-label">Escalation clock</p>
          <h3>${escapeHtml(oneShot.countdown.label)}</h3>
          <div class="clock-track" aria-label="${oneShot.countdown.segments} segment countdown">
            ${Array.from({ length: 6 }, (_, index) => `<span class="clock-segment${index >= oneShot.countdown.segments ? " inactive" : ""}"></span>`).join("")}
          </div>
          <strong>Advance when</strong>
          <ul>${oneShot.countdown.advances_when.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>
          <p class="scene-exit">At full clock: ${escapeHtml(oneShot.countdown.final_state)}</p>
        </aside>
      </div>`;
  }

  function renderScenes() {
    elements.scenesPanel.innerHTML = `<div class="scene-grid">${state.oneShot.scenes.map((scene) => `
      <article class="scene-card">
        <header><h3>${scene.order}. ${escapeHtml(scene.title)}</h3><strong>${scene.minutes} minutes</strong></header>
        <blockquote>${escapeHtml(scene.read_aloud)}</blockquote>
        <strong>GM moves</strong>
        <ul>${scene.gm_moves.map((move) => `<li>${escapeHtml(move)}</li>`).join("")}</ul>
        <p class="scene-exit">Exit: ${escapeHtml(scene.exit)}</p>
      </article>`).join("")}</div>`;
  }

  function renderParty() {
    elements.partyPanel.innerHTML = `<div class="party-grid">${state.oneShot.characters.map((character) => `
      <article class="character-card">
        <header><h3>${escapeHtml(character.name)}</h3><span>${escapeHtml(character.role)}</span></header>
        <dl>
          <dt>Drive</dt><dd>${escapeHtml(character.drive)}</dd>
          <dt>Edge</dt><dd>${escapeHtml(character.edge)}</dd>
          <dt>Burden</dt><dd>${escapeHtml(character.burden)}</dd>
          <dt>Bond</dt><dd>${escapeHtml(character.bond)}</dd>
          <dt>Signature</dt><dd>${escapeHtml(character.signature_item_name)} <code>${escapeHtml(character.signature_item_id)}</code></dd>
          <dt>Adventure tie</dt><dd>${escapeHtml(character.adventure_tie)}</dd>
          <dt>Spotlight</dt><dd>${escapeHtml(character.spotlight_prompt)}</dd>
        </dl>
      </article>`).join("")}</div>`;
  }

  function renderReferences() {
    const oneShot = state.oneShot;
    elements.referencesPanel.innerHTML = `
      <div class="reference-layout">
        <div class="clue-list">
          ${oneShot.clues.map((clue, index) => `
            <article class="clue-row">
              <strong>Clue ${index + 1}: ${escapeHtml(clue.clue)}</strong>
              <span>Reveals: ${escapeHtml(clue.reveals)}</span>
              <small>Fail forward: ${escapeHtml(clue.fail_forward)}</small>
            </article>`).join("")}
        </div>
        <aside class="ledger">
          <p class="section-label">Reference closure</p>
          <h3>${oneShot.reference_ledger.length} source records</h3>
          <div>${oneShot.reference_ledger.map((id) => `<code>${escapeHtml(id)}</code>`).join("")}</div>
          <p class="scene-exit">${oneShot.validation.missing_reference_count} unresolved endpoints</p>
        </aside>
      </div>`;
  }

  function renderRecommendations() {
    elements.recommendationGrid.innerHTML = core.recommendProducts(6).map((product) => `
      <article class="recommendation-card">
        <span>${escapeHtml(product.proof)}</span>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${escapeHtml(productDescriptions[product.id])}</p>
        <a href="${escapeHtml(trackedProductUrl(product, "recommended"))}" target="_blank" rel="noopener">Open $3 module</a>
      </article>`).join("");
  }

  function render() {
    const oneShot = state.oneShot;
    const location = oneShot.source_records.location;
    const objective = oneShot.source_records.quest.objective;
    elements.title.textContent = oneShot.title;
    elements.meta.textContent = `${oneShot.adventure_id} | ${core.REGIONS[oneShot.region].label} | ${core.TONES[oneShot.tone].label} | ${core.THREATS[oneShot.threat].label}`;
    elements.validity.textContent = oneShot.validation.valid ? "Validated packet" : "Validation failed";
    elements.validityDot.classList.toggle("invalid", !oneShot.validation.valid);
    elements.railMissing.textContent = oneShot.validation.missing_reference_count;
    elements.statMinutes.textContent = oneShot.duration_minutes;
    elements.statScenes.textContent = oneShot.validation.scene_count;
    elements.statCharacters.textContent = oneShot.validation.character_count;
    elements.statClues.textContent = oneShot.clues.length;
    elements.statReferences.textContent = oneShot.reference_ledger.length;
    elements.mapLabel.textContent = "Six-region atlas overview";
    elements.mapProof.textContent = `${oneShot.validation.missing_reference_count} missing references`;
    elements.loglineTitle.textContent = `${objective.action || "Complete"}${Number(objective.quantity || 1) > 1 ? ` ${objective.quantity}` : ""} ${objective.target_item_name || "documented objective"}`;
    elements.logline.textContent = oneShot.logline;
    elements.countdownLabel.textContent = `${oneShot.countdown.segments} segments - ${oneShot.countdown.label}`;
    elements.countdownFinal.textContent = oneShot.countdown.final_state;
    elements.rewardSummary.textContent = `${oneShot.rewards.currency} currency${oneShot.rewards.item_name ? ` + ${oneShot.rewards.item_name}` : ""}`;
    elements.contentNotes.textContent = oneShot.content_notes.join(", ");
    const signatureItem = oneShot.characters.find((character) => character.signature_item_name);
    const itemName = oneShot.rewards.item_name || signatureItem?.signature_item_name || "the reward";
    const itemId = oneShot.rewards.item_id || signatureItem?.signature_item_id || "stable item references";
    elements.contextualItemName.textContent = itemName;
    elements.contextualItemReason.textContent = `This packet references ${itemId}. The Item Catalog turns that same stable-ID workflow into inspectable economy fields, tags, loaders, and exports.`;
    elements.contextualItemDemo.href = trackedItemProofUrl(
      "../item-catalog-demo/",
      "item_context_demo"
    );
    elements.contextualItemBuy.href = trackedItemProofUrl(
      "../buy/?offer=item",
      "items_recommended"
    );
    elements.jsonOutput.textContent = JSON.stringify(oneShot, null, 2);
    renderRunSheet();
    renderScenes();
    renderParty();
    renderReferences();
  }

  function generate() {
    try {
      state.oneShot = core.generate({
        seed: elements.seed.value,
        tone: state.tone,
        threat: state.threat,
        region: state.region,
        durationMinutes: state.durationMinutes,
        partySize: Number(elements.partySize.value),
        maximumTier: Number(elements.maximumTier.value)
      }, source);
      elements.partySizeOutput.value = elements.partySize.value;
      elements.tierOutput.value = elements.maximumTier.value;
      writeUrl();
      render();
    } catch (error) {
      showToast(error.message || "Generation failed");
    }
  }

  loadUrl();
  setSegment("#tone-control", "tone", state.tone);
  setSegment("#threat-control", "threat", state.threat);
  setSegment("#duration-control", "duration", state.durationMinutes);
  elements.partySizeOutput.value = elements.partySize.value;
  elements.tierOutput.value = elements.maximumTier.value;
  elements.campaignOfferLink.href = trackedCampaignUrl();
  renderRecommendations();

  document.querySelector("#generate").addEventListener("click", generate);
  document.querySelector("#random-seed").addEventListener("click", () => {
    elements.seed.value = `adventure-${Math.random().toString(36).slice(2, 9)}`;
    generate();
  });
  elements.region.addEventListener("change", () => {
    state.region = elements.region.value;
    generate();
  });
  document.querySelectorAll("#tone-control button").forEach((button) => button.addEventListener("click", () => {
    state.tone = button.dataset.tone;
    state.campaignSpotlight = null;
    setSegment("#tone-control", "tone", state.tone);
    generate();
  }));
  document.querySelectorAll("#threat-control button").forEach((button) => button.addEventListener("click", () => {
    state.threat = button.dataset.threat;
    state.campaignScope = null;
    setSegment("#threat-control", "threat", state.threat);
    generate();
  }));
  document.querySelectorAll("#duration-control button").forEach((button) => button.addEventListener("click", () => {
    state.durationMinutes = Number(button.dataset.duration);
    state.campaignScope = null;
    setSegment("#duration-control", "duration", state.durationMinutes);
    generate();
  }));
  elements.partySize.addEventListener("input", () => { elements.partySizeOutput.value = elements.partySize.value; });
  elements.partySize.addEventListener("change", generate);
  elements.maximumTier.addEventListener("input", () => { elements.tierOutput.value = elements.maximumTier.value; });
  elements.maximumTier.addEventListener("change", generate);
  const resultTabs = [...document.querySelectorAll(".result-tabs button")];
  function activateResultTab(button, focus = false) {
    state.activeTab = button.dataset.tab;
    resultTabs.forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll(".result-panel").forEach((panel) => { panel.hidden = panel.id !== `${state.activeTab}-panel`; });
    if (focus) button.focus();
  }
  resultTabs.forEach((button, index) => {
    button.addEventListener("click", () => activateResultTab(button));
    button.addEventListener("keydown", (event) => {
      let nextIndex = null;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % resultTabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + resultTabs.length) % resultTabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = resultTabs.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      activateResultTab(resultTabs[nextIndex], true);
    });
  });
  document.querySelector("#copy-link").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(shareUrl()); showToast("Tracked share link copied"); }
    catch { showToast("Copy unavailable in this browser"); }
  });
  document.querySelector("#share-adventure").addEventListener("click", async () => {
    const url = shareUrl();
    const title = `${state.oneShot.title} | One-Shot Forge`;
    const text = `${state.oneShot.duration_minutes}-minute system-neutral fantasy one-shot with ${state.oneShot.validation.scene_count} scenes and ${state.oneShot.validation.character_count} pregenerated characters.`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        showToast("Adventure shared");
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      showToast("Share text copied");
    } catch {
      showToast("Sharing is unavailable in this browser");
    }
  });
  document.querySelector("#copy-markdown").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(core.toMarkdown(state.oneShot)); showToast("Markdown packet copied"); }
    catch { showToast("Copy unavailable in this browser"); }
  });
  document.querySelector("#print-packet").addEventListener("click", () => window.print());
  document.querySelector("#download-json").addEventListener("click", () => downloadText(JSON.stringify(state.oneShot, null, 2), "application/json", `${state.oneShot.adventure_id}.json`));
  document.querySelector("#download-campaign-start").addEventListener("click", () => {
    try {
      const start = startAdapter.create(state.oneShot, {
        scope: state.campaignScope,
        spotlight: state.campaignSpotlight
      });
      downloadText(JSON.stringify(start, null, 2), "application/json", startAdapter.filename(start));
      showToast("Campaign Start JSON saved");
    } catch (error) {
      showToast(error.message || "Campaign Start export failed");
    }
  });

  generate();
})();
