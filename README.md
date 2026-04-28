# AI Problem Packages

Zero-dependency npm packages for common AI engineering problems:

- `@mukundakatta/prompt-injection-shield`: scan untrusted text for prompt-injection patterns.
- `@mukundakatta/pii-sentry`: detect and redact common PII and secret-like values.
- `@mukundakatta/rag-quality-kit`: score retrieval coverage, answer grounding, and citation coverage.
- `@mukundakatta/model-router-policy`: route requests by capability, cost, latency, and privacy policy.
- `@mukundakatta/llm-cost-guard`: estimate token usage and enforce request/session budgets.
- `@mukundakatta/tool-call-contracts`: validate tool-call payloads against small JSON-like schemas.
- `@mukundakatta/eval-dataset-smith`: build balanced eval datasets from bugs, docs, and examples.
- `@mukundakatta/agent-trajectory-replay`: replay and diff agent event trajectories.
- `@mukundakatta/context-drift-detector`: detect topic drift between prompt, retrieved context, and answer.
- `@mukundakatta/semantic-cache-key`: create normalized semantic cache keys for AI requests.
- `@mukundakatta/agent-regression-lens`: detect regressions between baseline and current AI agent runs.
- `@mukundakatta/llm-output-sanitizer`: Sanitize LLM outputs before rendering, SQL, shell, or markdown sinks.
- `@mukundakatta/tool-permission-gate`: Policy-check agent tool calls before execution.
- `@mukundakatta/system-prompt-leak-scan`: Detect system prompt leakage in model outputs.
- `@mukundakatta/vector-poison-score`: Score retrieved documents for vector/RAG poisoning signals.
- `@mukundakatta/retrieval-acl-filter`: Enforce document ACLs after retrieval and before prompting.
- `@mukundakatta/citation-integrity-check`: Verify answer citations refer to supplied source ids.
- `@mukundakatta/hallucination-risk-meter`: Estimate hallucination risk from answer, context, citations, and uncertainty language.
- `@mukundakatta/prompt-token-trim`: Trim prompt messages to fit a token budget while preserving priority.
- `@mukundakatta/eval-flake-detector`: Detect flaky LLM eval cases across repeated runs.
- `@mukundakatta/llm-response-schema-lite`: Tiny schema validator for structured LLM responses.
- `@mukundakatta/agent-loop-breaker`: Detect repeated agent steps and stop runaway loops.
- `@mukundakatta/tool-result-taint`: Track untrusted tool output before it enters prompts or actions.
- `@mukundakatta/rag-staleness-auditor`: Find stale RAG chunks by age, version, and freshness requirements.
- `@mukundakatta/model-fallback-planner`: Plan model fallback chains from capability, cost, and health data.
- `@mukundakatta/prompt-version-diff`: Diff prompt templates and flag risky instruction changes.
- `@mukundakatta/consent-redaction-log`: Record consent-aware redactions for privacy review trails.
- `@mukundakatta/embedding-dedupe`: Deduplicate near-identical embedding records by cosine similarity.
- `@mukundakatta/context-window-packer`: Pack context chunks into a budget by relevance and priority.
- `@mukundakatta/jailbreak-corpus-mini`: Small local jailbreak and prompt-injection fixture set for tests.
- `@mukundakatta/ai-supply-chain-manifest`: Build and validate lightweight AI model/data/tool manifests.
- `@mukundakatta/llm-trace-sampler`: Sample LLM traces by risk, errors, latency, and deterministic ids.
- `@mukundakatta/openai-responses-testkit`: Test OpenAI Responses API outputs, streams, and tool calls with snapshot-safe helpers.
