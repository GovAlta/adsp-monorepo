import axios from 'axios';
import { Request, RequestHandler, Response } from 'express';
import { throttle } from 'lodash';
import { context as otelContext, ROOT_CONTEXT } from '@opentelemetry/api';
import type { MeterProvider } from '@opentelemetry/sdk-metrics';
import * as responseTime from 'response-time';
import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { adspId, AdspId } from '../utils';
import { RequestBenchmark, REQ_BENCHMARK } from './types';
import { getContextTrace } from '../trace';

function getRoute(req: Request): string {
  if (typeof req.route?.path === 'string') {
    return `${req.baseUrl || ''}${req.route.path}`;
  }

  return req.baseUrl || req.path || req.originalUrl || 'unknown';
}

function getMetricAttributes(req: Request, res: Response): Record<string, string | number> {
  return {
    'http.request.method': req.method,
    'http.route': getRoute(req),
    'http.response.status_code': res.statusCode || 0,
  };
}

/**
 * @deprecated Value service metrics recording is deprecated. Use OpenTelemetry instrumentation via the
 * `meterProvider` option of `createMetricsHandler` instead.
 */
export async function writeMetrics(
  serviceId: AdspId,
  directory: ServiceDirectory,
  logger: Logger,
  tokenProvider: TokenProvider,
  buffer: Record<string, unknown[]>,
): Promise<void> {
  const valueServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:value-service:v1`);
  const valueUrl = new URL(`v1/${serviceId.service}/values/service-metrics`, valueServiceUrl);

  // Value service write does not handle writing a batch of values of mixed tenancy, so group by tenant then write.
  for (const tenantId of Object.getOwnPropertyNames(buffer)) {
    try {
      const values = buffer[tenantId]?.splice(0) || [];
      if (values.length > 0) {
        const token = await tokenProvider.getAccessToken();

        // Suppress tracing for deferred writes so throttled metric flushes do not attach to
        // request spans that scheduled the write.
        await axios.post(valueUrl.href, values, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { tenantId },
          timeout: 30000,
          _otelSuppressTracing: true,
        } as unknown as import('axios').InternalAxiosRequestConfig);
        logger.debug(`Wrote service metrics to value service.`, {
          context: 'MetricsHandler',
          tenant: tenantId,
        });
      }
    } catch (err) {
      logger.warn(`Error encountered writing service metrics. ${err}`, {
        context: 'MetricsHandler',
        tenant: tenantId,
      });
    }
  }
}

// Throttle the metric writes so that there isn't a write request per measured request at higher request volumes.
const WRITE_THROTTLE_MS = 60000;

/**
 * Creates an Express middleware handler for service request metrics.
 *
 * @deprecated The value service metrics recording path (requires `serviceId`, `tokenProvider`, `directory`) is
 * deprecated. Provide a `meterProvider` and omit the value service dependencies to use OpenTelemetry instrumentation
 * only. Value service metric recording will be removed in a future release.
 */
export async function createMetricsHandler(
  serviceId: AdspId,
  logger: Logger,
  tokenProvider: TokenProvider,
  directory: ServiceDirectory,
  defaultTenantId?: AdspId,
  meterProvider?: MeterProvider,
): Promise<RequestHandler> {
  const valuesBuffer: Record<string, unknown[]> = {};
  const writeBuffer = throttle(writeMetrics, WRITE_THROTTLE_MS, { leading: false });

  const meter = meterProvider?.getMeter('adsp-service-sdk');
  const requestCount = meter?.createCounter('http.server.request.count', {
    description: 'Total HTTP requests handled by the service.',
  });
  const requestDuration = meter?.createHistogram('http.server.request.duration', {
    description: 'Duration of HTTP requests handled by the service.',
    unit: 'ms',
  });
  const activeRequests = meter?.createUpDownCounter('http.server.request.active', {
    description: 'Active HTTP requests currently being handled by the service.',
  });
  const errorCount = meter?.createCounter('http.server.request.errors', {
    description: 'HTTP requests that resulted in 5xx responses.',
  });

  const responseTimeHandler = responseTime((req: Request, _res: Response, time) => {
    const otelAttributes = getMetricAttributes(req, _res);
    requestCount?.add(1, otelAttributes);
    requestDuration?.record(time, otelAttributes);
    activeRequests?.add(-1, { 'http.request.method': req.method });
    if ((_res.statusCode || 0) >= 500) {
      errorCount?.add(1, otelAttributes);
    }

    // Write if there is a tenant context to the request.
    // Check user tenant context if tenant handler is not included on route.
    const tenantId = defaultTenantId || req.tenant?.id || req.user?.tenantId;
    if (tenantId) {
      const benchmark: RequestBenchmark = req[REQ_BENCHMARK];
      const metrics = benchmark?.metrics || {};

      const method = req.method;
      const path = `${req.baseUrl || ''}${req.path || ''}` || req.originalUrl;
      const route = req.route?.path;
      const ip = req.ip;
      const trace = getContextTrace();

      const value = {
        timestamp: new Date(),
        correlationId: trace ? trace.toString() : `${method}:${route || path}`,
        tenantId: tenantId.toString(),
        context: {
          method,
          path,
          route,
          ip,
          user: req.user?.name,
          userId: req.user?.id,
          trace: trace?.toString(),
        },
        value: {
          ...metrics,
          responseTime: time,
        },
        metrics: {
          ...Object.entries(metrics).reduce(
            (values, [name, value]) => ({
              ...values,
              [`total:${name}`]: value,
              [`${method}:${path}:${name}`]: value,
            }),
            {},
          ),
          [`total:count`]: 1,
          [`${method}:${path}:count`]: 1,
          [`total:response-time`]: time,
          [`${method}:${path}:response-time`]: time,
        },
      };

      if (!valuesBuffer[value.tenantId]) {
        valuesBuffer[value.tenantId] = [];
      }
      valuesBuffer[value.tenantId].push(value);
      // Schedule deferred writes in ROOT_CONTEXT so delayed callbacks do not inherit request spans.
      otelContext.with(ROOT_CONTEXT, () => {
        writeBuffer(serviceId, directory, logger, tokenProvider, valuesBuffer);
      });
    }
  });

  return function (req, res, next) {
    activeRequests?.add(1, { 'http.request.method': req.method });
    req[REQ_BENCHMARK] = { timings: {}, metrics: {} } as RequestBenchmark;
    responseTimeHandler(req, res, next);
  };
}
