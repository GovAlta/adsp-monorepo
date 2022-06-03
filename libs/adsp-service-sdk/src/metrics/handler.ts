import axios from 'axios';
import { Request, RequestHandler, Response } from 'express';
import { throttle } from 'lodash';
import * as responseTime from 'response-time';
import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { adspId, AdspId } from '../utils';
import { RequestBenchmark, REQ_BENCHMARK } from './types';

export async function writeMetrics(
  logger: Logger,
  tokenProvider: TokenProvider,
  valueUrl: string,
  tenantId: AdspId,
  buffer: unknown[]
): Promise<void> {
  try {
    const values = buffer.splice(0);
    const token = await tokenProvider.getAccessToken();
    await axios.post(valueUrl, values, {
      headers: { Authorization: `Bearer ${token}` },
      params: { tenantId: tenantId.toString() },
      timeout: 30000,
    });
    logger.debug(`Wrote service metrics to value service.`, {
      context: 'MetricsHandler',
      tenant: tenantId.toString(),
    });
  } catch (err) {
    logger.debug(`Error encountered writing service metrics. ${err}`, {
      context: 'MetricsHandler',
      tenant: tenantId.toString(),
    });
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
  const valueServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:value-service:v1`);
  const valueUrl = new URL(`v1/${serviceId.service}/values/service-metrics`, valueServiceUrl);
  const valuesBuffer = [];
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

      const value = {
        timestamp: new Date(),
        correlationId: `${method}:${route || path}`,
        tenantId: tenantId.toString(),
        context: {
          method,
          path,
          route,
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
      valuesBuffer.push(value);
      writeBuffer(logger, tokenProvider, valueUrl.href, tenantId, valuesBuffer);
    }
  });

  return function (req, res, next) {
    req[REQ_BENCHMARK] = { timings: {}, metrics: {} } as RequestBenchmark;
    responseTimeHandler(req, res, next);
  };
}
