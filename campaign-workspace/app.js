(function attachCampaignWorkspaceApp(globalScope) {
  "use strict";

  const STORAGE_KEY = "loot-table-works:gullwatch-campaign-workspace:v1";
  const BACKUP_STORAGE_KEY = `${STORAGE_KEY}:backup`;
  const PAGE_SESSION_NONCE_KEY = "loot-table-works:campaign-workspace:return-loop:page-session";
  const UNAVAILABLE_SESSION_NONCE = `page-${"0".repeat(32)}`;
  const RECOVERY_REQUIRED_CODE = "CAMPAIGN_RECOVERY_REQUIRED";

  function createRecoveryRequiredError(message) {
    const error = new Error(message);
    error.code = RECOVERY_REQUIRED_CODE;
    return error;
  }

  function decodeStoredWorkspace(raw, runtimeApi) {
    if (typeof raw !== "string" || raw.length === 0) {
      throw new Error("Stored campaign data is empty.");
    }
    return runtimeApi.hydrate(JSON.parse(raw));
  }

  function serializeValidatedWorkspace(value, runtimeApi) {
    const serialized = runtimeApi.serialize(value);
    decodeStoredWorkspace(serialized, runtimeApi);
    return serialized;
  }

  function createLocalJournal(storage, runtimeApi, keys = {}) {
    const primaryKey = keys.primaryKey ?? STORAGE_KEY;
    const backupKey = keys.backupKey ?? BACKUP_STORAGE_KEY;

    function inspect(raw) {
      try {
        return { valid: true, workspace: decodeStoredWorkspace(raw, runtimeApi), error: null };
      } catch (error) {
        return { valid: false, workspace: null, error };
      }
    }

    function load() {
      const primaryRaw = storage.getItem(primaryKey);
      const backupRaw = storage.getItem(backupKey);
      if (primaryRaw !== null) {
        const primary = inspect(primaryRaw);
        if (primary.valid) {
          return {
            workspace: primary.workspace,
            source: "primary",
            recovered: false,
            quarantineRaw: null,
            issue: null
          };
        }
        const backup = backupRaw === null ? null : inspect(backupRaw);
        return {
          workspace: backup?.valid ? backup.workspace : null,
          source: backup?.valid ? "backup" : "none",
          recovered: Boolean(backup?.valid),
          quarantineRaw: primaryRaw,
          issue: `The primary local save could not be opened: ${primary.error.message}`
        };
      }

      if (backupRaw !== null) {
        const backup = inspect(backupRaw);
        if (backup.valid) {
          return {
            workspace: backup.workspace,
            source: "backup",
            recovered: true,
            quarantineRaw: null,
            issue: "The primary local save was missing, so the validated backup was recovered."
          };
        }
      }

      return {
        workspace: null,
        source: "none",
        recovered: false,
        quarantineRaw: null,
        issue: null
      };
    }

    function commit(value, options = {}) {
      const serialized = serializeValidatedWorkspace(value, runtimeApi);
      const previousRaw = storage.getItem(primaryKey);
      let backupCandidate = null;

      if (previousRaw !== null) {
        const previous = inspect(previousRaw);
        if (!previous.valid && options.allowInvalidPrimaryReplacement !== true) {
          throw createRecoveryRequiredError(
            "Export or copy the unreadable primary save before replacing it with the recovered campaign."
          );
        }
        if (previous.valid) backupCandidate = previousRaw;
      } else {
        backupCandidate = serialized;
      }

      if (backupCandidate !== null) {
        storage.setItem(backupKey, backupCandidate);
        const writtenBackup = storage.getItem(backupKey);
        const verifiedBackup = inspect(writtenBackup);
        if (!verifiedBackup.valid || writtenBackup !== backupCandidate) {
          throw new Error("The local backup write could not be verified; the primary slot was left unchanged.");
        }
      }

      storage.setItem(primaryKey, serialized);
      const written = storage.getItem(primaryKey);
      const verified = inspect(written);
      if (!verified.valid || written !== serialized) {
        throw new Error("The local campaign write could not be verified; the validated backup was retained.");
      }
      return { serialized, workspace: verified.workspace };
    }

    return Object.freeze({
      primaryKey,
      backupKey,
      load,
      commit,
      inspect
    });
  }

  function tabIndexForKey(key, currentIndex, count) {
    if (!Number.isInteger(currentIndex) || count < 1) return null;
    if (key === "ArrowLeft") return (currentIndex - 1 + count) % count;
    if (key === "ArrowRight") return (currentIndex + 1) % count;
    if (key === "Home") return 0;
    if (key === "End") return count - 1;
    return null;
  }

  function applyTabState(tabs, panel, selectedView) {
    let selectedTab = null;
    tabs.forEach((tab) => {
      const selected = tab.dataset.view === selectedView;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) selectedTab = tab;
    });
    if (!selectedTab) throw new Error(`Unknown workspace view: ${selectedView}`);
    panel.setAttribute("aria-labelledby", selectedTab.id);
    return selectedTab;
  }

  function localDayIndex(value = new Date()) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new TypeError("A valid local date is required.");
    }
    return Math.floor(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86400000);
  }

  function producerClassFor(value) {
    if (value?.producer_start) return "campaign_launchpad";
    return "gullwatch";
  }

  function focusActionControl(scope, action) {
    const control = scope?.querySelector?.(`[data-action="${action}"]`);
    if (!control || typeof control.focus !== "function") return false;
    control.focus({ preventScroll: true });
    return true;
  }

  const testApi = Object.freeze({
    STORAGE_KEY,
    BACKUP_STORAGE_KEY,
    RECOVERY_REQUIRED_CODE,
    decodeStoredWorkspace,
    serializeValidatedWorkspace,
    createLocalJournal,
    tabIndexForKey,
    applyTabState,
    localDayIndex,
    producerClassFor,
    focusActionControl
  });
  globalScope.CampaignWorkspaceAppHelpers = testApi;
  if (typeof module !== "undefined" && module.exports) module.exports = testApi;
  if (typeof document === "undefined") return;

  const runtime = globalThis.CampaignWorkspaceRuntime;
  const source = globalThis.PlayerChronicleSource;
  const adventure = globalThis.GullwatchAdventureSource;
  const returnLoop = globalThis.CampaignWorkspaceReturnLoop;
  const root = document.querySelector("#workspace-view");
  const fileInput = document.querySelector("#campaign-file");
  const toast = document.querySelector("#toast");
  const recoveryPanel = document.querySelector("#recovery-panel");
  const recoveryMessage = document.querySelector("#recovery-message");
  const journal = createLocalJournal(localStorage, runtime); // Routes localStorage.setItem through validated journal writes.
  const validViews = new Set(["overview", "brief", "record", "timeline", "factions", "canon", "kit", "field-test"]);
  const requestedView = new URLSearchParams(window.location.search).get("view");
  let activeView = validViews.has(requestedView) ? requestedView : "overview";
  let workspace = null;
  let toastTimer = null;
  let clockAdjustments = { flood_tide: 0, false_signal: 0 };
  let recoveryState = null;
  let initialLoadResult = null;
  let returnMilestone = null;
  const pageSessionNonce = getPageSessionNonce();

  const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const humanize = (value) => String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  function createPageSessionNonce() {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
      return `page-${cryptoApi.randomUUID().replaceAll("-", "").toLowerCase()}`;
    }
    let token = "";
    for (let index = 0; index < 4; index += 1) {
      token += Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, "0");
    }
    return `page-${token}`;
  }

  function getPageSessionNonce() {
    try {
      const existing = sessionStorage.getItem(PAGE_SESSION_NONCE_KEY);
      if (existing && /^page-[0-9a-f]{32}$/.test(existing)) return existing;
      const created = createPageSessionNonce();
      sessionStorage.setItem(PAGE_SESSION_NONCE_KEY, created);
      return created;
    } catch {
      return UNAVAILABLE_SESSION_NONCE;
    }
  }

  function milestoneAttribution() {
    const params = new URLSearchParams(window.location.search);
    const token = (name) => {
      const raw = String(params.get(name) ?? "").slice(0, 64);
      const safe = raw.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^[^A-Za-z0-9]+/, "");
      return safe || null;
    };
    return {
      source: token("utm_source"),
      medium: token("utm_medium"),
      campaign: token("utm_campaign"),
      content: token("utm_content")
    };
  }

  function latestTargetKind(value) {
    const latest = value?.sessions?.at(-1);
    if (!latest) return null;
    const target = runtime.summarize(value).recordTargets.find((entry) => entry.id === latest.target_id);
    return target?.type ?? null;
  }

  function readMilestone() {
    try {
      const raw = localStorage.getItem(returnLoop.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      returnLoop.createReceipt(parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  function persistMilestone() {
    try {
      const serialized = JSON.stringify(returnMilestone);
      localStorage.setItem(returnLoop.STORAGE_KEY, serialized);
      const verified = JSON.parse(localStorage.getItem(returnLoop.STORAGE_KEY));
      returnLoop.createReceipt(verified);
      return JSON.stringify(verified) === serialized;
    } catch {
      return false;
    }
  }

  function createWorkspaceMilestone(value) {
    const sessionCount = Array.isArray(value?.sessions) ? value.sessions.length : 0;
    const input = {
      producerClass: producerClassFor(value),
      attribution: milestoneAttribution(),
      pageSessionNonce,
      dayIndex: localDayIndex(),
      startedOrImported: true,
      sessionCount
    };
    let next;
    try {
      next = returnLoop.createMilestone(input);
    } catch (error) {
      try {
        next = returnLoop.createMilestone({ ...input, attribution: null });
      } catch {
        throw error;
      }
    }
    if (sessionCount > 0) {
      next = returnLoop.recordMilestone(next, "expansion_recommended", {
        targetKind: latestTargetKind(value)
      });
    }
    return next;
  }

  function initializeMilestone(value, options = {}) {
    const sessionCount = Array.isArray(value?.sessions) ? value.sessions.length : 0;
    let existing = options.reset === true ? null : readMilestone();
    if (
      !existing ||
      existing.producer_class !== producerClassFor(value) ||
      existing.session_count > sessionCount
    ) {
      existing = createWorkspaceMilestone(value);
    } else if (sessionCount > existing.session_count) {
      existing = returnLoop.recordMilestone(existing, "session_committed", {
        sessionCount,
        targetKind: latestTargetKind(value)
      });
    } else if (sessionCount > 0 && existing.recommended_product_id === null) {
      existing = returnLoop.recordMilestone(existing, "expansion_recommended", {
        targetKind: latestTargetKind(value)
      });
    }
    if (options.startEvent) {
      existing = returnLoop.recordMilestone(existing, options.startEvent);
    }
    returnMilestone = existing;
    persistMilestone();
  }

  function recordReturnEvent(event, input = {}) {
    if (!returnMilestone) return false;
    const previous = returnMilestone;
    try {
      returnMilestone = returnLoop.recordMilestone(returnMilestone, event, input);
      if (persistMilestone()) return true;
      returnMilestone = previous;
      return false;
    } catch {
      returnMilestone = previous;
      return false;
    }
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function setSaveStatus(message) {
    const status = document.querySelector("#save-status");
    status.textContent = message;
  }

  function saveLocal(options = {}) {
    try {
      journal.commit(workspace, options);
      setSaveStatus("Saved locally");
      return true;
    } catch (error) {
      setSaveStatus(error.code === RECOVERY_REQUIRED_CODE ? "Recovery action required" : "Local save failed - export JSON");
      showToast(error.code === RECOVERY_REQUIRED_CODE
        ? error.message
        : `Local save failed; the last validated slot was retained. ${error.message}`);
      return false;
    }
  }

  function loadOrCreate() {
    initialLoadResult = journal.load();
    recoveryState = initialLoadResult.quarantineRaw === null ? null : {
      raw: initialLoadResult.quarantineRaw,
      issue: initialLoadResult.issue,
      exported: false
    };
    if (initialLoadResult.workspace) return initialLoadResult.workspace;
    return runtime.createDefault(source, adventure, {
      seed: "gullwatch-first-light",
      createdAt: new Date().toISOString()
    });
  }

  function snapshot() {
    return runtime.summarize(workspace);
  }

  function updateRecoveryPanel() {
    if (!recoveryState) {
      recoveryPanel.hidden = true;
      return;
    }
    recoveryPanel.hidden = false;
    recoveryMessage.textContent = `${recoveryState.issue} The unreadable bytes remain in the primary slot. Download or copy them before replacing that slot.`;
    document.querySelector("#replace-recovered-save").disabled = !recoveryState.exported;
  }

  function updateTabs() {
    return applyTabState(
      Array.from(document.querySelectorAll('[role="tab"][data-view]')),
      root,
      activeView
    );
  }

  function setView(view, options = {}) {
    if (!validViews.has(view)) throw new Error(`Unknown workspace view: ${view}`);
    activeView = view;
    render();
    const selectedTab = updateTabs();
    if (options.focus === "tab") selectedTab.focus({ preventScroll: true });
    else root.focus({ preventScroll: true });
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
      ${renderCloseout(summary)}
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
      </div>
      ${renderNextSessionPrintSheet(summary)}`;
  }

  function expansionForMilestone() {
    const selected = returnLoop.selectExpansion({ targetKind: latestTargetKind(workspace) });
    if (!returnMilestone?.recommended_product_id || selected.product_id === returnMilestone.recommended_product_id) {
      return selected;
    }
    const product = Object.values(returnLoop.PRODUCT_MAP)
      .find((entry) => entry.product_id === returnMilestone.recommended_product_id);
    return product
      ? {
          target_kind: null,
          product_id: product.product_id,
          title: product.title,
          price_usd: product.price_usd,
          reason: "This is the one approved expansion recorded for the latest session closeout.",
          url: product.url
        }
      : selected;
  }

  function canConfirmLaterReturn() {
    if (!returnMilestone) return false;
    try {
      return returnLoop.canConfirmSeparateReturn(returnMilestone, {
        pageSessionNonce,
        dayIndex: localDayIndex(),
        confirmed: true
      });
    } catch {
      return false;
    }
  }

  function renderCloseout(summary) {
    if (!summary.brief || !returnMilestone?.session_committed) return "";
    const expansion = expansionForMilestone();
    const preview = returnLoop.previewForProduct(expansion.product_id);
    const previewLines = preview.excerpt_lines
      .map((line) => `<li>${esc(line)}</li>`)
      .join("");
    const returnConfirmed = returnMilestone.separate_session_return_confirmed;
    const returnAvailable = !returnConfirmed && canConfirmLaterReturn();
    const recommendationAvailable =
      returnMilestone.portable_export && returnMilestone.next_session_copy_or_print;
    const returnStatus = returnConfirmed
      ? "A separate page-session return is recorded in the local receipt."
      : returnAvailable
        ? "This is a different page session on a later date. Confirm only if this is a real campaign return."
        : "Return confirmation unlocks in a new tab or browser session on a later date. Reloading this tab does not count.";
    return `
      <section class="session-closeout" aria-labelledby="session-closeout-title">
        <header class="closeout-heading">
          <div>
            <p class="eyebrow">Session ${returnMilestone.session_count} preserved</p>
            <h2 id="session-closeout-title">Close the table. Keep the world moving.</h2>
            <p>Your Canon transaction is saved. Take the portable campaign and next-session run sheet before leaving.</p>
          </div>
          <span>Local-first closeout</span>
        </header>
        <div class="closeout-primary-actions" aria-label="Primary session closeout actions">
          <button type="button" class="primary-action" data-action="closeout-save">
            <strong>Save campaign JSON</strong>
            <span>Portable campaign and Canon</span>
          </button>
          <button type="button" class="primary-action" data-action="closeout-copy">
            <strong>Copy next-session Markdown</strong>
            <span>Run sheet for your notes</span>
          </button>
          <button type="button" class="primary-action" data-action="closeout-print">
            <strong>Print next-session run sheet</strong>
            <span>Only the prepared session prints</span>
          </button>
        </div>
        <p class="local-ledger-note">
          Milestone data stays on this device under a separate local key until you explicitly copy or download a receipt.
          There is no account, hosted analytics, or automatic submission.
        </p>
        <div class="closeout-support">
          <section class="return-checkpoint" aria-labelledby="return-checkpoint-title">
            <p class="eyebrow">Later return</p>
            <h3 id="return-checkpoint-title">Confirm a separate session</h3>
            <p>${esc(returnStatus)}</p>
            ${returnConfirmed
              ? `<span class="return-confirmed">Later return confirmed locally</span>`
              : `<label class="return-consent">
                 <input id="confirm-later-return" type="checkbox"${returnAvailable ? "" : " disabled"}>
                   <span>I reopened this campaign for a later session.</span>
                 </label>
                 <button type="button" data-action="confirm-later-return" disabled>Confirm later return</button>`}
          </section>
          <section class="receipt-actions" aria-labelledby="receipt-actions-title">
            <p class="eyebrow">Optional local receipt</p>
            <h3 id="receipt-actions-title">Keep a content-free checkpoint receipt</h3>
            <p>This optional local receipt is not proof of play, return, demand, a paid visit, purchase, or revenue, and it is never sent automatically.</p>
            <details class="receipt-inventory">
              <summary>What the receipt includes and excludes</summary>
              <p>The receipt includes a random receipt ID, producer class, bounded route attribution, milestone booleans, session count, approved product IDs, and a coarse age bucket. It excludes campaign and player names; campaign, workspace, player, entity, transaction, event, mapping, source, and device IDs; campaign text; save contents; exact timestamps; credentials; and recovery data.</p>
            </details>
            <div>
              <button type="button" data-action="copy-receipt">Copy receipt</button>
              <button type="button" data-action="download-receipt">Download receipt</button>
            </div>
          </section>
        </div>
        <aside class="closeout-recommendation" aria-labelledby="closeout-recommendation-title">
          <div class="recommendation-preview-body">
            <div class="recommendation-overview">
              <p class="eyebrow">Optional / $${expansion.price_usd} standalone</p>
              <h3 id="closeout-recommendation-title">${esc(expansion.title)}</h3>
              <p class="recommendation-outcome">${esc(preview.immediate_outcome)}</p>
              <p class="compatibility-note"><strong>Compatibility:</strong> ${esc(preview.compatibility_note)}</p>
            </div>
            <section class="public-demo-excerpt" aria-labelledby="public-demo-excerpt-title">
              <p class="eyebrow">Public demo excerpt</p>
              <h4 id="public-demo-excerpt-title">${esc(preview.excerpt_title)}</h4>
              <ul>${previewLines}</ul>
              <p>${preview.demo_count} demo ${esc(preview.unit_label)} / ${preview.full_count} in the full kit</p>
            </section>
          </div>
          <div class="recommendation-action">
            ${recommendationAvailable
              ? `<a href="${esc(expansion.url)}" target="_blank" rel="noopener" data-action="paid-expansion" data-product-id="${esc(expansion.product_id)}">${esc(preview.cta_label)}</a>`
              : `<span class="recommendation-gate">Save + copy/print to unlock</span>`}
          </div>
        </aside>
      </section>`;
  }

  function renderNextSessionPrintSheet(summary) {
    const brief = summary.brief;
    if (!brief) return "";
    const stakes = brief.stakes.map((stake) =>
      `<li><strong>${esc(stake.urgency)}</strong><span>${esc(stake.text)}</span></li>`).join("");
    const callbacks = brief.continuity_callbacks.map((callback) =>
      `<li>${esc(callback.text)}</li>`).join("");
    const cast = (summary.cast ?? []).map((person) =>
      `<li><strong>${esc(person.name)}</strong><span>${esc(person.role)}</span><span>Wants: ${esc(person.wants)}</span></li>`).join("");
    const faction = brief.editorial_continuity?.faction_reaction;
    const factionLabel = faction?.faction_name
      ? `${faction.faction_name} / ${faction.posture}`
      : "No named faction";
    const factionConsequence = faction?.consequence
      ?? "No named faction consequence is active in this prepared brief.";
    const scenes = brief.scenes.map((scene) => `
      <article>
        <header><span>${String(scene.order).padStart(2, "0")}</span><div><small>${esc(scene.purpose)}</small><h2>${esc(scene.title)}</h2></div></header>
        <p>${esc(scene.beat)}</p>
        <p><strong>Choice:</strong> ${esc(scene.choice)}</p>
      </article>`).join("");
    return `
      <section class="next-session-print-sheet" aria-hidden="true">
        <header class="print-sheet-heading">
          <p>Loot Table Works / Campaign Workspace</p>
          <h1>${esc(brief.title)}</h1>
          <span>Session ${summary.sessionNumber} / ${esc(summary.title)}</span>
        </header>
        <section class="print-objective">
          <small>Objective</small>
          <h2>${esc(brief.objective.text)}</h2>
          <p>${esc(brief.gm_direction)}</p>
        </section>
        <div class="print-brief-grid">
          <section><h2>Stakes</h2><ul>${stakes}</ul></section>
          <section><h2>Continuity callbacks</h2><ol>${callbacks}</ol></section>
        </div>
        <div class="print-continuity-grid">
          <section class="print-cast"><h2>Cast</h2><ul>${cast}</ul></section>
          <section class="print-faction"><h2>Faction consequence</h2><strong>${esc(factionLabel)}</strong><p>${esc(factionConsequence)}</p></section>
        </div>
        <section class="print-scenes"><h2>Session beats</h2>${scenes}</section>
      </section>`;
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
      ${renderCloseout(summary)}
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
      </section>
      ${renderNextSessionPrintSheet(summary)}`;
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
          <section>
            <h2>Creation disclosure</h2>
            <p>Loot Table Works used generative AI assistance during development and editorial production. The released content and code were human-directed and QA-reviewed. This tool runs locally and does not call an AI service or upload campaign data.</p>
            <p><a href="USAGE-TERMS.md">Usage terms</a></p>
          </section>
        </div>
      </div>`;
  }

  function feedbackAttribution() {
    const params = new URLSearchParams(window.location.search);
    const clean = (name) => String(params.get(name) ?? "not provided")
      .replace(/[\r\n\t]+/g, " ")
      .slice(0, 80);
    return {
      source: clean("utm_source"),
      medium: clean("utm_medium"),
      campaign: clean("utm_campaign"),
      content: clean("utm_content")
    };
  }

  function feedbackTemplate() {
    const attribution = feedbackAttribution();
    return [
      "Loot Table Works Campaign Workspace field report",
      "",
      `Workspace code: ${workspace.workspace_id}`,
      `Source: ${attribution.source} / ${attribution.medium}`,
      `Campaign: ${attribution.campaign} / ${attribution.content}`,
      "",
      "Completed (replace [ ] with [x]):",
      "[ ] Started or imported a campaign",
      "[ ] Recorded one session outcome",
      "[ ] Saved or exported campaign state",
      "[ ] Reopened the campaign for a later session",
      "",
      "Most useful result:",
      "",
      "Where I became confused or stopped:",
      "",
      "What was missing for my next session:",
      "",
      "Which optional $3 expansion, if any, would be useful and why:",
      "",
      "May Loot Table Works quote this feedback anonymously? Yes / No",
      "",
      "Please do not include private campaign or player information."
    ].join("\n");
  }

  function renderFieldTest(summary) {
    const subject = encodeURIComponent("Campaign Workspace field report");
    const body = encodeURIComponent(feedbackTemplate());
    root.innerHTML = `
      ${heading("Ten-minute external workflow check", "GM field test", "Run one real campaign task, preserve the result, and report the exact point where the workflow helps or fails.")}
      <section class="field-test-intro">
        <div>
          <p class="eyebrow">Current workspace</p>
          <h2>${esc(summary.title)}</h2>
          <p>Session ${summary.sessionNumber}; ${summary.eventCount} recorded Canon events. Use your own table workflow or the included Gullwatch start.</p>
        </div>
        <div class="privacy-note">
          <strong>Private by default</strong>
          <p>No analytics run here. The report stays on your device until you choose Copy or Email, and you can remove the workspace code or attribution before sending.</p>
        </div>
      </section>
      <ol class="field-test-steps">
        <li><span>01</span><div><strong>Start</strong><p>Use this Gullwatch campaign or import a Campaign Start JSON.</p></div></li>
        <li><span>02</span><div><strong>Record</strong><p>Commit one victory, costly win, or setback with a concrete campaign truth.</p></div></li>
        <li><span>03</span><div><strong>Preserve</strong><p>Save portable JSON and confirm that the next-session brief reflects the outcome.</p></div></li>
        <li><span>04</span><div><strong>Return</strong><p>Reopen the save for a later session and note the first point of friction.</p></div></li>
      </ol>
      <section class="field-test-report">
        <div>
          <p class="eyebrow">Evidence that changes the product</p>
          <h2>Send one concrete field report</h2>
          <p>Completion checkboxes, one useful result, one point of confusion, one missing need, and the relevance of an optional $3 expansion are enough.</p>
        </div>
        <div class="field-test-actions">
          <button type="button" data-action="copy-field-report">Copy report template</button>
          <a class="primary-action" href="mailto:loottableworks@gmail.com?subject=${subject}&amp;body=${body}">Email field report</a>
        </div>
      </section>`;
  }

  function bindViewEvents() {
    root.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", async (event) => {
      const action = button.dataset.action;
      if (action === "open-brief") setView("brief");
      if (action === "record") setView("record");
      if (action === "cancel-record") setView("overview");
      if (action === "generate-brief") {
        workspace = runtime.generateBrief(workspace);
        const saved = saveLocal();
        render();
        if (saved) showToast("Next-session brief rebuilt from current Canon.");
      }
      if (action === "copy-brief") {
        try {
          await navigator.clipboard.writeText(runtime.briefToMarkdown(workspace.brief));
        } catch {
          showToast("The GM brief could not be copied. Use Save JSON or Print instead.");
          return;
        }
        const recorded = recordReturnEvent("next_session_copied");
        if (recorded) render();
        showToast(recorded
          ? "GM brief copied as Markdown; local closeout updated."
          : "GM brief copied. The local closeout milestone was not updated.");
      }
      if (action === "closeout-save") downloadCampaign();
      if (action === "closeout-copy") {
        try {
          await navigator.clipboard.writeText(runtime.briefToMarkdown(workspace.brief));
        } catch {
          showToast("The next-session run sheet could not be copied. Use Save JSON or Print instead.");
          return;
        }
        const recorded = recordReturnEvent("next_session_copied");
        if (recorded) render();
        showToast(recorded
          ? "Next-session run sheet copied; local closeout updated."
          : "Next-session run sheet copied. The local closeout milestone was not updated.");
      }
      if (action === "closeout-print") printNextSession();
      if (action === "copy-receipt") {
        try {
          await navigator.clipboard.writeText(currentReceiptText());
          showToast("Content-free local receipt copied.");
        } catch {
          showToast("The local receipt could not be copied.");
        }
      }
      if (action === "download-receipt") {
        try {
          downloadText(
            currentReceiptText(),
            `${returnMilestone.receipt_id}.json`,
            "application/json"
          );
          showToast("Content-free local receipt downloaded.");
        } catch {
          showToast("The local receipt could not be downloaded.");
        }
      }
      if (action === "confirm-later-return") confirmLaterReturn();
      if (action === "paid-expansion") {
        const recorded = recordReturnEvent("paid_expansion_clicked", { productId: button.dataset.productId });
        if (!recorded) {
          event.preventDefault();
          showToast("Save the campaign and copy or print the run sheet before opening the expansion.");
        }
      }
      if (action === "copy-canon") {
        await navigator.clipboard.writeText(runtime.toCampaignMarkdown(workspace));
        showToast("Campaign summary copied as Markdown.");
      }
      if (action === "copy-field-report") {
        await navigator.clipboard.writeText(feedbackTemplate());
        showToast("Field report template copied.");
      }
      if (action === "save") downloadCampaign();
      if (action === "import-factions") {
        fileInput.dataset.intent = "factions";
        fileInput.click();
      }
      if (action === "export-factions") downloadFactionState();
      if (action === "reset-factions" && window.confirm("Reset all Saltglass faction pressure, posture, and projects to their authored defaults?")) {
        workspace = runtime.resetFactionState(workspace, new Date().toISOString());
        const saved = saveLocal();
        render();
        if (saved) showToast("Faction state reset to authored defaults.");
      }
    }));

    const returnConsent = root.querySelector("#confirm-later-return");
    const returnButton = root.querySelector('[data-action="confirm-later-return"]');
    if (returnConsent && returnButton) {
      returnConsent.addEventListener("change", () => {
        returnButton.disabled = !returnConsent.checked;
      });
    }

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
      const previousWorkspace = workspace;
      const targetId = root.querySelector("#outcome-target").value;
      const targetKind = snapshot().recordTargets.find((target) => target.id === targetId)?.type ?? null;
      workspace = runtime.recordSession(previousWorkspace, {
        outcome: new FormData(form).get("outcome"),
        targetId,
        truth: root.querySelector("#outcome-truth").value.trim(),
        nextThread: root.querySelector("#outcome-thread").value.trim(),
        clockAdjustments
      });
      const saved = saveLocal();
      if (!saved) {
        workspace = previousWorkspace;
        return;
      }
      clockAdjustments = { flood_tide: 0, false_signal: 0 };
      const milestoneRecorded = recordReturnEvent("session_committed", {
        sessionCount: workspace.sessions.length,
        targetKind
      });
      activeView = "brief";
      render();
      showToast(milestoneRecorded
        ? `Session ${workspace.session_number - 1} committed; closeout and the next brief are ready.`
        : `Session ${workspace.session_number - 1} committed, but the local closeout milestone was not recorded.`);
    });

    root.querySelectorAll("[data-faction-posture]").forEach((select) => select.addEventListener("change", () => {
      workspace = runtime.updateFactionState(workspace, {
        kind: "faction_posture",
        id: select.dataset.factionPosture,
        value: select.value
      }, new Date().toISOString());
      const saved = saveLocal();
      render();
      if (saved) showToast("Faction posture saved locally.");
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
      const saved = saveLocal();
      render();
      if (saved) showToast(isProject ? "Faction project saved locally." : "Front pressure saved locally.");
    }));
  }

  function renderNavigation() {
    const summary = snapshot();
    document.querySelector("#campaign-title").textContent = summary.title;
    document.querySelector("#campaign-meta").textContent = `Session ${summary.sessionNumber} / Canon structure checked locally`;
    document.querySelector("#entity-count").textContent = `${summary.entityCount} entities`;
    document.querySelector("#event-count").textContent = `${summary.eventCount} events`;
    updateTabs();
    updateRecoveryPanel();
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
    if (activeView === "field-test") renderFieldTest(summary);
    bindViewEvents();
  }

  function currentReceiptText() {
    const receipt = returnLoop.createReceipt(returnMilestone);
    returnLoop.assertReceiptSafe(receipt);
    return returnLoop.serializeReceipt(receipt);
  }

  function confirmLaterReturn() {
    const checkbox = root.querySelector("#confirm-later-return");
    if (!checkbox?.checked) {
      showToast("Confirm that this is a real later return first.");
      return;
    }
    const previous = returnMilestone;
    try {
      returnMilestone = returnLoop.confirmSeparateReturn(returnMilestone, {
        pageSessionNonce,
        dayIndex: localDayIndex(),
        confirmed: true
      });
      if (!persistMilestone()) {
        returnMilestone = previous;
        showToast("The later return was not recorded because local receipt storage could not be verified.");
        return;
      }
      render();
      showToast("Later return confirmed in the content-free local receipt.");
    } catch (error) {
      returnMilestone = previous;
      showToast(error.message);
    }
  }

  function printNextSession() {
    if (!workspace.brief) {
      showToast("Build a next-session brief before printing.");
      return;
    }
    const recorded = recordReturnEvent("next_session_printed");
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove("printing-next-session");
      if (recorded) render();
      focusActionControl(root, "closeout-print");
    };
    document.body.classList.add("printing-next-session");
    window.addEventListener("afterprint", cleanup, { once: true });
    try {
      window.print();
      showToast(recorded
        ? "Next-session run sheet opened for printing; local closeout updated."
        : "Next-session run sheet opened for printing. The local closeout milestone was not updated.");
    } finally {
      window.setTimeout(cleanup, 1000);
    }
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
    const recorded = recordReturnEvent("portable_exported");
    if (recorded) render();
    showToast(recorded
      ? "Portable campaign JSON saved; local closeout updated."
      : "Portable campaign JSON saved. No closeout export milestone was recorded.");
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

  function downloadText(contents, filename, type = "text/plain") {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const tabs = Array.from(document.querySelectorAll('[role="tab"][data-view]'));
  tabs.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view, { focus: "tab" }));
    button.addEventListener("keydown", (event) => {
      const targetIndex = tabIndexForKey(event.key, tabs.indexOf(button), tabs.length);
      if (targetIndex === null) return;
      event.preventDefault();
      setView(tabs[targetIndex].dataset.view, { focus: "tab" });
    });
  });
  document.querySelector("#download-recovery-data").addEventListener("click", () => {
    if (!recoveryState) return;
    downloadText(recoveryState.raw, "gullwatch-unreadable-local-save.txt");
    recoveryState.exported = true;
    updateRecoveryPanel();
    showToast("Unreadable local-save bytes downloaded. Replacement is now available.");
  });
  document.querySelector("#copy-recovery-data").addEventListener("click", async () => {
    if (!recoveryState) return;
    try {
      await navigator.clipboard.writeText(recoveryState.raw);
      recoveryState.exported = true;
      updateRecoveryPanel();
      showToast("Unreadable local-save bytes copied. Replacement is now available.");
    } catch (error) {
      showToast(`Recovery copy failed: ${error.message}`);
    }
  });
  document.querySelector("#replace-recovered-save").addEventListener("click", () => {
    if (!recoveryState?.exported) return;
    if (!saveLocal({ allowInvalidPrimaryReplacement: true })) return;
    recoveryState = null;
    updateRecoveryPanel();
    showToast("The recovered campaign replaced the unreadable primary; the backup remains available.");
  });
  document.querySelector("#save-campaign").addEventListener("click", downloadCampaign);
  document.querySelector("#open-campaign").addEventListener("click", () => {
    delete fileInput.dataset.intent;
    fileInput.click();
  });
  document.querySelector("#reset-campaign").addEventListener("click", () => {
    const previousWorkspace = workspace;
    workspace = runtime.createDefault(source, adventure, {
      seed: `gullwatch-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString()
    });
    if (!saveLocal()) {
      workspace = previousWorkspace;
      return;
    }
    initializeMilestone(workspace, { reset: true, startEvent: "campaign_started" });
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
      const previousWorkspace = workspace;
      workspace = parsed.document_type === "loot-table-works.campaign-start"
        ? runtime.createFromCampaignStart(source, adventure, parsed, { createdAt: new Date().toISOString() })
        : factionImport
          ? runtime.importFactionState(workspace, parsed, new Date().toISOString())
          : runtime.hydrate(parsed);
      const saved = saveLocal();
      if (!saved) {
        workspace = previousWorkspace;
        return;
      }
      if (!factionImport) {
        initializeMilestone(workspace, { reset: true, startEvent: "campaign_imported" });
      }
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
    if (!runtime || !source || !adventure || !returnLoop) {
      throw new Error("Campaign Workspace runtime data is unavailable.");
    }
    workspace = loadOrCreate();
    initializeMilestone(workspace, {
      startEvent: initialLoadResult.source === "none" ? "campaign_started" : "campaign_imported"
    });
    if (initialLoadResult.recovered) {
      setSaveStatus("Recovered validated backup");
      showToast(initialLoadResult.issue);
    } else if (recoveryState) {
      setSaveStatus("Recovery action required");
      showToast("The local save is unreadable. Recovery actions are available.");
    }
    render();
  } catch (error) {
    root.innerHTML = `<div class="empty-state"><div><h2>Campaign unavailable</h2><p>${esc(error.message)}</p></div></div>`;
  }
})(globalThis);
