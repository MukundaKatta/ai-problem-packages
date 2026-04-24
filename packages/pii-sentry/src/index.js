const DETECTORS = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  credit_card: /\b(?:\d[ -]*?){13,19}\b/g,
  api_key: /\b(?:sk|ghp|xoxb|api)[-_][A-Za-z0-9_-]{16,}\b/g
};

function detectPii(text) {
  const value = String(text);
  const findings = [];
  for (const [type, pattern] of Object.entries(DETECTORS)) {
    for (const match of value.matchAll(pattern)) findings.push({ type, value: match[0], start: match.index, end: match.index + match[0].length });
  }
  return findings.sort((a, b) => a.start - b.start);
}

function redactPii(text, options = {}) {
  const replacement = options.replacement ?? (type => `[REDACTED:${type}]`);
  let output = String(text);
  for (const finding of [...detectPii(output)].reverse()) {
    const token = typeof replacement === "function" ? replacement(finding.type) : replacement;
    output = output.slice(0, finding.start) + token + output.slice(finding.end);
  }
  return output;
}

export { detectPii, redactPii };
