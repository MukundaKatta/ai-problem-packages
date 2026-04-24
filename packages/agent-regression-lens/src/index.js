const DEFAULT_THRESHOLDS = {
  minScore: 75,
  minOutputSimilarity: 0.55,
  maxStepIncreaseRatio: 0.35,
  maxLatencyIncreaseRatio: 0.5,
  maxCostIncreaseRatio: 0.5,
  maxErrorIncrease: 0
};

const PENALTIES = {
  lost_success: 35,
  new_errors: 24,
  failed_tools: 18,
  output_drift: 18,
  step_bloat: 12,
  latency_bloat: 8,
  cost_bloat: 8
};

function analyzeAgentRegression({ baseline, current, thresholds = {} }) {
  const limits = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const before = summarizeRun(baseline);
  const after = summarizeRun(current);
  const outputSimilarity = similarity(before.finalOutput, after.finalOutput);
  const regressions = [];

  if (before.success && !after.success) {
    regressions.push(issue("lost_success", "Current run no longer reports success.", "critical", PENALTIES.lost_success));
  }
  if (after.errors > before.errors + limits.maxErrorIncrease) {
    regressions.push(issue("new_errors", `Errors increased from ${before.errors} to ${after.errors}.`, "high", PENALTIES.new_errors));
  }
  if (after.failedToolCalls > before.failedToolCalls) {
    regressions.push(issue("failed_tools", `Failed tool calls increased from ${before.failedToolCalls} to ${after.failedToolCalls}.`, "high", PENALTIES.failed_tools));
  }
  if (outputSimilarity < limits.minOutputSimilarity) {
    regressions.push(issue("output_drift", `Final output similarity fell to ${outputSimilarity}.`, "medium", PENALTIES.output_drift));
  }
  addRatioIssue(regressions, "step_bloat", "Steps", before.steps, after.steps, limits.maxStepIncreaseRatio, "medium", PENALTIES.step_bloat);
  addRatioIssue(regressions, "latency_bloat", "Latency", before.latencyMs, after.latencyMs, limits.maxLatencyIncreaseRatio, "low", PENALTIES.latency_bloat);
  addRatioIssue(regressions, "cost_bloat", "Cost", before.costUsd, after.costUsd, limits.maxCostIncreaseRatio, "low", PENALTIES.cost_bloat);

  const score = clamp(100 - regressions.reduce((sum, item) => sum + item.penalty, 0), 0, 100);
  const critical = regressions.some(item => item.severity === "critical");
  return {
    passed: score >= limits.minScore && !critical,
    score,
    outputSimilarity,
    baseline: before,
    current: after,
    regressions
  };
}

function compareRunSet({ baselineRuns, currentRuns, thresholds = {} }) {
  const byId = new Map(baselineRuns.map(run => [run.id ?? run.task ?? run.name, run]));
  const results = currentRuns.map(current => {
    const key = current.id ?? current.task ?? current.name;
    const baseline = byId.get(key);
    if (!baseline) {
      return {
        id: key,
        missingBaseline: true,
        passed: false,
        score: 0,
        regressions: [issue("missing_baseline", "No matching baseline run was found.", "high", 20)]
      };
    }
    return { id: key, ...analyzeAgentRegression({ baseline, current, thresholds }) };
  });
  return summarizeComparisons(results);
}

function summarizeRun(run) {
  const events = Array.isArray(run) ? run : run?.events ?? [];
  const finalEvent = [...events].reverse().find(event => event.type === "final" || event.final || event.output);
  const explicitSuccess = run?.success ?? finalEvent?.success;
  const errors = events.filter(event => event.type === "error" || event.error).length + Number(run?.errors ?? 0);
  const toolCalls = events.filter(event => event.type === "tool_call" || event.toolName || event.tool).length;
  const failedToolCalls = events.filter(event => (event.type === "tool_call" || event.toolName || event.tool) && (event.error || event.success === false)).length;
  const latencyMs = number(run?.latencyMs) + sum(events, "durationMs") + sum(events, "latencyMs");
  const costUsd = number(run?.costUsd) + sum(events, "costUsd");
  return {
    steps: run?.steps ?? events.length,
    toolCalls,
    failedToolCalls,
    errors,
    latencyMs: round(latencyMs),
    costUsd: round(costUsd),
    success: explicitSuccess ?? errors === 0,
    finalOutput: String(run?.output ?? finalEvent?.content ?? finalEvent?.output ?? "")
  };
}

function summarizeComparisons(results) {
  const scores = results.map(result => result.score);
  const failed = results.filter(result => !result.passed);
  return {
    passed: failed.length === 0,
    total: results.length,
    failed: failed.length,
    averageScore: scores.length ? round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100,
    results
  };
}

function addRatioIssue(regressions, code, label, before, after, maxIncreaseRatio, severity, penalty) {
  if (before <= 0 || after <= before) return;
  const increaseRatio = (after - before) / before;
  if (increaseRatio > maxIncreaseRatio) {
    regressions.push(issue(code, `${label} increased from ${before} to ${after}.`, severity, penalty, round(increaseRatio)));
  }
}

function issue(code, message, severity, penalty, increaseRatio) {
  return { code, message, severity, penalty, ...(increaseRatio === undefined ? {} : { increaseRatio }) };
}

function similarity(left, right) {
  const a = terms(left);
  const b = terms(right);
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter(term => b.has(term)).length;
  const union = new Set([...a, ...b]).size;
  return round(intersection / union);
}

function terms(text) {
  return new Set(String(text).toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
}

function sum(events, key) {
  return events.reduce((total, event) => total + number(event[key]), 0);
}

function number(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

export { analyzeAgentRegression, compareRunSet, summarizeRun };
