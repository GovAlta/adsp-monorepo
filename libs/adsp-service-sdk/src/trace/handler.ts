import axios, { InternalAxiosRequestConfig } from 'axios';
import type { RequestHandler } from 'express';
import * as context from 'express-http-context';
import type { Logger } from 'winston';
import { context as otelContext, trace as otelTrace, propagation, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Tracer } from '@opentelemetry/api';
import type { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { TRACE_PARENT_HEADER } from './context';
import { createHttpServerTraceHandler, getContextSpan } from './instrument';

interface TraceHandlerOptions {
  logger: Logger;
  sampleRate: number;
  tracerProvider?: NodeTracerProvider;
}

interface AxiosConfigWithSpan extends InternalAxiosRequestConfig {
  _otelClientSpan?: Span;
}

function endClientSpan(span: Span | undefined, status: number, error?: unknown) {
  if (!span) {
    return;
  }

  span.setAttributes({
    'http.status_code': status,
  });

  if (error || status >= 400) {
    if (error) {
      span.recordException(error instanceof Error ? error : String(error));
    }
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : `HTTP ${status}`,
    });
  } else {
    span.setStatus({ code: SpanStatusCode.OK });
  }

  span.end();
}

export function traceRequestInterceptor(config: InternalAxiosRequestConfig, tracer?: Tracer) {
  const configWithSpan = config as AxiosConfigWithSpan;
  const hasTraceparent =
    typeof config.headers?.has === 'function'
      ? config.headers.has(TRACE_PARENT_HEADER)
      : !!(config.headers as Record<string, unknown>)?.[TRACE_PARENT_HEADER];

  const parentSpan = getContextSpan();
  const parentContext = parentSpan ? otelTrace.setSpan(otelContext.active(), parentSpan) : otelContext.active();

  if (tracer && !configWithSpan._otelClientSpan) {
    const clientSpan = tracer.startSpan(
      `${(config.method || 'GET').toUpperCase()} ${config.url || 'unknown'}`,
      {
        kind: SpanKind.CLIENT,
        attributes: {
          'http.method': config.method,
          'http.url': config.url,
        },
      },
      parentContext,
    );

    configWithSpan._otelClientSpan = clientSpan;
  }

  const contextWithSpan = configWithSpan._otelClientSpan
    ? otelTrace.setSpan(parentContext, configWithSpan._otelClientSpan)
    : parentContext;

  if (!hasTraceparent) {
    const carrier = config.headers || {};

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

  if (configWithSpan._otelClientSpan) {
    configWithSpan._otelClientSpan.addEvent('http.client.request', {
      'http.method': config.method,
      'http.url': config.url,
    });
  } else if (parentSpan) {
    parentSpan.addEvent('http.client.request', {
      'http.method': config.method,
      'http.url': config.url,
    });
  }

  return config;
}

export function createTraceHandler({
  logger,
  sampleRate: _sampleRate,
  tracerProvider,
}: TraceHandlerOptions): RequestHandler {
  const tracer = tracerProvider?.getTracer('adsp-service-sdk');

  // Use an axios interceptor to inject trace context into outbound request headers.
  axios.interceptors.request.use((config) => traceRequestInterceptor(config, tracer));
  axios.interceptors.response.use(
    (response) => {
      const config = response.config as AxiosConfigWithSpan;
      const clientSpan = config?._otelClientSpan;
      if (clientSpan) {
        clientSpan.setAttributes({
          'http.client.status': response.status,
        });
      }
      endClientSpan(clientSpan, response.status);
      return response;
    },
    (error) => {
      const config = error?.config as AxiosConfigWithSpan | undefined;
      const clientSpan = config?._otelClientSpan;
      endClientSpan(clientSpan, error?.response?.status || 0, error);
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
