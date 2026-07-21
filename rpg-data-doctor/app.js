(function startRpgDataDoctor() {
  "use strict";

  const core = window.RpgDataDoctor;
  const sample = window.RpgDataDoctorSample;
  const elements = {
    sourceTabs: [...document.querySelectorAll("[data-source-mode]")],
    pastePanel: document.querySelector("#paste-source"),
    filePanel: document.querySelector("#file-source"),
    sourceText: document.querySelector("#source-text"),
    sourceFile: document.querySelector("#source-file"),
    fileStatus: document.querySelector("#file-status"),
    byteCount: document.querySelector("#byte-count"),
    format: document.querySelector("#format-select"),
    loadSample: document.querySelector("#load-sample"),
    loadSampleFile: document.querySelector("#load-sample-file"),
    runAudit: document.querySelector("#run-audit"),
    resetAudit: document.querySelector("#reset-audit"),
    auditTitle: document.querySelector("#audit-title"),
    auditMeta: document.querySelector("#audit-meta"),
    recordTotal: document.querySelector("#record-total"),
    criticalTotal: document.querySelector("#critical-total"),
    errorTotal: document.querySelector("#error-total"),
    warningTotal: document.querySelector("#warning-total"),
    findingTotal: document.querySelector("#finding-total"),
    copyReport: document.querySelector("#copy-report"),
    downloadReport: document.querySelector("#download-report"),
    viewTabs: [...document.querySelectorAll("[data-view]")],
    findingsView: document.querySelector("#findings-view"),
    reportView: document.querySelector("#report-view"),
    reportOutput: document.querySelector("#report-output"),
    severityButtons: [...document.querySelectorAll("[data-severity]")],
    categorySelect: document.querySelector("#category-select"),
    findingSearch: document.querySelector("#finding-search"),
    emptyState: document.querySelector("#empty-state"),
    findingsList: document.querySelector("#findings-list"),
    moduleSection: document.querySelector("#module-section"),
    moduleGrid: document.querySelector("#module-grid"),
    toast: document.querySelector("#toast")
  };

  const state = {
    sourceMode: "paste",
    fileText: "",
    fileName: "pasted-data",
    result: null,
    severity: "all",
    category: "all",
    search: ""
  };

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2400);
  }

  function formatBytes(bytes) {
    if (bytes < 1000) return `${bytes} bytes`;
    return `${(bytes / 1000).toFixed(bytes < 10000 ? 1 : 0)} kB`;
  }

  function setSourceMode(mode) {
    state.sourceMode = mode;
    elements.pastePanel.hidden = mode !== "paste";
    elements.filePanel.hidden = mode !== "file";
    elements.sourceTabs.forEach((button) => {
      const selected = button.dataset.sourceMode === mode;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function updateByteCount() {
    const bytes = core.byteLength(elements.sourceText.value);
    elements.byteCount.textContent = `${formatBytes(bytes)} / 1 MB`;
    elements.byteCount.classList.toggle("over-limit", bytes > core.MAX_FILE_BYTES);
  }

  function resultTitle(result) {
    if (result.summary.critical) return "Input blocked";
    if (result.summary.error) return "Repair required";
    if (result.summary.warning) return "Review advised";
    return "Structural checks passed";
  }

  function resetCategoryOptions(result) {
    elements.categorySelect.replaceChildren();
    const all = node("option", "", "All categories");
    all.value = "all";
    elements.categorySelect.append(all);
    result.categories.forEach((category) => {
      const option = node("option", "", category.charAt(0).toUpperCase() + category.slice(1));
      option.value = category;
      elements.categorySelect.append(option);
    });
    state.category = "all";
    elements.categorySelect.value = "all";
  }

  function matchesFilters(finding) {
    if (state.severity !== "all" && finding.severity !== state.severity) return false;
    if (state.category !== "all" && finding.category !== state.category) return false;
    if (!state.search) return true;
    const haystack = [finding.id, finding.category, finding.table, finding.recordId, finding.field, finding.message, finding.remediation].join(" ").toLowerCase();
    return haystack.includes(state.search);
  }

  function renderFindings() {
    elements.findingsList.replaceChildren();
    if (!state.result) {
      elements.emptyState.hidden = false;
      return;
    }
    const visible = state.result.findings.filter(matchesFilters);
    elements.emptyState.hidden = visible.length > 0;
    if (!visible.length) {
      const title = node("strong", "", state.result.findings.length ? "No findings match these filters" : "No structural findings detected");
      const detail = node("span", "", state.result.findings.length ? "Adjust severity, category, or search." : "Review project-specific schema and balance rules before shipping.");
      elements.emptyState.replaceChildren(title, detail);
      elements.emptyState.hidden = false;
      return;
    }

    visible.forEach((finding) => {
      const article = node("article", `finding finding-${finding.severity}`);
      const severity = node("span", "severity-label", finding.severity);
      const identity = node("div", "finding-identity");
      identity.append(node("strong", "", finding.id), node("span", "", finding.category));
      const heading = node("div", "finding-heading");
      heading.append(severity, identity);
      const message = node("p", "finding-message", finding.message);
      const location = node("code", "finding-location", `${finding.table} / ${finding.recordId} / ${finding.field}`);
      const fix = node("div", "remediation");
      fix.append(node("strong", "", "Remediation"), node("p", "", finding.remediation));
      article.append(heading, message, location, fix);
      elements.findingsList.append(article);
    });
  }

  function renderRecommendations() {
    elements.moduleGrid.replaceChildren();
    if (!state.result || !state.result.recommendations.length || state.result.summary.critical) {
      elements.moduleSection.hidden = true;
      return;
    }
    state.result.recommendations.forEach((product) => {
      const article = node("article", "module-card");
      article.append(
        node("span", "module-proof", product.proof),
        node("h3", "", product.title),
        node("p", "", product.description)
      );
      const link = node("a", "module-link", "View standalone module · $3");
      link.href = core.trackedProductUrl(product, "results");
      link.target = "_blank";
      link.rel = "noopener sponsored";
      link.dataset.module = product.id;
      link.dataset.placement = `results_${product.id}`;
      article.append(link);
      elements.moduleGrid.append(article);
    });
    elements.moduleSection.hidden = false;
  }

  function renderResult(result) {
    state.result = result;
    elements.auditTitle.textContent = resultTitle(result);
    elements.auditMeta.textContent = `${result.meta.fileName} · ${result.meta.format.toUpperCase()} · ${result.meta.tableCount} tables · ${formatBytes(result.meta.bytes)}`;
    elements.recordTotal.textContent = String(result.meta.recordCount);
    elements.criticalTotal.textContent = String(result.summary.critical);
    elements.errorTotal.textContent = String(result.summary.error);
    elements.warningTotal.textContent = String(result.summary.warning);
    elements.findingTotal.textContent = String(result.summary.total);
    elements.reportOutput.textContent = result.report;
    elements.copyReport.disabled = false;
    elements.downloadReport.disabled = false;
    resetCategoryOptions(result);
    renderFindings();
    renderRecommendations();
  }

  function runAudit() {
    const text = state.sourceMode === "file" ? state.fileText : elements.sourceText.value;
    const fileName = state.sourceMode === "file" ? state.fileName : state.fileName === sample.name ? sample.name : "pasted-data";
    const result = core.auditText(text, { format: elements.format.value, fileName });
    renderResult(result);
  }

  function loadSample() {
    elements.sourceText.value = sample.text;
    elements.format.value = "json";
    state.fileText = sample.text;
    state.fileName = sample.name;
    elements.fileStatus.textContent = `${sample.name} · ${formatBytes(core.byteLength(sample.text))}`;
    updateByteCount();
    runAudit();
    showToast("Original sample loaded and audited");
  }

  async function handleFile(file) {
    if (!file) return;
    if (file.size > core.MAX_FILE_BYTES) {
      state.fileText = "";
      state.fileName = file.name;
      elements.fileStatus.textContent = `${file.name} · rejected (${formatBytes(file.size)})`;
      renderResult(core.auditText("", { fileName: file.name, format: elements.format.value }));
      showToast("File rejected: 1 MB limit");
      return;
    }
    const extension = file.name.toLowerCase().split(".").pop();
    if (!new Set(["json", "csv"]).has(extension)) {
      state.fileText = "";
      state.fileName = file.name;
      elements.fileStatus.textContent = `${file.name} · rejected (JSON or CSV only)`;
      showToast("Choose a JSON or CSV file");
      return;
    }
    state.fileText = await file.text();
    state.fileName = file.name;
    elements.fileStatus.textContent = `${file.name} · ${formatBytes(file.size)}`;
    if (elements.format.value === "auto") elements.format.value = extension;
    runAudit();
  }

  async function copyReport() {
    if (!state.result) return;
    try {
      await navigator.clipboard.writeText(state.result.report);
      showToast("Audit report copied");
    } catch (_error) {
      const range = document.createRange();
      range.selectNodeContents(elements.reportOutput);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      showToast("Report selected for copying");
    }
  }

  function downloadReport() {
    if (!state.result) return;
    const safeName = state.result.meta.fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "rpg-data";
    const blob = new Blob([state.result.report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName}-audit.txt`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Audit report downloaded");
  }

  function reset() {
    state.fileText = "";
    state.fileName = "pasted-data";
    state.result = null;
    state.severity = "all";
    state.category = "all";
    state.search = "";
    elements.sourceText.value = "";
    elements.sourceFile.value = "";
    elements.fileStatus.textContent = "No file selected";
    elements.format.value = "auto";
    elements.findingSearch.value = "";
    elements.auditTitle.textContent = "Ready for a source file";
    elements.auditMeta.textContent = "Load the original sample or inspect your own JSON or CSV.";
    [elements.recordTotal, elements.criticalTotal, elements.errorTotal, elements.warningTotal, elements.findingTotal].forEach((element) => { element.textContent = "0"; });
    elements.reportOutput.textContent = "Run an audit to generate a portable text report.";
    elements.copyReport.disabled = true;
    elements.downloadReport.disabled = true;
    elements.moduleSection.hidden = true;
    elements.findingsList.replaceChildren();
    elements.emptyState.replaceChildren(node("img"), node("strong", "", "No audit loaded"), node("span", "", "Use the source controls to begin."));
    elements.emptyState.querySelector("img").src = "assets/loot-table-works-avatar-512.png";
    elements.emptyState.querySelector("img").alt = "";
    elements.emptyState.hidden = false;
    elements.severityButtons.forEach((button) => {
      const selected = button.dataset.severity === "all";
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    updateByteCount();
  }

  elements.sourceTabs.forEach((button) => button.addEventListener("click", () => setSourceMode(button.dataset.sourceMode)));
  elements.sourceText.addEventListener("input", () => {
    state.fileName = "pasted-data";
    updateByteCount();
  });
  elements.sourceFile.addEventListener("change", () => handleFile(elements.sourceFile.files[0]));
  elements.loadSample.addEventListener("click", loadSample);
  elements.loadSampleFile.addEventListener("click", loadSample);
  elements.runAudit.addEventListener("click", runAudit);
  elements.resetAudit.addEventListener("click", reset);
  elements.copyReport.addEventListener("click", copyReport);
  elements.downloadReport.addEventListener("click", downloadReport);
  elements.viewTabs.forEach((button) => button.addEventListener("click", () => {
    const report = button.dataset.view === "report";
    elements.findingsView.hidden = report;
    elements.reportView.hidden = !report;
    elements.viewTabs.forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle("active", active);
      if (active) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
  }));
  elements.severityButtons.forEach((button) => button.addEventListener("click", () => {
    state.severity = button.dataset.severity;
    elements.severityButtons.forEach((candidate) => {
      const selected = candidate === button;
      candidate.classList.toggle("selected", selected);
      candidate.setAttribute("aria-pressed", String(selected));
    });
    renderFindings();
  }));
  elements.categorySelect.addEventListener("change", () => { state.category = elements.categorySelect.value; renderFindings(); });
  elements.findingSearch.addEventListener("input", () => { state.search = elements.findingSearch.value.trim().toLowerCase(); renderFindings(); });

  updateByteCount();
})();
