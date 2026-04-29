import axios, { InternalAxiosRequestConfig } from 'axios';
import type { RequestHandler } from 'express';
import * as context from 'express-http-context';
import type { Logger } from 'winston';
import { context as otelContext, trace as otelTrace, propagation, SpanStatusCode } from '@opentelemetry/api';
import type { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { TRACE_PARENT_HEADER } from './context';
import { createHttpServerTraceHandler, getContextSpan } from './instrument';

interface TraceHandlerOptions {
  logger: Logger;
  sampleRate: number;
  tracerProvider?: NodeTracerProvider;
}

export function traceRequestInterceptor(config: InternalAxiosRequestConfig) {
  const hasTraceparent =
    typeof config.headers?.has === 'function'
      ? config.headers.has(TRACE_PARENT_HEADER)
      : !!(config.headers as Record<string, unknown>)?.[TRACE_PARENT_HEADER];

  if (!hasTraceparent) {
    const carrier = config.headers || {};
    const span = getContextSpan();
    const contextWithSpan = span ? otelTrace.setSpan(otelContext.active(), span) : otelContext.active();

    propagation.inject(contextWithSpan, carrier, {
      set: (headerCarrier, key, value) => {
        if (typeof (headerCarrier as InternalAxiosRequestConfig['headers'])?.set === 'function') {
          (headerCarrier as InternalAxiosRequestConfig['headers']).set(key, value);
        } else {
          (headerCarrier as Record<string, unknown>)[key] = value;
        }
      },
    });
    config.headers = carrier as InternalAxiosRequestConfig['headers'];
  }

  // Record outbound HTTP request event on active span.
  const span = getContextSpan();
  if (span) {
    otelContext.with(otelTrace.setSpan(otelContext.active(), span), () => {
      const activeSpan = otelTrace.getActiveSpan();
      if (activeSpan) {
        activeSpan.addEvent('http.client.request', {
          'http.method': config.method,
          'http.url': config.url,
        });
      }
    });
  }

  return config;
}

export function createTraceHandler({
  logger,
  sampleRate: _sampleRate,
  tracerProvider,
}: TraceHandlerOptions): RequestHandler {
  // Use an axios interceptor to inject trace context into outbound request headers.
  axios.interceptors.request.use(traceRequestInterceptor);
  axios.interceptors.response.use(
    (response) => {
      const span = getContextSpan();
      if (span) {
        span.setAttributes({
          'http.client.status': response.status,
        });
      }
      return response;
    },
    (error) => {
      const span = getContextSpan();
      if (span) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
      return Promise.reject(error);
    },
  );

  const requestMiddleware = tracerProvider
    ? createHttpServerTraceHandler(tracerProvider)
    : (req, res, next) => context.middleware(req, res, next as (err?: unknown) => void);

  return function (req, res, next) {
    requestMiddleware(req, res, (err: unknown) => {
      if (!err && req.originalUrl?.length > 1) {
        logger.debug(`${req.method}: ${req.originalUrl} from ${req.ip}`);
      }

      next(err);
    });
  };
}
