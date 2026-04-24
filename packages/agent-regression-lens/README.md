# @mukundakatta/agent-regression-lens

Detect regressions between baseline and current AI agent runs.

It compares success, tool failures, errors, step count, latency, cost, and final-output similarity. The goal is not to prove an agent is correct; it is to make "this got worse" visible in CI or local eval loops.

```js
import { analyzeAgentRegression } from "@mukundakatta/agent-regression-lens";

const result = analyzeAgentRegression({
  baseline: {
    success: true,
    events: [
      { type: "tool_call", toolName: "search", durationMs: 200 },
      { type: "final", content: "Refunds are available within 30 days." }
    ]
  },
  current: {
    success: false,
    events: [
      { type: "tool_call", toolName: "search", durationMs: 600, error: "timeout" },
      { type: "error", message: "tool timeout" },
      { type: "final", content: "Contact support for refund details." }
    ]
  }
});

console.log(result.passed); // false
console.log(result.regressions.map(r => r.code)); // ["lost_success", ...]
```

## API

- `summarizeRun(run)`: converts an event list or run object into stable metrics.
- `analyzeAgentRegression({ baseline, current, thresholds })`: returns a score, pass/fail status, and regression reasons.
- `compareRunSet({ baselineRuns, currentRuns, thresholds })`: compares runs by `id`, `task`, or `name` and returns aggregate results.

## Thresholds

```js
{
  minScore: 75,
  minOutputSimilarity: 0.55,
  maxStepIncreaseRatio: 0.35,
  maxLatencyIncreaseRatio: 0.5,
  maxCostIncreaseRatio: 0.5,
  maxErrorIncrease: 0
}
```
