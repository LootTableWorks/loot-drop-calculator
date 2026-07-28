(function () {
  "use strict";

  const preview = window.GULLWATCH_AFTERMATH_PREVIEW;
  if (!preview || !preview.endings) return;

  const tabs = Array.from(document.querySelectorAll("[data-ending]"));
  const panel = document.getElementById("ending-panel");
  const shareButton = document.getElementById("share-preview");
  const shareStatus = document.getElementById("share-status");
  const workspaceLink = document.getElementById("workspace-link");
  const attributedLinks = Array.from(document.querySelectorAll("[data-attribution-action]"));
  let activeEnding = preview.defaultEnding;
  const incomingAttribution = readIncomingAttribution();

  const fields = {
    label: document.getElementById("ending-label"),
    opening: document.getElementById("ending-opening"),
    summary: document.getElementById("ending-summary"),
    pressure: document.getElementById("ending-pressure"),
    leverage: document.getElementById("ending-leverage"),
    stake: document.getElementById("ending-stake")
  };

  const clocks = {
    sealedRecords: {
      value: document.getElementById("clock-sealed-records"),
      bar: document.getElementById("bar-sealed-records")
    },
    reliefUnrest: {
      value: document.getElementById("clock-relief-unrest"),
      bar: document.getElementById("bar-relief-unrest")
    },
    memoryFracture: {
      value: document.getElementById("clock-memory-fracture"),
      bar: document.getElementById("bar-memory-fracture")
    },
    blackChannel: {
      value: document.getElementById("clock-black-channel"),
      bar: document.getElementById("bar-black-channel")
    }
  };

  function endingFromUrl() {
    const requested = new URLSearchParams(window.location.search).get("ending");
    return Object.prototype.hasOwnProperty.call(preview.endings, requested)
      ? requested
      : preview.defaultEnding;
  }

  function safeAttributionValue(value, fallback) {
    const normalized = String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48);
    return normalized || fallback;
  }

  function readIncomingAttribution() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: safeAttributionValue(params.get("utm_source"), "direct"),
      campaign: safeAttributionValue(params.get("utm_campaign"), "ltw_recovery_2026_07")
    };
  }

  function updateAttributedLink(link, action) {
    const url = new URL(link.href, window.location.href);
    url.searchParams.set("utm_source", "aftermath_preview");
    url.searchParams.set("utm_medium", "owned_handoff");
    url.searchParams.set("utm_campaign", incomingAttribution.campaign);
    url.searchParams.set(
      "utm_content",
      `${action}_from_${incomingAttribution.source}`
    );
    link.href = url.toString();
  }

  attributedLinks.forEach((link) => {
    updateAttributedLink(link, link.dataset.attributionAction);
  });

  function setClock(clock, value) {
    clock.value.textContent = `${value} / 6`;
    clock.bar.style.width = `${(value / 6) * 100}%`;
  }

  function render(endingId, updateUrl) {
    const ending = preview.endings[endingId];
    if (!ending) return;
    activeEnding = endingId;

    fields.label.textContent = ending.label;
    fields.opening.textContent = ending.opening;
    fields.summary.textContent = ending.summary;
    fields.pressure.textContent = ending.pressure;
    fields.leverage.textContent = ending.leverage;
    fields.stake.textContent = ending.stake;

    Object.entries(ending.clocks).forEach(([clockId, value]) => {
      setClock(clocks[clockId], value);
    });

    tabs.forEach((tab) => {
      const selected = tab.dataset.ending === endingId;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) panel.setAttribute("aria-labelledby", tab.id);
    });

    const workspaceUrl = new URL("../campaign-workspace/", window.location.href);
    workspaceUrl.searchParams.set("utm_source", "aftermath_preview");
    workspaceUrl.searchParams.set("utm_medium", "owned_handoff");
    workspaceUrl.searchParams.set("utm_campaign", incomingAttribution.campaign);
    workspaceUrl.searchParams.set(
      "utm_content",
      `ending_${endingId.replaceAll("-", "_")}_workspace_from_${incomingAttribution.source}`
    );
    workspaceLink.href = workspaceUrl.toString();

    if (updateUrl) {
      const current = new URL(window.location.href);
      current.searchParams.set("ending", endingId);
      window.history.replaceState({}, "", current);
    }
    shareStatus.textContent = "";
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => render(tab.dataset.ending, true));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      tabs[nextIndex].focus();
      render(tabs[nextIndex].dataset.ending, true);
    });
  });

  shareButton.addEventListener("click", async () => {
    const ending = preview.endings[activeEnding];
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set("ending", activeEnding);
    shareUrl.searchParams.set("utm_source", "user_share");
    shareUrl.searchParams.set("utm_medium", "web_share");
    shareUrl.searchParams.set("utm_campaign", "ltw_recovery_2026_07");
    shareUrl.searchParams.set("utm_content", `aftermath_${activeEnding.replaceAll("-", "_")}`);
    const shareData = {
      title: `Gullwatch Aftermath: ${ending.label}`,
      text: `${ending.opening}: ${ending.summary}`,
      url: shareUrl.toString()
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        shareStatus.textContent = "Ending preview shared.";
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        shareStatus.textContent = "Ending preview link copied.";
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      shareStatus.textContent = "Sharing was unavailable. Copy the page address from the browser.";
    }
  });

  render(endingFromUrl(), false);
})();
