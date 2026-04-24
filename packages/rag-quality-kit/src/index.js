function scoreRag({ query, answer, contexts = [], requiredTerms = [] }) {
  const queryTerms = terms(query);
  const answerTerms = terms(answer);
  const contextTerms = terms(contexts.map(c => c.text ?? c).join(" "));
  const required = requiredTerms.length ? requiredTerms.map(normalize) : [...queryTerms].filter(t => t.length > 3);
  const retrievalCoverage = ratio(required.filter(t => contextTerms.has(t)).length, required.length);
  const groundedness = ratio([...answerTerms].filter(t => contextTerms.has(t)).length, answerTerms.size);
  const citationCoverage = ratio(contexts.filter(c => c.id && String(answer).includes(String(c.id))).length, contexts.filter(c => c.id).length || contexts.length);
  return { retrievalCoverage, groundedness, citationCoverage, score: round((retrievalCoverage + groundedness + citationCoverage) / 3) };
}

function missingEvidence({ answer, contexts = [] }) {
  const contextTerms = terms(contexts.map(c => c.text ?? c).join(" "));
  return [...terms(answer)].filter(t => t.length > 4 && !contextTerms.has(t));
}

function terms(text) { return new Set(normalize(text).match(/[a-z0-9]+/g) ?? []); }
function normalize(text) { return String(text).toLowerCase(); }
function ratio(n, d) { return d ? round(n / d) : 1; }
function round(n) { return Math.round(n * 10000) / 10000; }

export { missingEvidence, scoreRag };

