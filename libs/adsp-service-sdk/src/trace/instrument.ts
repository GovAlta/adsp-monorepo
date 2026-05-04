import axios from 'axios';
import type { RequestHandler } from 'express';
import type { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Logger } from 'winston';
import { context as otelContext, propagation, trace as otelTrace, SpanStatusCode, SpanKind } from '@opentelemetry/api';
export function instrumentAxios(logger: Logger) {
  const timings = new Map();

  axios.interceptors.request.use(function (config) {
    timings.set(config, process.hrtime());
    return config;
  });

  axios.interceptors.response.use(function (response) {
    const config = response?.config;
    if (config) {
      const start = timings.get(config);
      if (start) {
        timings.delete(config);

        const [sec, nano] = process.hrtime(start);
        const duration = Math.round(sec * 1e3 + nano * 1e-6);

        const trace = config.headers?.get('traceparent');
        logger.debug(`Timing for request to ${config.url}: ${duration} ms`, { context: 'Instrumentation', trace });
      }
    }
    return response;
  });
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

      const span = tracer.startSpan(
        `${req.method} ${req.route?.path || req.path}`,
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
          },
        },
        parentContext,
      );

      // Record span completion on response
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      const recordSpanCompletion = () => {
        span.setAttributes({
          'http.status_code': res.statusCode,
        });

        // Determine span status based on HTTP status code
        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`,
          });
        } else {
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

      // Ensure span ends even if response is not sent through json/send
      res.on('finish', () => {
        if (span.isRecording()) {
          recordSpanCompletion();
        }
      });

      // Run downstream handlers with span context active
      otelContext.with(otelTrace.setSpan(parentContext, span), () => {
        next();
      });
  };
}
