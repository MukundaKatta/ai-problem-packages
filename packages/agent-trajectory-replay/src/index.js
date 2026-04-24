function summarizeTrajectory(events) {
  return {
    steps: events.length,
    toolCalls: events.filter(e => e.type === "tool_call").length,
    errors: events.filter(e => e.type === "error").length,
    finalOutput: [...events].reverse().find(e => e.type === "final")?.content
  };
}

function diffTrajectories(left, right) {
  const diffs = [];
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    const a = normalize(left[i]);
    const b = normalize(right[i]);
    if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push({ index: i, left: a, right: b });
  }
  return diffs;
}

function replayTrajectory(events, handlers = {}) {
  const state = {};
  for (const event of events) handlers[event.type]?.(event, state);
  return state;
}

function normalize(event) {
  if (!event) return null;
  const { timestamp, durationMs, ...stable } = event;
  return stable;
}

export { diffTrajectories, replayTrajectory, summarizeTrajectory };

