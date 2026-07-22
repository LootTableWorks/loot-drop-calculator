(function startCampaignLaunchpad() {
  "use strict";

  const core = window.CampaignLaunchpadCore;
  if (!core) throw new Error("Campaign Launchpad core is missing");

  const state = { plan: null };
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  let toastTimer;

  function notify(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
  }

  function setPressed(groupId, key, value) {
    document.querySelectorAll(`#${groupId} [data-${key}]`).forEach((button) => {
      const selected = button.dataset[key] === value;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function readControls() {
    return core.normalizeOptions({
      seed: $("seed").value,
      scope: document.querySelector("#scope-control .selected")?.dataset.scope,
      spotlight: document.querySelector("#spotlight-control .selected")?.dataset.spotlight,
      party: $("party").value,
      tier: $("tier").value
    });
  }

  function writeUrl(options) {
    const url = new URL(window.location.href);
    url.search = "";
    for (const [key, value] of Object.entries(options)) url.searchParams.set(key, value);
    history.replaceState(null, "", url);
  }

  function loadUrl() {
    const params = new URLSearchParams(window.location.search);
    const options = core.normalizeOptions(Object.fromEntries(params.entries()));
    $("seed").value = options.seed;
    $("party").value = options.party;
    $("tier").value = options.tier;
    $("party-output").textContent = options.party;
    $("tier-output").textContent = options.tier;
    setPressed("scope-control", "scope", options.scope);
    setPressed("spotlight-control", "spotlight", options.spotlight);
  }

  function render(plan) {
    state.plan = plan;
    $("plan-title").textContent = plan.title;
    $("plan-id").textContent = `${plan.plan_id} / ${plan.options.seed}`;
    $("plan-promise").textContent = plan.promise;
    $("scope-summary").textContent = plan.scope_summary;
    $("tool-count").textContent = plan.validation.free_tool_routes;
    $("product-count").textContent = plan.validation.paid_destinations;
    $("party-count").textContent = plan.options.party;
    $("tools").innerHTML = plan.tools.map((tool) => `
      <article class="workflow-row">
        <span class="step-number">0${tool.step}</span>
        <div><p>${escapeHtml(tool.title)}</p><strong>${escapeHtml(tool.outcome)}</strong></div>
        <a href="${escapeHtml(tool.url)}">${escapeHtml(tool.cta)} <span aria-hidden="true">-&gt;</span></a>
      </article>`).join("");
    $("products").innerHTML = plan.products.map((product, index) => `
      <article class="product-card">
        <header><span>${escapeHtml(product.code)}</span><strong>Recommendation 0${index + 1}</strong></header>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${escapeHtml(product.value)}</p>
        <div class="product-proof"><span>${escapeHtml(product.proof)}</span><b>$3 standalone</b></div>
        <a href="${escapeHtml(product.tracked_url)}">View this module <span aria-hidden="true">-&gt;</span></a>
      </article>`).join("");
    writeUrl(plan.options);
  }

  function build() {
    render(core.generate(readControls()));
  }

  function newSeed() {
    const first = ["amber", "brine", "cinder", "glass", "harbor", "iron", "reed", "salt", "storm", "tide"];
    const second = ["bell", "ledger", "light", "road", "signal", "vault", "wake", "watch", "witness", "works"];
    const values = new Uint32Array(3);
    crypto.getRandomValues(values);
    $("seed").value = `${first[values[0] % first.length]}-${second[values[1] % second.length]}-${10 + (values[2] % 90)}`;
    build();
  }

  async function copyText(text, success) {
    await navigator.clipboard.writeText(text);
    notify(success);
  }

  function downloadMarkdown() {
    const blob = new Blob([core.toMarkdown(state.plan)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${state.plan.options.seed}-campaign-launch.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("Markdown plan saved");
  }

  document.querySelectorAll("[data-scope]").forEach((button) => button.addEventListener("click", () => { setPressed("scope-control", "scope", button.dataset.scope); build(); }));
  document.querySelectorAll("[data-spotlight]").forEach((button) => button.addEventListener("click", () => { setPressed("spotlight-control", "spotlight", button.dataset.spotlight); build(); }));
  $("party").addEventListener("input", () => { $("party-output").textContent = $("party").value; build(); });
  $("tier").addEventListener("input", () => { $("tier-output").textContent = $("tier").value; build(); });
  $("seed").addEventListener("change", build);
  $("build-plan").addEventListener("click", build);
  $("new-seed").addEventListener("click", newSeed);
  $("copy-plan").addEventListener("click", () => copyText(core.toMarkdown(state.plan), "Campaign plan copied").catch(() => notify("Clipboard unavailable")));
  $("share-plan").addEventListener("click", () => copyText(window.location.href, "Share link copied").catch(() => notify("Clipboard unavailable")));
  $("download-plan").addEventListener("click", downloadMarkdown);

  loadUrl();
  build();
})();
