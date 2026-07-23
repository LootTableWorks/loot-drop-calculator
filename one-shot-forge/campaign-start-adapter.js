(function attachOneShotCampaignStartAdapter(root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.OneShotCampaignStartAdapter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createOneShotCampaignStartAdapter(root) {
  "use strict";

  const SCOPE_ORDER = Object.freeze(["tonight", "full_evening", "mini_arc", "campaign"]);
  const SPOTLIGHT_ORDER = Object.freeze(["exploration", "intrigue", "survival"]);

  function dependencies(overrides = {}) {
    const contract = overrides.contract || root?.CampaignStartContract;
    const launchpadCore = overrides.launchpadCore || root?.CampaignLaunchpadCore;
    if (!contract?.createCampaignStart || !contract?.validateOneShot) {
      throw new Error("Campaign Start contract is unavailable.");
    }
    if (!launchpadCore?.generate) throw new Error("Campaign Launchpad core is unavailable.");
    return { contract, launchpadCore };
  }

  function resolveLaunchpadOptions(oneShot, context = {}, overrides = {}) {
    const { contract } = dependencies({
      ...overrides,
      launchpadCore: overrides.launchpadCore || { generate() {} }
    });
    const oneShotValidation = contract.validateOneShot(oneShot);
    if (!oneShotValidation.valid) throw new Error(oneShotValidation.errors.join("\n"));

    const matchingScopes = SCOPE_ORDER.filter((id) => {
      const preset = contract.SCOPE_PRESETS[id];
      return preset.duration === oneShot.duration_minutes && preset.threat === oneShot.threat;
    });
    const scope = context.scope || (matchingScopes.includes("full_evening") ? "full_evening" : matchingScopes[0]);
    if (!scope || !matchingScopes.includes(scope)) {
      throw new Error("Campaign Start requires Forgiving / 2 hours, Standard / 3 hours, or Dangerous / 4 hours.");
    }

    const matchingSpotlights = SPOTLIGHT_ORDER.filter((id) => contract.SPOTLIGHT_PRESETS[id].tone === oneShot.tone);
    const spotlight = context.spotlight || matchingSpotlights[0];
    if (!spotlight || !matchingSpotlights.includes(spotlight)) {
      throw new Error("The selected tone does not map to a Campaign Launchpad spotlight.");
    }

    return Object.freeze({
      seed: oneShot.seed,
      scope,
      spotlight,
      party: oneShot.party_size,
      tier: oneShot.maximum_tier
    });
  }

  function create(oneShot, context = {}, overrides = {}) {
    const runtime = dependencies(overrides);
    const options = resolveLaunchpadOptions(oneShot, context, runtime);
    const launchpad = runtime.launchpadCore.generate(options);
    return runtime.contract.createCampaignStart({ launchpad, oneShot });
  }

  function filename(start, overrides = {}) {
    const { contract } = dependencies({
      ...overrides,
      launchpadCore: overrides.launchpadCore || { generate() {} }
    });
    const validation = contract.validateCampaignStart(start);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    const seed = String(start.campaign.seed)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "campaign";
    return `campaign-start-${seed}-${start.start_id}.json`;
  }

  return { SCOPE_ORDER, SPOTLIGHT_ORDER, resolveLaunchpadOptions, create, filename };
});
