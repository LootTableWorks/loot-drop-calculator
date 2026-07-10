const form = document.querySelector("#calculator-form");
const output = document.querySelector("#output");
const copyButton = document.querySelector("#copy-result");

function readInputs() {
  return {
    attempts: Number(document.querySelector("#attempts").value),
    dropChance: Number(document.querySelector("#drop-chance").value) / 100,
    targetDrops: Number(document.querySelector("#target-drops").value),
    confidence: Number(document.querySelector("#confidence").value) / 100
  };
}

function calculate() {
  const { attempts, dropChance, targetDrops, confidence } = readInputs();
  const atLeastOne = lootCalculator.probabilityAtLeast(attempts, 1, dropChance);
  const atLeastTarget = lootCalculator.probabilityAtLeast(attempts, targetDrops, dropChance);
  const expected = lootCalculator.expectedDrops(attempts, dropChance);
  const attemptsNeeded = lootCalculator.attemptsForProbability(confidence, dropChance);

  const attemptsNeededText = Number.isFinite(attemptsNeeded)
    ? `${attemptsNeeded.toLocaleString()} attempts`
    : "not reachable with a 0% drop chance";

  const targetResult = targetDrops > 1 ? `
    <div class="result-card">
      <span class="label">Chance of at least ${targetDrops} drops</span>
      <strong>${lootCalculator.formatPercent(atLeastTarget)}</strong>
    </div>
  ` : "";

  output.innerHTML = `
    <div class="result-card">
      <span class="label">Chance of at least one drop</span>
      <strong>${lootCalculator.formatPercent(atLeastOne)}</strong>
    </div>
    ${targetResult}
    <div class="result-card">
      <span class="label">Expected drops</span>
      <strong>${expected.toFixed(2)}</strong>
    </div>
    <div class="result-card">
      <span class="label">Attempts for ${lootCalculator.formatPercent(confidence)} chance of one drop</span>
      <strong>${attemptsNeededText}</strong>
    </div>
  `;
}

function resultText() {
  return output.innerText.replace(/\n{2,}/g, "\n").trim();
}

form.addEventListener("input", calculate);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

copyButton.addEventListener("click", async () => {
  const text = resultText();
  if (!text) return;
  await navigator.clipboard.writeText(text);
  copyButton.textContent = "Copied";
  window.setTimeout(() => {
    copyButton.textContent = "Copy Result";
  }, 1200);
});

calculate();
