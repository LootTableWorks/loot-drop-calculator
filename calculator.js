(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.lootCalculator = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  function clampProbability(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(1, Math.max(0, number));
  }

  function logBinomialCoefficient(n, k) {
    const terms = Math.min(k, n - k);
    let result = 0;
    for (let i = 1; i <= terms; i += 1) {
      result += Math.log(n - terms + i) - Math.log(i);
    }
    return result;
  }

  function binomialProbability(n, k, p) {
    const attempts = Math.max(0, Math.floor(Number(n) || 0));
    const successes = Math.floor(Number(k));
    const chance = clampProbability(p);
    if (!Number.isFinite(successes) || successes < 0 || successes > attempts) return 0;
    if (chance === 0) return successes === 0 ? 1 : 0;
    if (chance === 1) return successes === attempts ? 1 : 0;

    const logProbability = logBinomialCoefficient(attempts, successes)
      + successes * Math.log(chance)
      + (attempts - successes) * Math.log1p(-chance);
    return Math.exp(logProbability);
  }

  function probabilityAtLeast(n, k, p) {
    const attempts = Math.max(0, Math.floor(Number(n) || 0));
    const target = Math.max(0, Math.floor(Number(k) || 0));
    const chance = clampProbability(p);
    if (target <= 0) return 1;
    if (attempts <= 0) return 0;
    if (target > attempts) return 0;
    if (chance <= 0) return 0;
    if (chance >= 1) return 1;

    const mode = Math.min(attempts, Math.floor((attempts + 1) * chance));
    let totalWeight = 1;
    let targetWeight = mode >= target ? 1 : 0;
    let weight = 1;

    for (let successes = mode; successes > 0; successes -= 1) {
      weight *= (successes / (attempts - successes + 1)) * ((1 - chance) / chance);
      totalWeight += weight;
      if (successes - 1 >= target) targetWeight += weight;
    }

    weight = 1;
    for (let successes = mode; successes < attempts; successes += 1) {
      weight *= ((attempts - successes) / (successes + 1)) * (chance / (1 - chance));
      totalWeight += weight;
      if (successes + 1 >= target) targetWeight += weight;
    }

    return Math.min(1, Math.max(0, targetWeight / totalWeight));
  }

  function expectedDrops(n, p) {
    const attempts = Math.max(0, Math.floor(Number(n) || 0));
    return attempts * clampProbability(p);
  }

  function attemptsForProbability(targetProbability, p) {
    const target = clampProbability(targetProbability);
    const chance = clampProbability(p);
    if (target <= 0) return 0;
    if (chance <= 0) return Infinity;
    if (chance >= 1) return 1;
    return Math.ceil(Math.log(1 - target) / Math.log(1 - chance));
  }

  function formatPercent(value) {
    return `${(clampProbability(value) * 100).toFixed(2)}%`;
  }

  return {
    binomialProbability,
    probabilityAtLeast,
    expectedDrops,
    attemptsForProbability,
    formatPercent
  };
});
