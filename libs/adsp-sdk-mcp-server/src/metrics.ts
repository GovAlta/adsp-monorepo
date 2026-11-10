import type { BatchObservableCallback, MeterProvider } from '@opentelemetry/api';
import { monitorEventLoopDelay } from 'perf_hooks';

export type RejectionReason = 'in_flight_cap' | 'rate_limit' | 'origin' | 'live_tool_cap';
export type ToolErrorType = 'tool_error' | 'exception' | 'unknown_tool' | 'busy';
export type UpstreamErrorType =
  | 'http_4xx'
  | 'http_5xx'
  | 'network'
  | 'not_in_directory'
  | 'not_authenticated'
  | 'other';

export interface McpMetrics {
  addInFlight(delta: 1 | -1): void;
  recordRejection(reason: RejectionReason): void;
  /** `method` must already be bucketed with `bucketMcpMethod`. */
  recordRequest(method: string, statusCode: number, durationSeconds: number): void;
  recordToolCall(toolName: string, durationSeconds: number, errorType?: ToolErrorType): void;
  recordUpstreamError(toolName: string, errorType: UpstreamErrorType): void;
  recordDocsIndexBuild(durationSeconds: number): void;
}

const NOOP_METRICS: McpMetrics = {
  addInFlight: () => undefined,
  recordRejection: () => undefined,
  recordRequest: () => undefined,
  recordToolCall: () => undefined,
  recordUpstreamError: () => undefined,
  recordDocsIndexBuild: () => undefined,
};

let current: McpMetrics = NOOP_METRICS;

export function getMetrics(): McpMetrics {
  return current;
}

const DURATION_BUCKETS_SECONDS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
const NANOSECONDS_PER_SECOND = 1e9;
const EVENT_LOOP_RESOLUTION_MS = 10;

export function installMetrics(meterProvider: MeterProvider): { uninstall(): void } {
  const meter = meterProvider.getMeter('adsp-sdk-mcp-server');
  const durationAdvice = { advice: { explicitBucketBoundaries: DURATION_BUCKETS_SECONDS } };

  const inFlight = meter.createUpDownCounter('mcp.requests.in_flight', {
    description: 'MCP requests admitted and not yet answered.',
    unit: '{request}',
  });
  const rejected = meter.createCounter('mcp.requests.rejected', {
    description: 'MCP requests or tool calls refused by an overload guard, by reason.',
    unit: '{request}',
  });
  const requestDuration = meter.createHistogram('mcp.request.duration', {
    description: 'Time to answer a POST /mcp request, by JSON-RPC method.',
    unit: 's',
    ...durationAdvice,
  });
  const toolDuration = meter.createHistogram('mcp.tool.duration', {
    description: 'Time to run a tool call, by tool and error type.',
    unit: 's',
    ...durationAdvice,
  });
  const upstreamErrors = meter.createCounter('mcp.live_tool.upstream.errors', {
    description: 'Failed upstream calls made by the live tools.',
    unit: '{error}',
  });
  const docsIndexBuild = meter.createHistogram('mcp.docs_index.build.duration', {
    description: 'Time to build the docs index and tool definitions for a docs root.',
    unit: 's',
    ...durationAdvice,
  });

  const eventLoopP50 = meter.createObservableGauge('nodejs.eventloop.delay.p50', { unit: 's' });
  const eventLoopP99 = meter.createObservableGauge('nodejs.eventloop.delay.p99', { unit: 's' });
  const eventLoopMax = meter.createObservableGauge('nodejs.eventloop.delay.max', { unit: 's' });
  const heapUsed = meter.createObservableGauge('v8js.memory.heap.used', { unit: 'By' });
  const rss = meter.createObservableGauge('process.memory.usage', { unit: 'By' });
  const observables = [eventLoopP50, eventLoopP99, eventLoopMax, heapUsed, rss];

  const eventLoopDelay = monitorEventLoopDelay({ resolution: EVENT_LOOP_RESOLUTION_MS });
  eventLoopDelay.enable();

  const observe: BatchObservableCallback = (result) => {
    if (eventLoopDelay.count > 0) {
      result.observe(eventLoopP50, eventLoopDelay.percentile(50) / NANOSECONDS_PER_SECOND);
      result.observe(eventLoopP99, eventLoopDelay.percentile(99) / NANOSECONDS_PER_SECOND);
      result.observe(eventLoopMax, eventLoopDelay.max / NANOSECONDS_PER_SECOND);
    }
    // Reset so each export reports the delay since the previous one, not since startup.
    eventLoopDelay.reset();

    const memory = process.memoryUsage();
    result.observe(heapUsed, memory.heapUsed);
    result.observe(rss, memory.rss);
  };
  meter.addBatchObservableCallback(observe, observables);

  current = {
    addInFlight: (delta) => inFlight.add(delta),
    recordRejection: (reason) => rejected.add(1, { reason }),
    recordRequest: (method, statusCode, durationSeconds) =>
      requestDuration.record(durationSeconds, {
        'mcp.method.name': method,
        'http.response.status_code': statusCode,
      }),
    recordToolCall: (toolName, durationSeconds, errorType) =>
      toolDuration.record(
        durationSeconds,
        errorType ? { 'mcp.tool.name': toolName, 'error.type': errorType } : { 'mcp.tool.name': toolName }
      ),
    recordUpstreamError: (toolName, errorType) =>
      upstreamErrors.add(1, { 'mcp.tool.name': toolName, 'error.type': errorType }),
    recordDocsIndexBuild: (durationSeconds) => docsIndexBuild.record(durationSeconds),
  };

  return {
    uninstall() {
      meter.removeBatchObservableCallback(observe, observables);
      eventLoopDelay.disable();
      current = NOOP_METRICS;
    },
  };
}

const KNOWN_MCP_METHODS = new Set([
  'initialize',
  'ping',
  'tools/list',
  'tools/call',
  'resources/list',
  'resources/read',
  'resources/templates/list',
  'resources/subscribe',
  'resources/unsubscribe',
  'prompts/list',
  'prompts/get',
  'logging/setLevel',
  'completion/complete',
  'notifications/initialized',
  'notifications/cancelled',
  'notifications/progress',
  'notifications/roots/list_changed',
]);

export function bucketMcpMethod(message: unknown): string {
  if (Array.isArray(message)) {
    return 'batch';
  }
  const method = (message as { method?: unknown } | null | undefined)?.method;
  if (typeof message !== 'object' || typeof method !== 'string') {
    return 'unparsed';
  }
  return KNOWN_MCP_METHODS.has(method) ? method : 'other';
}
