# @mukundakatta/openai-responses-testkit

Zero-dependency helpers for testing OpenAI Responses API outputs, streamed events, and tool calls.

Use it when you want stable tests around:

- final `response.output` arrays
- streamed `response.output_text.delta` events
- streamed function-call argument deltas
- streamed function-call argument done events
- tool-call extraction
- snapshot-safe redaction of ids, timestamps, and usage
- TypeScript users via bundled `.d.ts` declarations
- lightweight assertions for CI

## Install

```bash
npm install @mukundakatta/openai-responses-testkit
```

## Usage

```js
import {
  collectResponseText,
  collectStream,
  extractToolCalls,
  redactResponseSnapshot,
  assertResponseIncludesText,
  assertStreamCompleted,
  assertToolCalled,
} from "@mukundakatta/openai-responses-testkit";

const text = collectResponseText(response);
assertResponseIncludesText(response, "refund policy");

const calls = extractToolCalls(response);
assertToolCalled(response, "search_docs", { query: "refund" });

const snapshot = redactResponseSnapshot(response);
```

Streaming tests:

```js
const summary = collectStream([
  { type: "response.output_item.added", item: { id: "call_1", type: "function_call", name: "search_docs" } },
  { type: "response.output_text.delta", delta: "Hello" },
  { type: "response.output_text.delta", delta: " world" },
  { type: "response.function_call_arguments.done", item_id: "call_1", arguments: "{\"query\":\"refund\"}" },
  { type: "response.completed", response: { id: "resp_123" } },
]);

console.log(summary.text); // "Hello world"
assertStreamCompleted(summary);
```

## API

- `collectResponseText(response)`
- `extractToolCalls(response)`
- `collectStream(events)`
- `redactResponseSnapshot(value, options)`
- `assertResponseIncludesText(response, expected)`
- `assertToolCalled(response, name, partialArguments)`
- `assertNoRefusal(response)`
- `assertStreamCompleted(streamSummary)`

This package is intentionally small and dependency-free so it can be copied into examples, CI tests, and SDK repro cases.
