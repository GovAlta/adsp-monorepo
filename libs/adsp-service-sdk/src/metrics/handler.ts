import axios from 'axios';
import { Request, RequestHandler, Response } from 'express';
import { throttle } from 'lodash';
import * as responseTime from 'response-time';
import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { adspId, AdspId } from '../utils';
import { RequestBenchmark, REQ_BENCHMARK } from './types';
import { getContextTrace } from '../trace';

export async function writeMetrics(
  serviceId: AdspId,
  directory: ServiceDirectory,
  logger: Logger,
  tokenProvider: TokenProvider,
  buffer: Record<string, unknown[]>
): Promise<void> {
  const valueServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:value-service:v1`);
  const valueUrl = new URL(`v1/${serviceId.service}/values/service-metrics`, valueServiceUrl);

  // Value service write does not handle writing a batch of values of mixed tenancy, so group by tenant then write.
  for (const tenantId of Object.getOwnPropertyNames(buffer)) {
    try {
      const values = buffer[tenantId]?.splice(0) || [];
      if (values.length > 0) {
        const token = await tokenProvider.getAccessToken();
        await axios.post(valueUrl.href, values, {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId },
          timeout: 30000,
        });
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
export async function createMetricsHandler(
  serviceId: AdspId,
  logger: Logger,
  tokenProvider: TokenProvider,
  directory: ServiceDirectory,
  defaultTenantId?: AdspId
): Promise<RequestHandler> {
  const valuesBuffer: Record<string, unknown[]> = {};
  const writeBuffer = throttle(writeMetrics, WRITE_THROTTLE_MS, { leading: false });
  const responseTimeHandler = responseTime((req: Request, _res: Response, time) => {
    // Write if there is a tenant context to the request.
    const tenantId = defaultTenantId || req.tenant?.id;
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
            {}
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
      writeBuffer(serviceId, directory, logger, tokenProvider, valuesBuffer);
    }
  });

  return function (req, res, next) {
    req[REQ_BENCHMARK] = { timings: {}, metrics: {} } as RequestBenchmark;
    responseTimeHandler(req, res, next);
  };
}
