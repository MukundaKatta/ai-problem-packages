export type ResponseLike = {
  output_text?: string;
  output?: Array<{
    id?: string;
    call_id?: string;
    type?: string;
    name?: string;
    arguments?: string | Record<string, unknown>;
    function?: {
      name?: string;
      arguments?: string | Record<string, unknown>;
    };
    content?: Array<string | Record<string, unknown>>;
    refusal?: string | Array<string | Record<string, unknown>>;
  }>;
  [key: string]: unknown;
};

export type ToolCall = {
  id: string | null;
  name: string | null;
  arguments: Record<string, unknown>;
  raw: unknown;
};

export type StreamEventLike = {
  type?: string;
  delta?: string;
  text?: string;
  refusal?: string;
  item_id?: string;
  call_id?: string;
  arguments?: string;
  item?: {
    id?: string;
    call_id?: string;
    type?: string;
    name?: string;
    function?: { name?: string };
  };
  response?: unknown;
  data?: unknown;
  error?: unknown;
  [key: string]: unknown;
};

export type StreamSummary = {
  text: string;
  refusal: string;
  toolArguments: Array<{
    id: string;
    name: string | null;
    arguments: Record<string, unknown>;
    rawArguments: string;
  }>;
  eventTypes: string[];
  completed: boolean;
  failed: boolean;
  response: unknown;
  errors: unknown[];
};

export type RedactOptions = {
  redactIds?: boolean;
  redactTimestamps?: boolean;
  redactUsage?: boolean;
  redactMetadataKeys?: string[];
};

export function collectResponseText(response: ResponseLike): string;
export function extractToolCalls(response: ResponseLike): ToolCall[];
export function collectStream(events: Iterable<StreamEventLike>): StreamSummary;
export function redactResponseSnapshot<T>(value: T, options?: RedactOptions): unknown;
export function assertResponseIncludesText(response: ResponseLike, expected: string | RegExp): true;
export function assertToolCalled(response: ResponseLike, name: string, partialArguments?: Record<string, unknown>): ToolCall;
export function assertNoRefusal(responseOrStreamSummary: ResponseLike | StreamSummary): true;
export function assertStreamCompleted(streamSummary: StreamSummary): true;
