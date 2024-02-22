import * as context from 'express-http-context';
import TraceParent = require('traceparent');

export const TRACE_PARENT_CTX = 'adsp_traceparent';
export const TRACE_PARENT_HEADER = 'traceparent';

export function getContextTrace(): TraceParent {
  let trace: TraceParent = null;
  const value = context.get(TRACE_PARENT_CTX);
  if (value instanceof TraceParent) {
    trace = value;
  }

  return trace;
}
