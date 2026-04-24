import { createHash } from "node:crypto";

function semanticCacheKey(request, options = {}) {
  const normalized = {
    model: request.model,
    system: normalizeText(request.system),
    prompt: normalizeText(request.prompt ?? request.input),
    tools: stable(request.tools ?? []),
    context: stable((request.context ?? []).map(item => typeof item === "string" ? normalizeText(item) : item)),
    version: options.version ?? "v1"
  };
  return createHash("sha256").update(JSON.stringify(stable(normalized))).digest("hex");
}

function normalizeText(text) {
  return String(text ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)]));
  return value;
}

export { normalizeText, semanticCacheKey, stable };

