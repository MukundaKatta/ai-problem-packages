function routeModel(request, models) {
  const candidates = models
    .filter(model => supports(request, model))
    .map(model => ({ model, score: scoreModel(request, model) }))
    .sort((a, b) => b.score - a.score);
  if (!candidates.length) return { model: null, reason: "no_model_satisfies_policy", candidates: [] };
  return { model: candidates[0].model, reason: "selected_highest_policy_score", candidates };
}

function supports(req, model) {
  if ((req.requiredCapabilities ?? []).some(cap => !(model.capabilities ?? []).includes(cap))) return false;
  if (req.privateData && model.allowsPrivateData === false) return false;
  if (req.maxCostPer1kTokens && model.costPer1kTokens > req.maxCostPer1kTokens) return false;
  if (req.maxLatencyMs && model.p50LatencyMs > req.maxLatencyMs) return false;
  return true;
}

function scoreModel(req, model) {
  const quality = model.quality ?? 0.5;
  const cost = 1 / (1 + (model.costPer1kTokens ?? 0));
  const latency = 1 / (1 + ((model.p50LatencyMs ?? 1000) / 1000));
  const fit = (req.preferredCapabilities ?? []).filter(cap => (model.capabilities ?? []).includes(cap)).length * 0.1;
  return quality * 0.55 + cost * 0.25 + latency * 0.2 + fit;
}

export { routeModel, scoreModel, supports };

