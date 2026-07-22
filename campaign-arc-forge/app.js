(function startCampaignArcForge() {
  "use strict";

  const core = window.CampaignArcCore;
  const source = window.CampaignArcSource;
  if (!core || !source) throw new Error("Campaign Arc Forge runtime is incomplete");

  const state = {
    options: { seed: "storm-ledger-29", sessions: 6, tone: "grounded", pressure: "escalating", partySize: 4, maximumTier: 3 },
    arc: null,
    outcomes: {}
  };

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const safeFile = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 54) || "campaign-arc";
  let toastTimer;

  function notify(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2200);
  }

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    const proposed = {
      seed: params.get("seed") || state.options.seed,
      sessions: Number(params.get("sessions") || state.options.sessions),
      tone: params.get("tone") || state.options.tone,
      pressure: params.get("pressure") || state.options.pressure,
      partySize: Number(params.get("party") || state.options.partySize),
      maximumTier: Number(params.get("tier") || state.options.maximumTier)
    };
    try { state.options = core.normalizeOptions(proposed); } catch { state.options = core.normalizeOptions(state.options); }
  }

  function syncControls() {
    $("seed-input").value = state.options.seed;
    $("party-size-input").value = state.options.partySize;
    $("party-size-output").textContent = state.options.partySize;
    $("tier-input").value = state.options.maximumTier;
    $("tier-output").textContent = state.options.maximumTier;
    document.querySelectorAll("[data-control]").forEach((control) => {
      const key = control.dataset.control;
      control.querySelectorAll("button").forEach((button) => button.classList.toggle("selected", String(button.dataset.value) === String(state.options[key])));
    });
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("seed", state.options.seed);
    url.searchParams.set("sessions", state.options.sessions);
    url.searchParams.set("tone", state.options.tone);
    url.searchParams.set("pressure", state.options.pressure);
    url.searchParams.set("party", state.options.partySize);
    url.searchParams.set("tier", state.options.maximumTier);
    history.replaceState(null, "", url);
  }

  function progressState() {
    return core.applyOutcomes(state.arc, state.outcomes);
  }

  function renderOverview() {
    const arc = state.arc;
    $("campaign-title").textContent = arc.title;
    $("campaign-id").textContent = `${arc.arc_id} / ${arc.source_summary.assembly_id}`;
    $("campaign-logline-title").textContent = `${arc.session_count} sessions across three linked acts`;
    $("campaign-logline").textContent = arc.logline;
    $("campaign-promise").textContent = arc.campaign_promise;
    $("gm-framing").textContent = arc.gm_framing;
    $("pressure-cadence").textContent = arc.pressure_cadence;
    $("board-seed").textContent = arc.seed;
    $("session-stat").textContent = arc.session_count;
    $("stake-stat").textContent = arc.character_stakes.length;
    $("source-entities").textContent = arc.source_summary.entities;
    $("source-relationships").textContent = arc.source_summary.relationships;
    $("reference-gaps").textContent = arc.validation.missing_reference_count;
    $("validity-dot").classList.toggle("invalid", !arc.validation.valid);
    $("validity-label").textContent = arc.validation.valid ? "Validated linked campaign" : "Campaign validation failed";
  }

  function renderActs() {
    $("acts-list").innerHTML = state.arc.acts.map((act) => {
      const sessions = act.session_ids.map((id) => state.arc.sessions.find((session) => session.session_id === id));
      return `<article class="act-block"><header><h3>Act ${act.act}: ${escapeHtml(act.title)}</h3><strong>${sessions.length} session${sessions.length === 1 ? "" : "s"}</strong></header><p>${escapeHtml(act.purpose)}</p><div class="act-session-strip">${sessions.map((session) => `<button type="button" data-session-jump="${escapeHtml(session.session_id)}"><strong>Session ${session.number}</strong>${escapeHtml(session.title)}</button>`).join("")}</div></article>`;
    }).join("");
  }

  function renderFronts(progress) {
    $("fronts-list").innerHTML = progress.faction_clocks.map((front) => {
      const sourceFront = state.arc.faction_fronts.find((row) => row.front_id === front.front_id);
      const clock = Array.from({ length: front.segments }, (_, index) => `<i class="${index < front.filled ? "filled" : ""}" aria-hidden="true"></i>`).join("");
      return `<article class="front-card"><h3>${escapeHtml(front.name)}</h3><p>${escapeHtml(sourceFront.agenda)}</p><div class="clock-row" aria-label="${escapeHtml(front.name)} clock ${front.filled} of ${front.segments}">${clock}<strong>${front.filled}/${front.segments}</strong></div></article>`;
    }).join("");
  }

  function oppositionText(session) {
    return session.encounter.opposition.map((group) => `${group.count} ${group.enemy_name} (${group.role})`).join("; ");
  }

  function renderSessions() {
    $("sessions-list").innerHTML = state.arc.sessions.map((session) => {
      const current = state.outcomes[session.session_id] || "unresolved";
      const outcomeButtons = [
        ["unresolved", "Unresolved"],
        ["success", "Clean win"],
        ["cost", "Cost"],
        ["setback", "Setback"]
      ].map(([value, label]) => `<button class="${current === value ? "selected" : ""}" type="button" data-outcome="${value}" data-session-id="${escapeHtml(session.session_id)}">${label}</button>`).join("");
      return `<article id="${escapeHtml(session.session_id)}" class="session-card"><header><div><p class="section-label">Session ${session.number} / Act ${session.act}</p><h3>${escapeHtml(session.title)}</h3></div><span>${escapeHtml(session.active_front.name)}</span></header><blockquote class="session-opening">${escapeHtml(session.opening_image)}</blockquote><div class="session-grid"><div><span>Objective</span><strong>${escapeHtml(session.objective)}</strong></div><div><span>Evidence / complication</span><strong>${escapeHtml(session.evidence)}</strong></div><div><span>Location pressure</span><strong>${escapeHtml(session.location.name)}: ${escapeHtml(session.location.hazard)}</strong></div><div><span>Encounter</span><strong>${escapeHtml(session.encounter.name)}: ${escapeHtml(oppositionText(session))}</strong></div><div><span>Telegraph / mitigation</span><strong>${escapeHtml(session.encounter.telegraph)} ${escapeHtml(session.encounter.mitigation)}</strong></div><div><span>Reward / spotlight</span><strong>${escapeHtml(`${session.reward.currency} currency${session.reward.item_name ? ` + ${session.reward.item_name}` : ""}; ${session.spotlight_names.join(" + ")}`)}</strong></div></div><div class="decision-block"><h4>Decisions that move the campaign</h4><ul>${session.decision.map((decision) => `<li>${escapeHtml(decision)}</li>`).join("")}</ul></div><div class="outcome-control"><span>Record the session outcome</span><div class="outcome-buttons">${outcomeButtons}</div></div></article>`;
    }).join("");
  }

  function renderStakes() {
    $("stakes-list").innerHTML = state.arc.character_stakes.map((stake) => `<article class="stake-card"><header><h3>${escapeHtml(stake.character_name)}</h3><span>${escapeHtml(stake.role)}</span></header><dl><dt>Question</dt><dd>${escapeHtml(stake.campaign_question)}</dd><dt>Pressure</dt><dd>${escapeHtml(stake.pressure_point)}</dd><dt>Linked item</dt><dd>${escapeHtml(stake.linked_item_name)} <code>${escapeHtml(stake.linked_item_id)}</code></dd><dt>Linked quest</dt><dd><code>${escapeHtml(stake.linked_quest_id)}</code></dd></dl></article>`).join("");
  }

  function renderLedger(progress) {
    $("resolved-stat").textContent = progress.resolved_sessions;
    $("outcome-ledger").innerHTML = progress.ledger.map((entry) => `<div class="outcome-row"><strong>Session ${entry.session_number}<br>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.summary)}<br><b>Carry forward:</b> ${escapeHtml(entry.carry_forward)}</span></div>`).join("");
    $("reference-ledger").innerHTML = state.arc.reference_ledger.map((id) => `<code>${escapeHtml(id)}</code>`).join("");
    $("json-output").textContent = JSON.stringify({ ...state.arc, campaign_state: progress }, null, 2);
  }

  function renderRecommendations() {
    const reasons = {
      quests: "Scale the arc with 240 additional objectives, complications, resolutions, and rewards.",
      encounters: "Add 180 tactical situations with telegraphs, mitigation, exits, and alternate resolutions.",
      loot_profiles: "Give every campaign threat a coherent reward identity across 250 profiles.",
      merchants: "Anchor factions and supply pressure with 150 ready-to-use merchants and shops.",
      items: "Extend evidence, stakes, rewards, and economies with 500 original fantasy items.",
      recipes: "Turn recovered materials into 300 linked crafting and alchemy recipes."
    };
    $("recommendation-grid").innerHTML = core.recommendProducts(6).map((product) => {
      const url = new URL(product.url);
      url.searchParams.set("utm_source", "campaign_arc_forge");
      url.searchParams.set("utm_medium", "free_tool");
      url.searchParams.set("utm_campaign", "campaign_arc_value_launch");
      url.searchParams.set("utm_content", `campaign_arc_${product.id}`);
      return `<article class="recommendation-card"><span>${escapeHtml(product.code)} / ${escapeHtml(product.proof)}</span><h3>${escapeHtml(product.title)}</h3><p>${escapeHtml(reasons[product.id])}</p><a href="${escapeHtml(url.href)}" target="_blank" rel="noopener">View the $3 module</a></article>`;
    }).join("");
  }

  function renderProgress() {
    const progress = progressState();
    renderFronts(progress);
    renderLedger(progress);
  }

  function generateCampaign() {
    state.options.seed = $("seed-input").value.trim() || "storm-ledger-29";
    state.options.partySize = Number($("party-size-input").value);
    state.options.maximumTier = Number($("tier-input").value);
    state.options = core.normalizeOptions(state.options);
    state.arc = core.generate(state.options, source);
    state.outcomes = {};
    syncControls();
    updateUrl();
    renderOverview();
    renderActs();
    renderSessions();
    renderStakes();
    renderRecommendations();
    renderProgress();
  }

  function switchPanel(name) {
    document.querySelectorAll(".result-tabs button").forEach((button) => {
      const active = button.dataset.panel === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".result-panel").forEach((panel) => { panel.hidden = panel.id !== `panel-${name}`; });
  }

  function randomSeed() {
    const first = ["ash", "brass", "cinder", "glass", "harbor", "iron", "morrow", "reed", "salt", "storm"];
    const second = ["accord", "archive", "bell", "claim", "ledger", "route", "signal", "tide", "warrant", "watch"];
    const values = new Uint32Array(3);
    window.crypto.getRandomValues(values);
    return `${first[values[0] % first.length]}-${second[values[1] % second.length]}-${10 + (values[2] % 90)}`;
  }

  function download(filename, content, type) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type }));
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  document.querySelectorAll("[data-control]").forEach((control) => control.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button) return;
    const key = control.dataset.control;
    state.options[key] = key === "sessions" ? Number(button.dataset.value) : button.dataset.value;
    control.querySelectorAll("button").forEach((row) => row.classList.toggle("selected", row === button));
  }));

  $("party-size-input").addEventListener("input", (event) => { $("party-size-output").textContent = event.target.value; });
  $("tier-input").addEventListener("input", (event) => { $("tier-output").textContent = event.target.value; });
  $("generate-button").addEventListener("click", generateCampaign);
  $("new-seed-button").addEventListener("click", () => { $("seed-input").value = randomSeed(); generateCampaign(); });

  $("sessions-list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-outcome]");
    if (!button) return;
    if (button.dataset.outcome === "unresolved") delete state.outcomes[button.dataset.sessionId];
    else state.outcomes[button.dataset.sessionId] = button.dataset.outcome;
    button.parentElement.querySelectorAll("button").forEach((row) => row.classList.toggle("selected", row === button));
    renderProgress();
  });

  $("acts-list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-session-jump]");
    if (!button) return;
    switchPanel("sessions");
    $(button.dataset.sessionJump)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelectorAll(".result-tabs button").forEach((button) => button.addEventListener("click", () => switchPanel(button.dataset.panel)));
  $("copy-button").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(core.toMarkdown(state.arc, state.outcomes)); notify("Campaign Markdown copied"); }
    catch { notify("Clipboard access was unavailable"); }
  });
  $("markdown-button").addEventListener("click", () => download(`${safeFile(state.arc.title)}.md`, core.toMarkdown(state.arc, state.outcomes), "text/markdown;charset=utf-8"));
  $("json-button").addEventListener("click", () => download(`${safeFile(state.arc.title)}.json`, JSON.stringify({ ...state.arc, campaign_state: progressState() }, null, 2), "application/json;charset=utf-8"));
  $("share-button").addEventListener("click", async () => {
    updateUrl();
    try { await navigator.clipboard.writeText(window.location.href); notify("Reproducible campaign URL copied"); }
    catch { notify("Campaign URL is ready in the address bar"); }
  });
  $("print-button").addEventListener("click", () => window.print());

  readUrl();
  syncControls();
  generateCampaign();
})();
