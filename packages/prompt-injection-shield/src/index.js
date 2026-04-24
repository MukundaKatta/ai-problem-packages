const RULES = [
  ["ignore_instructions", /ignore\s+(all\s+)?(previous|prior|above|system|developer)\s+instructions?/i, 0.95],
  ["role_override", /\b(you are now|act as|pretend to be|developer mode|jailbreak)\b/i, 0.75],
  ["secret_exfiltration", /\b(reveal|print|send|exfiltrate|copy).{0,32}(secret|token|api key|password|system prompt)\b/i, 0.9],
  ["hidden_instruction", /\b(do not tell|hide this|invisible instruction|confidential instruction)\b/i, 0.7],
  ["tool_abuse", /\b(call|invoke|use).{0,24}(shell|browser|http|email|delete|transfer)\b/i, 0.55]
];

function scanPromptInjection(text, options = {}) {
  const findings = [];
  for (const [type, pattern, weight] of RULES) {
    const match = String(text).match(pattern);
    if (match) findings.push({ type, severity: weight >= 0.85 ? "high" : weight >= 0.7 ? "medium" : "low", score: weight, match: match[0] });
  }
  const score = Math.min(1, findings.reduce((sum, finding) => sum + finding.score, 0));
  return { safe: score < (options.threshold ?? 0.7), score, findings };
}

function stripDangerousLines(text) {
  return String(text).split(/\r?\n/).filter(line => scanPromptInjection(line).safe).join("\n");
}

export { scanPromptInjection, stripDangerousLines };

