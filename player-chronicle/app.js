(function startPlayerChronicleApp() {
  "use strict";

  const core = window.PlayerChronicleCore;
  const source = window.PlayerChronicleSource;
  const state = { role: "trail_reader", focus: "quest", outcome: "costly_win", downtime: "recover", chronicle: null, importedParty: null };
  const byId = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function toast(message) {
    const element = byId("toast");
    element.textContent = message;
    element.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => element.classList.remove("show"), 2600);
  }

  function setPressed(containerId, dataKey, value) {
    document.querySelectorAll(`#${containerId} [data-${dataKey}]`).forEach((button) => button.setAttribute("aria-pressed", String(button.dataset[dataKey] === value)));
  }

  function trackedUrl(product) {
    const url = new URL(product.url);
    url.searchParams.set("utm_source", "github_pages");
    url.searchParams.set("utm_medium", "free_tool_cross_sell");
    url.searchParams.set("utm_campaign", "world_foundry_player_chronicle");
    url.searchParams.set("utm_content", `chronicle_${product.id}`);
    return url.toString();
  }

  function renderTimeline() {
    const chronicle = state.chronicle;
    if (!chronicle.sessions.length) {
      byId("timeline-panel").innerHTML = `<div class="empty-timeline"><span>Session 01</span><h3>The first consequence starts here</h3><p>Record what mattered, how it ended, and what your character does before the next session.</p><button type="button" data-open-session>Record first session</button></div>`;
      return;
    }
    byId("timeline-panel").innerHTML = `<ol class="timeline">${chronicle.sessions.map((session) => `
      <li class="timeline-entry">
        <div class="timeline-marker"><span>${String(session.number).padStart(2, "0")}</span></div>
        <article>
          <div class="entry-heading"><div><p>${escapeHtml(session.focus_label)}</p><h3>${escapeHtml(session.outcome_label)}</h3></div><span>${escapeHtml(session.downtime_label)}</span></div>
          <p class="recap">${escapeHtml(session.recap)}</p>
          <dl class="entry-details"><div><dt>Reflect</dt><dd>${escapeHtml(session.reflection_question)}</dd></div><div><dt>Downtime</dt><dd>${escapeHtml(session.downtime_prompt)}</dd></div><div><dt>Next intention</dt><dd>${escapeHtml(session.next_intention)}</dd></div>${session.note ? `<div><dt>Your note</dt><dd>${escapeHtml(session.note)}</dd></div>` : ""}</dl>
          <div class="state-delta"><span>Momentum ${session.state_after.momentum}</span><span>Strain ${session.state_after.strain}</span><span>Bond ${session.state_after.bond}</span><span>Reputation ${session.state_after.reputation}</span></div>
        </article>
      </li>`).join("")}</ol>`;
  }

  function renderProducts() {
    byId("recommendation-grid").innerHTML = core.recommendProducts(state.chronicle, 6).map((product) => `<a href="${trackedUrl(product)}" target="_blank" rel="noopener"><span>${escapeHtml(product.proof)}</span><strong>${escapeHtml(product.title)}</strong><small>Production module / $3</small></a>`).join("");
  }

  function render() {
    const chronicle = state.chronicle;
    const character = chronicle.character;
    byId("character-title").textContent = character.name;
    byId("character-meta").textContent = `${character.role} / ${character.pronouns} / ${chronicle.chronicle_id}`;
    byId("stat-session").textContent = chronicle.sessions.length;
    byId("stat-momentum").textContent = chronicle.state.momentum;
    byId("stat-strain").textContent = chronicle.state.strain;
    byId("stat-bond").textContent = chronicle.state.bond;
    byId("stat-reputation").textContent = chronicle.state.reputation;
    byId("contribution").textContent = character.contribution;
    byId("edge").textContent = character.edge;
    byId("burden").textContent = character.burden;
    byId("signature-item").textContent = `${character.signature_item.name} [${character.signature_item.item_id}]`;
    byId("home-base").textContent = `${character.home_base.name} [${character.home_base.location_id}]`;
    byId("campaign-stake").textContent = character.campaign_stake;
    byId("session-heading").textContent = chronicle.sessions.length >= 12 ? "Chronicle complete" : `Record session ${chronicle.sessions.length + 1}`;
    byId("session-capacity").textContent = `${12 - chronicle.sessions.length} entries available`;
    byId("record-session").disabled = chronicle.sessions.length >= 12;
    byId("record-session").textContent = chronicle.sessions.length >= 12 ? "12-session chronicle complete" : "Add session to chronicle";
    byId("reference-ledger").innerHTML = chronicle.reference_ledger.map((id) => `<code>${escapeHtml(id)}</code>`).join("");
    byId("json-output").textContent = JSON.stringify(chronicle, null, 2);
    byId("validity").textContent = chronicle.validation.valid ? "Chronicle validated" : "Validation failed";
    byId("validity-dot").classList.toggle("invalid", !chronicle.validation.valid);
    renderTimeline();
    renderProducts();
  }

  function startChronicle() {
    try {
      const options = { seed: byId("seed").value, role: state.role, name: byId("character-name").value, pronouns: byId("pronouns").value };
      state.chronicle = core.create(options, source, state.importedParty, byId("imported-character").value || null);
      render();
      toast(state.importedParty ? "Imported character chronicle started." : "New chronicle started.");
    } catch (error) {
      toast(error.message);
    }
  }

  function recordSession() {
    try {
      state.chronicle = core.appendSession(state.chronicle, { focus: state.focus, outcome: state.outcome, downtime: state.downtime, note: byId("session-note").value }, source);
      byId("session-note").value = "";
      render();
      activateTab("timeline");
      toast(`Session ${state.chronicle.sessions.length} recorded. Save JSON to keep it.`);
    } catch (error) {
      toast(error.message);
    }
  }

  function activateTab(name) {
    document.querySelectorAll("[role=tab]").forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.tab === name)));
    ["timeline", "session", "data"].forEach((panel) => { byId(`${panel}-panel`).hidden = panel !== name; });
  }

  function download(filename, text, type) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type }));
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  async function copyText(text, success) {
    try { await navigator.clipboard.writeText(text); toast(success); } catch { toast("Clipboard access was blocked. Use the Data view instead."); }
  }

  async function importFile(file) {
    try {
      const value = JSON.parse(await file.text());
      if (value.generator === "Loot Table Works Player Chronicle") {
        state.chronicle = core.validateImport(value, source);
        state.importedParty = null;
        byId("imported-party").hidden = true;
        render();
        toast(`Loaded ${state.chronicle.sessions.length}-session chronicle.`);
        return;
      }
      if (!value.validation?.valid || !Array.isArray(value.characters)) throw new Error("Open a Player Chronicle or Character Foundry JSON file");
      state.importedParty = value;
      const select = byId("imported-character");
      select.innerHTML = value.characters.map((character) => `<option value="${escapeHtml(character.character_id)}">${escapeHtml(character.name)} / ${escapeHtml(character.role)}</option>`).join("");
      byId("imported-party").hidden = false;
      byId("start").textContent = "Start imported character";
      toast(`${value.characters.length} party members ready to import.`);
    } catch (error) {
      toast(error.message);
    } finally {
      byId("import-file").value = "";
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, [data-open-session]");
    if (!target) return;
    if (target.dataset.role) { state.role = target.dataset.role; state.importedParty = null; byId("imported-party").hidden = true; byId("start").textContent = "Start new chronicle"; setPressed("role-control", "role", state.role); }
    if (target.dataset.focus) { state.focus = target.dataset.focus; setPressed("focus-control", "focus", state.focus); }
    if (target.dataset.outcome) { state.outcome = target.dataset.outcome; setPressed("outcome-control", "outcome", state.outcome); }
    if (target.dataset.downtime) { state.downtime = target.dataset.downtime; setPressed("downtime-control", "downtime", state.downtime); }
    if (target.dataset.tab) activateTab(target.dataset.tab);
    if (target.hasAttribute("data-open-session")) activateTab("session");
  });

  byId("random-seed").addEventListener("click", () => { byId("seed").value = `journey-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`; startChronicle(); });
  byId("start").addEventListener("click", startChronicle);
  byId("record-session").addEventListener("click", recordSession);
  byId("import-file").addEventListener("change", (event) => { if (event.target.files[0]) importFile(event.target.files[0]); });
  byId("download-json").addEventListener("click", () => download(`${state.chronicle.character.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-chronicle.json`, JSON.stringify(state.chronicle, null, 2), "application/json"));
  byId("copy-markdown").addEventListener("click", () => copyText(core.toMarkdown(state.chronicle), "Markdown copied."));
  byId("print").addEventListener("click", () => window.print());
  byId("copy-link").addEventListener("click", () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("seed", state.chronicle.seed);
    url.searchParams.set("role", state.chronicle.character.role_id);
    url.searchParams.set("name", state.chronicle.character.name);
    url.searchParams.set("pronouns", state.chronicle.character.pronouns);
    copyText(url.toString(), "Start link copied. Session notes stay private.");
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("seed")) byId("seed").value = params.get("seed").slice(0, 64);
  if (params.get("name")) byId("character-name").value = params.get("name").slice(0, 48);
  if (params.get("pronouns")) byId("pronouns").value = params.get("pronouns").slice(0, 24);
  if (core.ROLES[params.get("role")]) { state.role = params.get("role"); setPressed("role-control", "role", state.role); }
  startChronicle();
})();
