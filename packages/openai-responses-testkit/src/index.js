function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
}

function parseMaybeJson(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function collectContentText(content) {
  if (typeof content === "string") return content;
  return asArray(content).map((part) => {
    if (typeof part === "string") return part;
    return part?.text || part?.content || part?.value || part?.delta || "";
  }).join("");
}

function collectResponseText(response) {
  if (!response) return "";
  if (typeof response.output_text === "string") return response.output_text;
  return asArray(response.output).map((item) => {
    if (item?.type === "message") return collectContentText(item.content);
    if (item?.type === "output_text") return item.text || "";
    return collectContentText(item?.content);
  }).join("");
}

function extractToolCalls(response) {
  const calls = [];
  const pushCall = (item) => {
    calls.push({
      id: item.id || item.call_id || null,
      name: item.name || item.function?.name || null,
      arguments: parseMaybeJson(item.arguments || item.function?.arguments),
      raw: item,
    });
  };
  for (const item of asArray(response?.output)) {
    if (item?.type === "function_call" || item?.type === "tool_call") {
      pushCall(item);
    }
    for (const part of asArray(item?.content)) {
      if (part?.type === "function_call" || part?.type === "tool_call") pushCall(part);
    }
  }
  return calls;
}

function collectStream(events) {
  let text = "";
  let refusal = "";
  const toolArgumentBuffers = new Map();
  const toolNames = new Map();
  const eventTypes = [];
  let completed = false;
  let failed = false;
  let response = null;
  const errors = [];

  for (const event of events || []) {
    if (!event) continue;
    eventTypes.push(event.type || "unknown");
    if (event.type === "response.output_text.delta") text += event.delta || "";
    if (event.type === "response.output_text.done") text += event.text || "";
    if (event.type === "response.refusal.delta") refusal += event.delta || "";
    if (event.type === "response.refusal.done") refusal += event.refusal || "";
    if (event.type === "response.output_item.added" && (event.item?.type === "function_call" || event.item?.type === "tool_call")) {
      const key = event.item.id || event.item.call_id || "default";
      if (event.item.name || event.item.function?.name) toolNames.set(key, event.item.name || event.item.function?.name);
    }
    if (event.type === "response.function_call_arguments.delta") {
      const key = event.item_id || event.call_id || "default";
      toolArgumentBuffers.set(key, `${toolArgumentBuffers.get(key) || ""}${event.delta || ""}`);
    }
    if (event.type === "response.function_call_arguments.done") {
      const key = event.item_id || event.call_id || "default";
      toolArgumentBuffers.set(key, event.arguments || toolArgumentBuffers.get(key) || "");
    }
    if (event.type === "response.completed") {
      completed = true;
      response = event.response || event.data || response;
    }
    if (event.type === "response.failed" || event.type === "error") {
      failed = true;
      errors.push(event.error || event);
    }
  }

  const toolArguments = [...toolArgumentBuffers.entries()].map(([id, args]) => ({
    id,
    name: toolNames.get(id) || null,
    arguments: parseMaybeJson(args),
    rawArguments: args,
  }));
  return { text, refusal, toolArguments, eventTypes, completed, failed, response, errors };
}

function redactResponseSnapshot(value, options = {}) {
  const {
    redactIds = true,
    redactTimestamps = true,
    redactUsage = true,
    redactMetadataKeys = ["api_key", "authorization", "email", "phone"],
  } = options;
  const seen = new WeakSet();

  const visit = (input, key = "") => {
    if (input === null || typeof input !== "object") {
      if (typeof input === "string" && redactIds && /^(resp|msg|call|evt|run|thread|file)_[a-zA-Z0-9_-]+$/.test(input)) return "<redacted:id>";
      return input;
    }
    if (seen.has(input)) return "<redacted:circular>";
    seen.add(input);
    if (Array.isArray(input)) return input.map((item) => visit(item, key));
    const out = {};
    for (const [childKey, childValue] of Object.entries(input)) {
      const normalizedKey = childKey.toLowerCase();
      if (redactUsage && normalizedKey === "usage") {
        out[childKey] = "<redacted:usage>";
      } else if (redactTimestamps && (normalizedKey.endsWith("_at") || normalizedKey === "created" || normalizedKey === "created_at")) {
        out[childKey] = "<redacted:timestamp>";
      } else if (redactIds && (normalizedKey === "id" || normalizedKey.endsWith("_id"))) {
        out[childKey] = "<redacted:id>";
      } else if (redactMetadataKeys.some((item) => normalizedKey.includes(item))) {
        out[childKey] = "<redacted:metadata>";
      } else {
        out[childKey] = visit(childValue, childKey);
      }
    }
    return out;
  };

  return visit(value);
}

function includesSubset(value, subset) {
  if (!subset || typeof subset !== "object") return true;
  const target = value && typeof value === "object" ? value : {};
  return Object.entries(subset).every(([key, expected]) => stableJson(target[key]) === stableJson(expected));
}

function assertResponseIncludesText(response, expected) {
  const actual = collectResponseText(response);
  const ok = expected instanceof RegExp ? expected.test(actual) : actual.includes(String(expected));
  if (!ok) throw new Error(`Expected response text to include ${expected}, got: ${actual}`);
  return true;
}

function assertToolCalled(response, name, partialArguments) {
  const calls = extractToolCalls(response);
  const found = calls.find((call) => call.name === name && includesSubset(call.arguments, partialArguments));
  if (!found) throw new Error(`Expected tool ${name} to be called. Calls: ${stableJson(calls.map((call) => ({ name: call.name, arguments: call.arguments })))}`);
  return found;
}

function assertNoRefusal(responseOrStreamSummary) {
  const refusal = responseOrStreamSummary?.refusal || asArray(responseOrStreamSummary?.output).map((item) => collectContentText(item?.refusal || item?.content)).join("");
  if (refusal) throw new Error(`Expected no refusal, got: ${refusal}`);
  return true;
}

function assertStreamCompleted(streamSummary) {
  if (!streamSummary?.completed) throw new Error(`Expected stream to complete. Events: ${stableJson(streamSummary?.eventTypes || [])}`);
  if (streamSummary?.failed) throw new Error(`Expected stream not to fail. Errors: ${stableJson(streamSummary.errors || [])}`);
  return true;
}

export {
  assertNoRefusal,
  assertResponseIncludesText,
  assertStreamCompleted,
  assertToolCalled,
  collectResponseText,
  collectStream,
  extractToolCalls,
  redactResponseSnapshot,
};
