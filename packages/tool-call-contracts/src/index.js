function validateToolCall(call, contract) {
  const errors = [];
  if (call.name !== contract.name) errors.push(`expected tool ${contract.name}, got ${call.name}`);
  const args = call.arguments ?? {};
  for (const [key, rule] of Object.entries(contract.arguments ?? {})) {
    const value = args[key];
    if (rule.required && value === undefined) errors.push(`${key} is required`);
    if (value !== undefined && rule.type && typeof value !== rule.type) errors.push(`${key} must be ${rule.type}`);
    if (rule.enum && !rule.enum.includes(value)) errors.push(`${key} must be one of ${rule.enum.join(", ")}`);
    if (typeof value === "string" && rule.pattern && !new RegExp(rule.pattern).test(value)) errors.push(`${key} does not match ${rule.pattern}`);
  }
  return { valid: errors.length === 0, errors };
}

function assertToolCall(call, contract) {
  const result = validateToolCall(call, contract);
  if (!result.valid) throw new Error(result.errors.join("; "));
  return call;
}

export { assertToolCall, validateToolCall };

