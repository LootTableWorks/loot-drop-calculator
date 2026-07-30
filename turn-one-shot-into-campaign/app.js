(() => {
  "use strict";

  const form = document.querySelector("#continuation-form");
  const output = document.querySelector("#brief-output");
  const briefText = document.querySelector("#brief-text");
  const status = document.querySelector("#brief-status");
  const copyButton = document.querySelector("#copy-brief");
  const downloadButton = document.querySelector("#download-brief");

  if (!form || !output || !briefText || !status || !copyButton || !downloadButton) {
    return;
  }

  const fieldIds = [
    "ending-truth",
    "changed-relationship",
    "advanced-pressure",
    "unresolved-promise",
    "next-intention"
  ];

  function value(id) {
    return document.querySelector(`#${id}`).value.trim();
  }

  function buildBrief() {
    const endingTruth = value("ending-truth");
    const changedRelationship = value("changed-relationship");
    const advancedPressure = value("advanced-pressure");
    const unresolvedPromise = value("unresolved-promise");
    const nextIntention = value("next-intention");

    return [
      "# Next-Session Brief",
      "",
      "## Campaign State",
      `- Ending truth: ${endingTruth}`,
      `- Changed relationship: ${changedRelationship}`,
      `- Advanced pressure: ${advancedPressure}`,
      `- Unresolved promise: ${unresolvedPromise}`,
      `- Players' next intention: ${nextIntention}`,
      "",
      "## Session Objective",
      `Put the party in a position to act on: ${nextIntention}`,
      "",
      "## Stakes",
      `If they delay or fail, this pressure advances: ${advancedPressure}`,
      "",
      "## Five Scene Beats",
      `1. Expose the consequence of this truth: ${endingTruth}`,
      `2. Let this relationship respond: ${changedRelationship}`,
      `3. Show visible evidence of the advancing pressure: ${advancedPressure}`,
      `4. Force a choice around the unresolved promise: ${unresolvedPromise}`,
      `5. End by recording a new truth, relationship, pressure, promise, and player intention.`,
      "",
      "## Prep Boundary",
      "Prepare one opening situation, two affected NPCs or factions, one visible pressure track, and one consequence for delay. Stop there."
    ].join("\n");
  }

  async function copyBrief() {
    const text = briefText.textContent;
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Brief copied.";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(briefText);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "Brief selected. Use your browser's copy command.";
    }
  }

  function downloadBrief() {
    const blob = new Blob([briefText.textContent], {
      type: "text/markdown;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "one-shot-next-session-brief.md";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = "Markdown downloaded.";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      return;
    }
    briefText.textContent = buildBrief();
    output.hidden = false;
    status.textContent = "Brief ready.";
    output.scrollIntoView({ behavior: "smooth", block: "start" });
    briefText.focus({ preventScroll: true });
  });

  form.addEventListener("reset", () => {
    output.hidden = true;
    briefText.textContent = "";
    status.textContent = "";
  });

  copyButton.addEventListener("click", copyBrief);
  downloadButton.addEventListener("click", downloadBrief);

  for (const id of fieldIds) {
    const field = document.querySelector(`#${id}`);
    field.addEventListener("input", () => {
      if (!output.hidden) {
        status.textContent = "Inputs changed. Build the brief again.";
      }
    });
  }
})();
