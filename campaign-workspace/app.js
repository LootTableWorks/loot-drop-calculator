(function attachCampaignWorkspaceApp() {
  "use strict";

  const STORAGE_KEY = "loot-table-works:gullwatch-campaign-workspace:v1";
  const runtime = globalThis.CampaignWorkspaceRuntime;
  const source = globalThis.PlayerChronicleSource;
  const adventure = globalThis.GullwatchAdventureSource;
  const root = document.querySelector("#workspace-view");
  const fileInput = document.querySelector("#campaign-file");
  const toast = document.querySelector("#toast");
  let activeView = "overview";
  let workspace = null;
  let toastTimer = null;
  let clockAdjustments = { flood_tide: 0, false_signal: 0 };

  const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const humanize = (value) => String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, runtime.serialize(workspace));
    const status = document.querySelector("#save-status");
    status.textContent = "Saved locally";
  }

  function loadOrCreate() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return runtime.hydrate(JSON.parse(saved));
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        showToast(`Local save was not valid: ${error.message}`);
      }
    }
    return runtime.createDefault(source, adventure, {
      seed: "gullwatch-first-light",
      createdAt: new Date().toISOString()
    });
  }

  function snapshot() {
    return runtime.summarize(workspace);
  }

  function setView(view) {
    activeView = view;
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.view === view));
    });
    render();
    root.focus({ preventScroll: true });
  }

  function heading(eyebrow, title, description, actions = "") {
    return `
      <header class="view-heading">
        <div>
          <p class="eyebrow">${esc(eyebrow)}</p>
          <h1>${esc(title)}</h1>
          <p>${esc(description)}</p>
        </div>
        ${actions ? `<div class="view-actions">${actions}</div>` : ""}
      </header>`;
  }

  function clockHtml(clock) {
    const segments = Array.from({ length: clock.maximum }, (_, index) =>
      `<span class="segment${index < clock.value ? " filled" : ""}"></span>`).join("");
    return `
      <article class="clock-row">
        <div class="clock-top">
          <strong>${esc(clock.label)}</strong>
          <span>${clock.value} / ${clock.maximum}</span>
        </div>
        <div class="segments" aria-label="${esc(clock.label)} ${clock.value} of ${clock.maximum}">${segments}</div>
      </article>`;
  }

  function renderOverview(summary) {
    const cast = summary.cast.map((person) => `
      <article class="cast-card">
        <span>${esc(person.role)}</span>
        <h3>${esc(person.name)}</h3>
        <p>${esc(person.wants)}</p>
      </article>`).join("");
    const recent = summary.timeline.slice(-4).reverse().map((entry) => `
      <article class="activity-row">
        <time>${esc(entry.label)}</time>
        <div><strong>${esc(entry.title)}</strong><p>${esc(entry.detail)}</p></div>
      </article>`).join("");
    root.innerHTML = `
      ${heading("Persistent campaign / local canon", summary.title, summary.pitch,
        `<button type="button" data-action="open-brief">Prepare next session</button>
         <button type="button" class="primary-action" data-action="record">Record outcome</button>`)}
      <section class="campaign-ribbon">
        <div class="campaign-image"><img src="assets/gullwatch-beacon-cover-v1.png" alt="Gullwatch Beacon above a storm-dark coast"></div>
        <div class="campaign-summary">
          <p class="eyebrow">Strong start</p>
          <h2>${esc(summary.adventureTitle)}</h2>
          <blockquote>${esc(summary.strongStart)}</blockquote>
          <div class="summary-meta">
            <span>Session ${summary.sessionNumber}</span>
            <span>${summary.playerRange} players</span>
            <span>${summary.duration}</span>
            <span>${summary.eventCount} canon events</span>
          </div>
        </div>
      </section>
      <div class="dashboard-grid">
        <div>
          <section class="panel">
            <div class="panel-heading"><h2>Current objective</h2><span>Canon-derived</span></div>
            <div class="objective"><strong>${esc(summary.objectiveUrgency)}</strong><p>${esc(summary.objective)}</p></div>
          </section>
          <section class="panel">
            <div class="panel-heading"><h2>Key cast</h2><span>${summary.cast.length} active interests</span></div>
            <div class="cast-grid">${cast}</div>
          </section>
          <section class="panel">
            <div class="panel-heading"><h2>Recent continuity</h2><span>Append-only</span></div>
            <div class="activity-list">${recent || `<div class="empty-state"><div><h2>No recorded outcomes</h2></div></div>`}</div>
          </section>
        </div>
        <div>
          <section class="panel">
            <div class="panel-heading"><h2>Pressure clocks</h2><span>Bounded state</span></div>
            <div class="clock-list">${summary.clocks.map(clockHtml).join("")}</div>
          </section>
          <section class="panel">
            <div class="panel-heading"><h2>Next decision</h2><span>GM focus</span></div>
            <div class="objective"><strong>${esc(summary.nextDecision.label)}</strong><p>${esc(summary.nextDecision.text)}</p></div>
          </section>
        </div>
      </div>`;
  }

  function renderBrief(summary) {
    const brief = summary.brief;
    if (!brief) {
      root.innerHTML = `${heading("Session preparation", "Next-session brief", "Generate a deterministic run sheet from the current campaign state.")}
        <div class="empty-state"><div><h2>No brief yet</h2><button type="button" class="primary-action copy-button" data-action="generate-brief">Build session brief</button></div></div>`;
      return;
    }
    const stakes = brief.stakes.map((stake) => `<li><small>${esc(stake.urgency)}</small>${esc(stake.text)}</li>`).join("");
    const callbacks = brief.continuity_callbacks.map((callback) => `<li><small>${String(callback.priority).padStart(2, "0")}</small>${esc(callback.text)}</li>`).join("");
    const scenes = brief.scenes.map((scene) => `
      <article class="scene-card">
        <span>${String(scene.order).padStart(2, "0")} / ${esc(scene.purpose)}</span>
        <h3>${esc(scene.title)}</h3>
        <p>${esc(scene.beat)}</p>
        <p class="choice">${esc(scene.choice)}</p>
      </article>`).join("");
    root.innerHTML = `
      ${heading("Canon continuity / " + brief.brief_id, brief.title, brief.gm_direction,
        `<button type="button" data-action="copy-brief">Copy Markdown</button>
         <button type="button" data-action="generate-brief">Regenerate</button>
         <button type="button" class="primary-action" data-action="record">Record outcome</button>`)}
      <section class="brief-header">
        <p class="eyebrow">Objective</p>
        <h2>${esc(brief.objective.text)}</h2>
      </section>
      <div class="brief-columns">
        <section><div class="panel-heading"><h2>Stakes</h2><span>${brief.stakes.length} active</span></div><ul class="brief-list">${stakes}</ul></section>
        <section><div class="panel-heading"><h2>Continuity callbacks</h2><span>${brief.continuity_callbacks.length} source-closed</span></div><ol class="brief-list">${callbacks}</ol></section>
      </div>
      <section class="panel">
        <div class="panel-heading"><h2>Session beats</h2><span>${brief.scenes.length} scenes</span></div>
        <div class="scene-grid">${scenes}</div>
      </section>`;
  }

  function renderRecord(summary) {
    const targetOptions = summary.recordTargets.map((target) => `<option value="${esc(target.id)}">${esc(target.name)} / ${esc(target.type)}</option>`).join("");
    const adjuster = summary.clocks.map((clock) => {
      const adjustment = clockAdjustments[clock.id] ?? 0;
      const minimumDelta = -clock.value;
      const maximumDelta = clock.maximum - clock.value;
      return `
        <div class="clock-adjuster" data-clock="${esc(clock.id)}" data-min="${minimumDelta}" data-max="${maximumDelta}">
          <div><strong>${esc(clock.label)}</strong><small>${clock.value} / ${clock.maximum} now</small></div>
          <div class="stepper">
            <button type="button" data-step="-1" aria-label="Reduce ${esc(clock.label)}" title="Reduce">-</button>
            <output>${adjustment > 0 ? "+" : ""}${adjustment}</output>
            <button type="button" data-step="1" aria-label="Advance ${esc(clock.label)}" title="Advance">+</button>
          </div>
        </div>`;
    }).join("");
    root.innerHTML = `
      ${heading("Append-only session record", "Record the outcome", "Commit one consequence, its campaign target, and any pressure movement as a single Canon transaction.")}
      <div class="record-layout">
        <form id="outcome-form" class="record-form">
          <div class="field">
            <span>Outcome</span>
            <div class="choice-row">
              ${["victory", "costly_win", "setback"].map((value, index) => `<label><input type="radio" name="outcome" value="${value}"${index === 0 ? " checked" : ""}><span>${esc(humanize(value))}</span></label>`).join("")}
            </div>
          </div>
          <label class="field"><span>Campaign target</span><select id="outcome-target">${targetOptions}</select></label>
          <label class="field"><span>What became true?</span><textarea id="outcome-truth" required maxlength="480" placeholder="The ship cleared the reef, but the harbor guild learned who exposed its records."></textarea></label>
          <label class="field"><span>Next unresolved choice</span><input id="outcome-thread" required maxlength="240" placeholder="Decide who controls Gullwatch's true signal."></label>
          <div class="field"><span>Pressure movement</span>${adjuster}</div>
          <div class="form-actions">
            <button type="button" data-action="cancel-record">Cancel</button>
            <button type="submit" class="primary-action">Commit session</button>
          </div>
        </form>
        <aside class="record-context">
          <img src="assets/gullwatch-beacon-map-v1.jpg" alt="GM map of Gullwatch Beacon and its approaches">
          <dl>
            <dt>Current objective</dt><dd>${esc(summary.objective)}</dd>
            <dt>False Signal</dt><dd>${esc(summary.clockNotes.false_signal)}</dd>
            <dt>Flood Tide</dt><dd>${esc(summary.clockNotes.flood_tide)}</dd>
          </dl>
        </aside>
      </div>`;
  }

  function renderTimeline(summary) {
    const rows = summary.timeline.slice().reverse().map((entry) => `
      <article class="activity-row">
        <time>${esc(entry.label)}</time>
        <div><strong>${esc(entry.title)}</strong><p>${esc(entry.detail)}</p></div>
      </article>`).join("");
    root.innerHTML = `
      ${heading("Campaign history", "Timeline", "Recorded decisions and Canon state changes in reverse chronological order.",
        `<button type="button" class="primary-action" data-action="record">Record outcome</button>`)}
      <section class="panel"><div class="activity-list">${rows}</div></section>`;
  }

  function renderFactions(summary) {
    const factionFronts = summary.factionFronts;
    const postures = ["cooperative", "watchful", "strained", "hostile", "fractured"];
    const factions = factionFronts.factions.map((faction) => `
      <article class="faction-state-row">
        <div class="state-copy">
          <span>${esc(faction.archetype)} / ${esc(faction.id)}</span>
          <strong>${esc(faction.name)}</strong>
          <small>${esc(faction.project)}</small>
        </div>
        <label class="compact-field">
          <span>Posture</span>
          <select data-faction-posture="${esc(faction.id)}" aria-label="${esc(faction.name)} posture">
            ${postures.map((posture) => `<option value="${posture}"${posture === faction.posture ? " selected" : ""}>${esc(humanize(posture))}</option>`).join("")}
          </select>
        </label>
        <div class="state-stepper">
          <span>Project</span>
          <div class="stepper">
            <button type="button" data-faction-project="${esc(faction.id)}" data-step="-1" data-current="${faction.projectSegments}" data-max="${faction.projectMaximum}" aria-label="Reduce ${esc(faction.name)} project">-</button>
            <output>${faction.projectSegments} / ${faction.projectMaximum}</output>
            <button type="button" data-faction-project="${esc(faction.id)}" data-step="1" data-current="${faction.projectSegments}" data-max="${faction.projectMaximum}" aria-label="Advance ${esc(faction.name)} project">+</button>
          </div>
        </div>
      </article>`).join("");
    const fronts = factionFronts.fronts.map((front) => `
      <article class="front-state-row">
        <div class="state-copy">
          <span>${esc(front.type)} / ${esc(front.authoredStatus)} / ${esc(front.id)}</span>
          <strong>${esc(front.factionA.name)} / ${esc(front.factionB.name)}</strong>
        </div>
        <div class="state-stepper">
          <span>Pressure</span>
          <div class="stepper">
            <button type="button" data-front-pressure="${esc(front.id)}" data-step="-1" data-current="${front.pressure}" data-max="${front.pressureMaximum}" aria-label="Reduce ${esc(front.id)} pressure">-</button>
            <output>${front.pressure} / ${front.pressureMaximum}</output>
            <button type="button" data-front-pressure="${esc(front.id)}" data-step="1" data-current="${front.pressure}" data-max="${front.pressureMaximum}" aria-label="Advance ${esc(front.id)} pressure">+</button>
          </div>
        </div>
      </article>`).join("");
    root.innerHTML = `
      ${heading("Local faction continuity / validated state", "Faction Fronts", `Track ${factionFronts.region.name} pressure, posture, and projects inside this campaign save.`,
        `<button type="button" data-action="import-factions">Import browser state</button>
         <button type="button" data-action="export-factions">Export faction state</button>
         <button type="button" data-action="reset-factions">Reset faction state</button>`)}
      <div class="summary-meta">
        <span>${factionFronts.factions.length} factions</span>
        <span>${factionFronts.fronts.length} fronts</span>
        <span>${factionFronts.highPressureFronts} high pressure</span>
        <span>${factionFronts.advancedProjects} advanced projects</span>
      </div>
      <div class="faction-state-layout">
        <section>
          <div class="panel-heading"><h2>Faction posture and projects</h2><span>Saved locally</span></div>
          <div class="state-list">${factions}</div>
        </section>
        <section>
          <div class="panel-heading"><h2>Active fronts</h2><span>Pressure 0-6</span></div>
          <div class="state-list">${fronts}</div>
        </section>
      </div>`;
  }

  function renderCanon(summary) {
    const entities = summary.canonFocus.map((entry) => `
      <article class="canon-row">
        <span>${esc(entry.id)}</span>
        <div><strong>${esc(entry.name)}</strong><p>${esc(entry.type)} / ${esc(entry.detail)}</p></div>
      </article>`).join("");
    root.innerHTML = `
      ${heading("Portable state", "Campaign Canon", "The materialized registry and append-only ledger behind this campaign.",
        `<button type="button" data-action="copy-canon">Copy summary</button>
         <button type="button" class="primary-action" data-action="save">Save JSON</button>`)}
      <div class="summary-meta">
        <span>${summary.entityCount} entities</span><span>${summary.relationshipCount} relationships</span><span>${summary.eventCount} events</span><span>Schema ${esc(summary.schemaVersion)}</span>
      </div>
      <section class="panel"><div class="panel-heading"><h2>Active campaign records</h2><span>Source-closed</span></div><div class="canon-list">${entities}</div></section>`;
  }

  function renderKit(summary) {
    const products = summary.products.map((product) => `
      <article class="product-card">
        <span>${esc(product.price)} / optional module</span>
        <h3>${esc(product.product)}</h3>
        <p>${esc(product.label)}</p>
        <a href="${esc(product.url)}" target="_blank" rel="noopener">View standalone pack</a>
      </article>`).join("");
    root.innerHTML = `
      ${heading("Gullwatch Beacon / original system-neutral fantasy", "Source kit", summary.pitch)}
      <div class="source-layout">
        <div>
          <img class="source-map" src="assets/gullwatch-beacon-map-v1.jpg" alt="GM map of Gullwatch Beacon, broken bridge, tide pools, and lantern tower">
          <section class="panel"><div class="panel-heading"><h2>Optional world expansion</h2><span>Paid packs remain separate</span></div><div class="product-grid">${products}</div></section>
        </div>
        <div class="source-sections">
          <section><h2>GM truths</h2><ul>${summary.gmTruths.map((truth) => `<li>${esc(truth)}</li>`).join("")}</ul></section>
          <section><h2>Routes</h2><ul>${summary.routes.map((route) => `<li><strong>${esc(route.name)}:</strong> ${esc(route.risk)}</li>`).join("")}</ul></section>
          <section><h2>End states</h2><ul>${summary.endings.map((ending) => `<li>${esc(ending)}</li>`).join("")}</ul></section>
        </div>
      </div>`;
  }

  function bindViewEvents() {
    root.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", async () => {
      const action = button.dataset.action;
      if (action === "open-brief") setView("brief");
      if (action === "record") setView("record");
      if (action === "cancel-record") setView("overview");
      if (action === "generate-brief") {
        workspace = runtime.generateBrief(workspace);
        saveLocal();
        render();
        showToast("Next-session brief rebuilt from current Canon.");
      }
      if (action === "copy-brief") {
        await navigator.clipboard.writeText(runtime.briefToMarkdown(workspace.brief));
        showToast("GM brief copied as Markdown.");
      }
      if (action === "copy-canon") {
        await navigator.clipboard.writeText(runtime.toCampaignMarkdown(workspace));
        showToast("Campaign summary copied as Markdown.");
      }
      if (action === "save") downloadCampaign();
      if (action === "import-factions") {
        fileInput.dataset.intent = "factions";
        fileInput.click();
      }
      if (action === "export-factions") downloadFactionState();
      if (action === "reset-factions" && window.confirm("Reset all Saltglass faction pressure, posture, and projects to their authored defaults?")) {
        workspace = runtime.resetFactionState(workspace, new Date().toISOString());
        saveLocal();
        render();
        showToast("Faction state reset to authored defaults.");
      }
    }));

    root.querySelectorAll(".clock-adjuster button").forEach((button) => button.addEventListener("click", () => {
      const row = button.closest(".clock-adjuster");
      const clockId = row.dataset.clock;
      const next = (clockAdjustments[clockId] ?? 0) + Number(button.dataset.step);
      clockAdjustments[clockId] = Math.max(Number(row.dataset.min), Math.min(Number(row.dataset.max), next));
      row.querySelector("output").textContent = `${clockAdjustments[clockId] > 0 ? "+" : ""}${clockAdjustments[clockId]}`;
    }));

    const form = root.querySelector("#outcome-form");
    if (form) form.addEventListener("submit", (event) => {
      event.preventDefault();
      workspace = runtime.recordSession(workspace, {
        outcome: new FormData(form).get("outcome"),
        targetId: root.querySelector("#outcome-target").value,
        truth: root.querySelector("#outcome-truth").value.trim(),
        nextThread: root.querySelector("#outcome-thread").value.trim(),
        clockAdjustments
      });
      clockAdjustments = { flood_tide: 0, false_signal: 0 };
      saveLocal();
      activeView = "brief";
      renderNavigation();
      render();
      showToast(`Session ${workspace.session_number - 1} committed; the next brief is ready.`);
    });

    root.querySelectorAll("[data-faction-posture]").forEach((select) => select.addEventListener("change", () => {
      workspace = runtime.updateFactionState(workspace, {
        kind: "faction_posture",
        id: select.dataset.factionPosture,
        value: select.value
      }, new Date().toISOString());
      saveLocal();
      render();
      showToast("Faction posture saved locally.");
    }));

    root.querySelectorAll("[data-faction-project], [data-front-pressure]").forEach((button) => button.addEventListener("click", () => {
      const current = Number(button.dataset.current);
      const step = Number(button.dataset.step);
      const isProject = Boolean(button.dataset.factionProject);
      const id = button.dataset.factionProject ?? button.dataset.frontPressure;
      const maximum = Number(button.dataset.max);
      workspace = runtime.updateFactionState(workspace, {
        kind: isProject ? "faction_project_segments" : "front_pressure",
        id,
        value: Math.max(0, Math.min(maximum, current + step))
      }, new Date().toISOString());
      saveLocal();
      render();
      showToast(isProject ? "Faction project saved locally." : "Front pressure saved locally.");
    }));
  }

  function renderNavigation() {
    const summary = snapshot();
    document.querySelector("#campaign-title").textContent = summary.title;
    document.querySelector("#campaign-meta").textContent = `Session ${summary.sessionNumber} / Canon verified`;
    document.querySelector("#entity-count").textContent = `${summary.entityCount} entities`;
    document.querySelector("#event-count").textContent = `${summary.eventCount} events`;
    document.querySelectorAll("[data-view]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.view === activeView)));
  }

  function render() {
    const summary = snapshot();
    renderNavigation();
    if (activeView === "overview") renderOverview(summary);
    if (activeView === "brief") renderBrief(summary);
    if (activeView === "record") renderRecord(summary);
    if (activeView === "timeline") renderTimeline(summary);
    if (activeView === "factions") renderFactions(summary);
    if (activeView === "canon") renderCanon(summary);
    if (activeView === "kit") renderKit(summary);
    bindViewEvents();
  }

  function downloadCampaign() {
    const blob = new Blob([runtime.serialize(workspace)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${workspace.workspace_id}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Portable campaign JSON saved.");
  }

  function downloadFactionState() {
    const blob = new Blob([runtime.serializeFactionState(workspace)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "faction-fronts-coast-state.json";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Faction Fronts browser state saved.");
  }

  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.querySelector("#save-campaign").addEventListener("click", downloadCampaign);
  document.querySelector("#open-campaign").addEventListener("click", () => {
    delete fileInput.dataset.intent;
    fileInput.click();
  });
  document.querySelector("#reset-campaign").addEventListener("click", () => {
    workspace = runtime.createDefault(source, adventure, {
      seed: `gullwatch-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString()
    });
    saveLocal();
    activeView = "overview";
    render();
    showToast("New Gullwatch campaign created.");
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const factionImport = fileInput.dataset.intent === "factions" || runtime.isFactionStateDocument(parsed);
      workspace = parsed.document_type === "loot-table-works.campaign-start"
        ? runtime.createFromCampaignStart(source, adventure, parsed, { createdAt: new Date().toISOString() })
        : factionImport
          ? runtime.importFactionState(workspace, parsed, new Date().toISOString())
          : runtime.hydrate(parsed);
      saveLocal();
      activeView = factionImport ? "factions" : "overview";
      render();
      showToast(factionImport
        ? "Faction Fronts browser state imported."
        : parsed.document_type === "loot-table-works.campaign-start"
        ? "Campaign Start imported into Gullwatch."
        : "Campaign opened and validated.");
    } catch (error) {
      showToast(error.message);
    } finally {
      fileInput.value = "";
      delete fileInput.dataset.intent;
    }
  });

  try {
    if (!runtime || !source || !adventure) throw new Error("Campaign Workspace runtime data is unavailable.");
    workspace = loadOrCreate();
    render();
  } catch (error) {
    root.innerHTML = `<div class="empty-state"><div><h2>Campaign unavailable</h2><p>${esc(error.message)}</p></div></div>`;
  }
})();
