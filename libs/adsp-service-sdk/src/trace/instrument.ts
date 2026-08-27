import axios, { InternalAxiosRequestConfig } from 'axios';
import type { Request, RequestHandler } from 'express';
import type { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Logger } from 'winston';
import { context as otelContext, propagation, trace as otelTrace, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { getRouteTemplate } from '../utils/route';

function getTenantId(req: Request): string | undefined {
  const tenantId = req.tenant?.id || req.user?.tenantId;
  return tenantId ? tenantId.toString() : undefined;
}

function getTenantName(req: Request): string | undefined {
  return req.tenant?.name;
}

export function instrumentAxios(logger: Logger) {
  // WeakMap, not Map: entries are keyed by the axios config, and a rejected request has no
  // response interceptor to delete its entry. With a strong Map every failed outbound call leaked
  // an entry -- and its config -- for the lifetime of the process.
  const timings = new WeakMap<object, [number, number]>();

  const logTiming = (config: InternalAxiosRequestConfig | undefined, outcome: string) => {
    if (!config) {
      return;
    }

    const start = timings.get(config);
    if (!start) {
      return;
    }

    timings.delete(config);
    const [sec, nano] = process.hrtime(start);
    const duration = Math.round(sec * 1e3 + nano * 1e-6);
    const trace = config.headers?.get?.('traceparent');
    logger.debug(`Timing for ${outcome} request to ${config.url}: ${duration} ms`, {
      context: 'Instrumentation',
      trace,
    });
  };

  axios.interceptors.request.use(function (config) {
    timings.set(config, process.hrtime());
    return config;
  });

  axios.interceptors.response.use(
    function (response) {
      logTiming(response?.config, 'completed');
      return response;
    },
    function (err) {
      logTiming(err?.config, 'failed');
      return Promise.reject(err);
    }
  );
}

/**
 * Create Express middleware for OpenTelemetry HTTP server tracing.
 *
 * This middleware creates a server span for each incoming HTTP request, records
 * semantic attributes, and ensures the span is available in request context for
 * downstream handlers and outbound requests.
 *
 * @param tracerProvider - The NodeTracerProvider instance
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const app = express();
 * if (capabilities.tracerProvider) {
 *   app.use(createHttpServerTraceHandler(capabilities.tracerProvider));
 * }
 * ```
 */
export function createHttpServerTraceHandler(tracerProvider: NodeTracerProvider): RequestHandler {
  const tracer = tracerProvider.getTracer('adsp-service-sdk');

  return function (req, res, next) {
    const parentContext = propagation.extract(otelContext.active(), req.headers);
    const tenantId = getTenantId(req);
    const tenantName = getTenantName(req);

    // This middleware runs before Express matches a route, so req.route is not populated yet and
    // the span starts named by method alone. It is renamed to the route template on completion.
    // Naming it from req.path here would bake resource IDs into the span name, which the collector
    // turns into an unbounded spanmetrics label.
    const span = tracer.startSpan(
      req.method,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': req.method,
          'http.url': req.originalUrl,
          'http.target': req.path,
          'http.host': req.hostname,
          'http.scheme': req.protocol,
          'http.flavor': `${req.httpVersion}`,
          'http.client_ip': req.ip,
          'http.user_agent': req.get('user-agent'),
          ...(tenantId ? { 'adsp.tenant.id': tenantId } : {}),
          ...(tenantName ? { 'adsp.tenant.name': tenantName } : {}),
        },
      },
      parentContext,
    );

    // Record span completion on response
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const recordSpanCompletion = () => {
      const route = getRouteTemplate(req);
      span.updateName(route ? `${req.method} ${route}` : `${req.method} <unmatched>`);

      const completionAttributes: Record<string, string | number> = {
        'http.status_code': res.statusCode,
      };
      if (route) {
        completionAttributes['http.route'] = route;
      }
      const completionTenantId = getTenantId(req);
      if (completionTenantId) {
        completionAttributes['adsp.tenant.id'] = completionTenantId;
      }
      const completionTenantName = getTenantName(req);
      if (completionTenantName) {
        completionAttributes['adsp.tenant.name'] = completionTenantName;
      }

      span.setAttributes(completionAttributes);

      // Per the OTel HTTP semantic conventions, 4xx leaves a SERVER span's status unset: the
      // server did its job by rejecting the request, and the failure belongs to the caller. Only
      // 5xx is a server error. Marking 4xx as ERROR here made every expected rejection -- the
      // directory's 424 for entries without a HAL document, status-service probing dead URLs --
      // show up as a failed edge in the service graph.
      if (res.statusCode >= 500) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else if (res.statusCode < 400) {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      span.end();
    };

    res.json = function (...args) {
      recordSpanCompletion();
      return originalJson(...args);
    };

    res.send = function (...args) {
      recordSpanCompletion();
      return originalSend(...args);
    };

    // Handle errors
    res.on('error', (err) => {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR });
    });

    // Ensure the span ends even if the response did not go through json/send. `close` covers
    // client aborts, which never emit `finish` -- those requests previously produced no span at
    // all, which is unfortunate given an aborted request is often a slow one.
    const endIfUnfinished = () => {
      if (span.isRecording()) {
        recordSpanCompletion();
      }
    };
    res.on('finish', endIfUnfinished);
    res.on('close', endIfUnfinished);

    // Run downstream handlers with span context active
    otelContext.with(otelTrace.setSpan(parentContext, span), () => {
      next();
    });
  };
}
