function estimateTokens(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return Math.ceil((text.match(/\S+/g) ?? []).length * 1.33);
}

function estimateCost({ input, output = "", inputCostPer1k = 0, outputCostPer1k = 0 }) {
  const inputTokens = estimateTokens(input);
  const outputTokens = estimateTokens(output);
  const costUsd = (inputTokens / 1000) * inputCostPer1k + (outputTokens / 1000) * outputCostPer1k;
  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, costUsd: Math.round(costUsd * 1e6) / 1e6 };
}

function enforceBudget(estimate, budget) {
  const violations = [];
  if (budget.maxTokens && estimate.totalTokens > budget.maxTokens) violations.push("maxTokens");
  if (budget.maxCostUsd && estimate.costUsd > budget.maxCostUsd) violations.push("maxCostUsd");
  return { allowed: violations.length === 0, violations };
}

export { enforceBudget, estimateCost, estimateTokens };

