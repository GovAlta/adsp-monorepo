import axios from 'axios';
import type { RequestHandler } from 'express';
import * as context from 'express-http-context';
import TraceParent = require('traceparent');
import type { Logger } from 'winston';

const TRACE_PARENT_CTX = 'adsp_traceparent';
const TRACE_PARENT_HEADER = 'traceparent';

export function getContextTrace(): TraceParent {
  let trace: TraceParent = null;
  const value = context.get(TRACE_PARENT_CTX);
  if (value instanceof TraceParent) {
    trace = value;
  }

  return trace;
}

interface TraceHandlerOptions {
  logger: Logger;
  sampleRate: number;
}

export function createTraceHandler({ logger, sampleRate }: TraceHandlerOptions): RequestHandler {
  // Use an axios interceptor to add the traceparent header if not already present.
  axios.interceptors.request.use((config) => {
    const trace = getContextTrace();
    if (trace && !config.headers?.has(TRACE_PARENT_HEADER)) {
      config.headers?.set(TRACE_PARENT_HEADER, trace.toString());
    }
    return config;
  });

  return function (req, res, next) {
    context.middleware(req, res, (err: unknown) => {
      if (!err) {
        try {
          const trace = TraceParent.startOrResume(req.headers[TRACE_PARENT_HEADER] as string, {
            transactionSampleRate: sampleRate,
          });
          context.set(TRACE_PARENT_CTX, trace);

          // Debug log non-root endpoint requests.
          if (req.originalUrl?.length > 1) {
            logger.debug(`${req.method}: ${req.originalUrl} from ${req.ip}`);
          }
        } catch (traceErr) {
          err = traceErr;
        }
      }

      next(err);
    });
  };
}
