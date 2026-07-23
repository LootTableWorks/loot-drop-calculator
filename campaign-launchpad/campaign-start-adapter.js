(function attachCampaignLaunchpadStartAdapter(root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CampaignLaunchpadStartAdapter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCampaignLaunchpadStartAdapter(root) {
  "use strict";

  function dependencies(overrides = {}) {
    const contract = overrides.contract || root?.CampaignStartContract;
    const oneShotCore = overrides.oneShotCore || root?.OneShotCore;
    const source = overrides.source || root?.OneShotSource;
    if (!contract?.createCampaignStart || !contract?.validateLaunchpad) {
      throw new Error("Campaign Start contract is unavailable.");
    }
    if (!oneShotCore?.generate) throw new Error("One-Shot Forge core is unavailable.");
    if (!source?.validation?.valid) throw new Error("Validated One-Shot Forge source data is unavailable.");
    return { contract, oneShotCore, source };
  }

  function create(plan, overrides = {}) {
    const runtime = dependencies(overrides);
    const planValidation = runtime.contract.validateLaunchpad(plan);
    if (!planValidation.valid) throw new Error(planValidation.errors.join("\n"));
    const scope = runtime.contract.SCOPE_PRESETS[plan.options.scope];
    const spotlight = runtime.contract.SPOTLIGHT_PRESETS[plan.options.spotlight];
    const oneShot = runtime.oneShotCore.generate({
      seed: plan.options.seed,
      tone: spotlight.tone,
      threat: scope.threat,
      durationMinutes: scope.duration,
      partySize: plan.options.party,
      maximumTier: plan.options.tier
    }, runtime.source);
    return runtime.contract.createCampaignStart({ launchpad: plan, oneShot });
  }

  function filename(start, overrides = {}) {
    const { contract } = dependencies({
      ...overrides,
      oneShotCore: overrides.oneShotCore || { generate() {} },
      source: overrides.source || { validation: { valid: true } }
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

  return { create, filename };
});
