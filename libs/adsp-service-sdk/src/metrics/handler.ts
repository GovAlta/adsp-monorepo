import axios from 'axios';
import { Request, RequestHandler, Response } from 'express';
import * as responseTime from 'response-time';
import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { adspId, AdspId } from '../utils';
import { RequestBenchmark, REQ_BENCHMARK } from './types';

interface ServiceMetrics {
  tenantId: AdspId;
  method: string;
  path: string;
  responseTime: number;
  benchmark: RequestBenchmark;
}

export async function writeMetrics(
  logger: Logger,
  tokenProvider: TokenProvider,
  valueUrl: string,
  { tenantId, method, path, responseTime, benchmark }: ServiceMetrics
): Promise<void> {
  try {
    const metrics = benchmark?.metrics || {};
    const valueWrite = {
      timestamp: new Date(),
      correlationId: `${method}:${path}`,
      tenantId: tenantId.toString(),
      context: {
        method,
        path,
      },
      value: {
        ...metrics,
        responseTime,
      },
      metrics: {
        ...Object.entries(metrics).reduce(
          (values, [name, value]) => ({
            ...values,
            [`${method}:${path}:${name}`]: value,
          }),
          {}
        ),
        [`total:count`]: 1,
        [`${method}:${path}:count`]: 1,
        [`total:response-time`]: responseTime,
        [`${method}:${path}:response-time`]: responseTime,
      },
    };
    const token = await tokenProvider.getAccessToken();
    await axios.post(valueUrl, valueWrite, {
      headers: { Authorization: `Bearer ${token}` },
      params: { tenantId: tenantId.toString() },
      timeout: 2000,
    });
    logger.debug(
      `Wrote service metric to value service for ${valueWrite.correlationId} with response time ${responseTime} ms.`,
      {
        context: 'MetricsHandler',
        tenant: tenantId.toString(),
      }
    );
  } catch (err) {
    logger.debug(`Error encountered writing service metrics. ${err}`, {
      context: 'MetricsHandler',
      tenant: tenantId.toString(),
    });
  }
}

export async function createMetricsHandler(
  serviceId: AdspId,
  logger: Logger,
  tokenProvider: TokenProvider,
  directory: ServiceDirectory
): Promise<RequestHandler> {
  const valueServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:value-service:v1`);
  const valueUrl = new URL(`v1/${serviceId.service}/values/service-metrics`, valueServiceUrl);
  const responseTimeHandler = responseTime((req: Request, _res: Response, time) => {
    // Write if there is a tenant context to the request.
    if (req.tenant?.id) {
      writeMetrics(logger, tokenProvider, valueUrl.href, {
        tenantId: req.tenant.id,
        method: req.method,
        path: req.baseUrl + req.url,
        responseTime: time,
        benchmark: req[REQ_BENCHMARK],
      });
    }
  });

  return function (req, res, next) {
    req[REQ_BENCHMARK] = { timings: {}, metrics: {} } as RequestBenchmark;
    responseTimeHandler(req, res, next);
  };
}
