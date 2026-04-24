function detectContextDrift({ query, context, answer }) {
  const queryTerms = terms(query);
  const contextTerms = terms(context);
  const answerTerms = terms(answer);
  const queryToContext = jaccard(queryTerms, contextTerms);
  const answerToContext = jaccard(answerTerms, contextTerms);
  const answerToQuery = jaccard(answerTerms, queryTerms);
  const driftScore = round(1 - (answerToContext * 0.6 + answerToQuery * 0.4));
  return { drift: driftScore > 0.65, driftScore, queryToContext, answerToContext, answerToQuery };
}

function terms(text) {
  return new Set(String(text).toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
}
function jaccard(a, b) {
  const intersection = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? round(intersection / union) : 1;
}
function round(n) { return Math.round(n * 10000) / 10000; }

export { detectContextDrift };

