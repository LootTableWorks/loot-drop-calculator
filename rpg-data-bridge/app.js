(function () {
  "use strict";

  const core = window.RpgDataBridge;
  const sample = window.RpgDataBridgeSample;
  if (!core || !sample) throw new Error("RPG Data Bridge runtime failed to load.");

  const elements = {
    sourceModes: [...document.querySelectorAll("[data-source-mode]")],
    pastePanel: document.querySelector("#paste-panel"),
    filePanel: document.querySelector("#file-panel"),
    sourceText: document.querySelector("#source-text"),
    sourceFile: document.querySelector("#source-file"),
    fileStatus: document.querySelector("#file-status"),
    byteCount: document.querySelector("#byte-count"),
    format: document.querySelector("#format-select"),
    loadSample: document.querySelector("#load-sample"),
    loadFileSample: document.querySelector("#load-file-sample"),
    targetButtons: [...document.querySelectorAll("[data-target]")],
    generate: document.querySelector("#generate-code"),
    schemaHeading: document.querySelector("#schema-heading"),
    schemaFormat: document.querySelector("#schema-format"),
    schemaStats: document.querySelector("#schema-stats"),
    collectionList: document.querySelector("#collection-list"),
    warningList: document.querySelector("#warning-list"),
    codeHeading: document.querySelector("#code-heading"),
    codeOutput: document.querySelector("#code-output"),
    copyCode: document.querySelector("#copy-code"),
    downloadCode: document.querySelector("#download-code"),
    downloadMapping: document.querySelector("#download-mapping"),
    moduleGrid: document.querySelector("#module-grid"),
    toast: document.querySelector("#toast")
  };

  const state = { sourceMode: "paste", target: core.TARGETS.TYPESCRIPT, fileText: "", fileName: "", result: null };
  const targetLabels = {
    [core.TARGETS.TYPESCRIPT]: "TypeScript interfaces",
    [core.TARGETS.UNITY]: "Unity C# serializable classes",
    [core.TARGETS.GODOT]: "Godot 4 Resource classes"
  };
  const targetFiles = {
    [core.TARGETS.TYPESCRIPT]: "rpg-data-bridge-types.ts",
    [core.TARGETS.UNITY]: "RpgDataBridgeTypes.cs",
    [core.TARGETS.GODOT]: "rpg_data_bridge_resources.gd"
  };

  function node(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = String(text);
    return element;
  }

  function showToast(message, isError) {
    elements.toast.textContent = message;
    elements.toast.classList.toggle("error", Boolean(isError));
    elements.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2400);
  }

  function currentSource() {
    return state.sourceMode === "file" ? { text: state.fileText, fileName: state.fileName } : { text: elements.sourceText.value, fileName: "pasted-data" };
  }

  function updateByteCount() {
    const bytes = core.utf8Bytes(currentSource().text);
    elements.byteCount.textContent = `${bytes.toLocaleString("en-US")} / ${core.MAX_FILE_BYTES.toLocaleString("en-US")} bytes`;
    elements.byteCount.classList.toggle("over-limit", bytes > core.MAX_FILE_BYTES);
  }

  function setSourceMode(mode) {
    state.sourceMode = mode;
    elements.sourceModes.forEach((button) => {
      const selected = button.dataset.sourceMode === mode;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    elements.pastePanel.hidden = mode !== "paste";
    elements.filePanel.hidden = mode !== "file";
    updateByteCount();
  }

  function setTarget(target, regenerate) {
    state.target = target;
    elements.targetButtons.forEach((button) => {
      const selected = button.dataset.target === target;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    elements.codeHeading.textContent = targetLabels[target];
    if (regenerate && state.result) {
      state.result.code = core.generateCode(state.result.analysis, target);
      state.result.target = target;
      elements.codeOutput.textContent = state.result.code;
    }
  }

  function renderStats(analysis) {
    const values = [analysis.collectionCount, analysis.recordCount, analysis.stableIds.length, analysis.relationships.length, analysis.warnings.length];
    [...elements.schemaStats.querySelectorAll("strong")].forEach((item, index) => { item.textContent = String(values[index]); });
  }

  function renderCollections(analysis) {
    const rows = analysis.collections.map((collection) => {
      const stable = analysis.stableIds.filter((item) => item.collection === collection.sourceName).map((item) => item.field);
      const relationships = analysis.relationships.filter((item) => item.collection === collection.sourceName).length;
      const row = node("div", "collection-row");
      const summary = node("div");
      summary.append(node("strong", "", collection.sourceName));
      summary.append(node("span", "", `${collection.recordCount} records / ${collection.fields.length} fields / IDs: ${stable.length ? stable.join(", ") : "none"} / refs: ${relationships}`));
      row.append(summary, node("em", "", collection.typeName));
      return row;
    });
    elements.collectionList.replaceChildren(...rows);
  }

  function renderWarnings(analysis) {
    if (analysis.warnings.length === 0) {
      elements.warningList.replaceChildren(node("p", "clean-copy", "No schema warnings detected."));
      return;
    }
    const warnings = analysis.warnings.map((warning) => {
      const item = node("article", "warning-item");
      item.append(node("strong", "", `${warning.code} / ${warning.path}`), node("p", "", warning.message));
      return item;
    });
    elements.warningList.replaceChildren(...warnings);
  }

  function renderResult(result) {
    const analysis = result.analysis;
    elements.schemaHeading.textContent = `${analysis.collectionCount} collection${analysis.collectionCount === 1 ? "" : "s"} mapped`;
    elements.schemaFormat.textContent = `${analysis.format} / ${analysis.bytes.toLocaleString("en-US")} bytes`;
    renderStats(analysis);
    renderCollections(analysis);
    renderWarnings(analysis);
    elements.codeOutput.textContent = result.code;
    elements.copyCode.disabled = false;
    elements.downloadCode.disabled = false;
    elements.downloadMapping.disabled = false;
  }

  function generate() {
    const source = currentSource();
    try {
      state.result = core.bridgeText(source.text, { format: elements.format.value, fileName: source.fileName, target: state.target });
      renderResult(state.result);
      showToast(`Generated ${targetLabels[state.target]} from ${state.result.analysis.recordCount} records.`, false);
    } catch (error) {
      state.result = null;
      elements.schemaHeading.textContent = "Source needs attention";
      elements.schemaFormat.textContent = "Not generated";
      elements.codeOutput.textContent = `Generation stopped: ${error.message}`;
      elements.copyCode.disabled = true;
      elements.downloadCode.disabled = true;
      elements.downloadMapping.disabled = true;
      showToast(error.message, true);
    }
  }

  function loadSample() {
    state.fileText = "";
    state.fileName = "";
    elements.sourceFile.value = "";
    elements.fileStatus.textContent = "No file selected";
    elements.sourceText.value = sample.text;
    setSourceMode("paste");
    elements.format.value = "json";
    updateByteCount();
    generate();
  }

  async function readFile(file) {
    if (!file) return;
    if (file.size > core.MAX_FILE_BYTES) {
      state.fileText = "";
      state.fileName = file.name;
      elements.fileStatus.textContent = `${file.name} rejected: ${file.size.toLocaleString("en-US")} bytes`;
      updateByteCount();
      showToast("File exceeds the strict 5,000,000-byte limit.", true);
      return;
    }
    try {
      state.fileText = await file.text();
      state.fileName = file.name;
      elements.fileStatus.textContent = `${file.name} / ${file.size.toLocaleString("en-US")} bytes`;
      updateByteCount();
    } catch (error) {
      state.fileText = "";
      elements.fileStatus.textContent = "The selected file could not be read.";
      showToast(error.message, true);
    }
  }

  async function copyCode() {
    if (!state.result) return;
    try {
      await navigator.clipboard.writeText(state.result.code);
      showToast("Generated code copied.", false);
    } catch (error) {
      showToast(`Copy failed: ${error.message}`, true);
    }
  }

  function downloadCode() {
    if (!state.result) return;
    const blob = new Blob([state.result.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = targetFiles[state.target];
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast(`Prepared ${targetFiles[state.target]}.`, false);
  }

  function downloadMapping() {
    if (!state.result) return;
    const mapping = core.generateMappingManifest(state.result.analysis);
    const blob = new Blob([mapping], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rpg-data-bridge-mapping.json";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Prepared deterministic field and relationship mapping.", false);
  }

  function renderModules() {
    const cards = core.PRODUCTS.map((product) => {
      const card = node("article", "module-card");
      card.append(node("span", "", "Public standalone / $3"), node("h3", "", product.title), node("p", "", product.detail));
      const link = node("a", "", "View module / $3");
      link.href = core.trackedProductUrl(product, "catalog");
      link.dataset.module = product.id;
      link.append(node("span", "", "Open"));
      card.append(link);
      return card;
    });
    elements.moduleGrid.replaceChildren(...cards);
  }

  elements.sourceModes.forEach((button) => button.addEventListener("click", () => setSourceMode(button.dataset.sourceMode)));
  elements.targetButtons.forEach((button) => button.addEventListener("click", () => setTarget(button.dataset.target, true)));
  elements.sourceText.addEventListener("input", updateByteCount);
  elements.sourceFile.addEventListener("change", () => readFile(elements.sourceFile.files[0]));
  elements.loadSample.addEventListener("click", loadSample);
  elements.loadFileSample.addEventListener("click", loadSample);
  elements.generate.addEventListener("click", generate);
  elements.copyCode.addEventListener("click", copyCode);
  elements.downloadCode.addEventListener("click", downloadCode);
  elements.downloadMapping.addEventListener("click", downloadMapping);

  renderModules();
  updateByteCount();
})();
