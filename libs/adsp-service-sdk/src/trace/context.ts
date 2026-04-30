import { context as otelContext, trace as otelTrace } from '@opentelemetry/api';
export const TRACE_PARENT_HEADER = 'traceparent';

export function getContextTrace(): { toString(): string } | null {
  const span = otelTrace.getSpan(otelContext.active());
  const spanContext = span?.spanContext();
  if (!spanContext) {
    return null;
  }

  const flags = spanContext.traceFlags.toString(16).padStart(2, '0');
  const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-${flags}`;

  return {
    toString: () => traceparent,
  };
}
