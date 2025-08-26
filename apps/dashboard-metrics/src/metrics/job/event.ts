import { ServiceDirectory, Tenant, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { DateTime } from 'luxon';
import { Logger } from 'winston';
import { CACHE_SERVICE_ID, Metrics, MetricsResponse, VALUE_SERVICE_ID } from './types';

export function createGetEventMetrics(logger: Logger, directory: ServiceDirectory, tokenProvider: TokenProvider) {
  return async (tenant: Tenant, metric: string, date: DateTime): Promise<Metrics> => {
    try {
      const cacheServiceUrl = await directory.getServiceUrl(CACHE_SERVICE_ID);
      const eventMetricsUrl = new URL(
        `v1/cache/${VALUE_SERVICE_ID}/event-service/values/event/metrics`,
        cacheServiceUrl
      );
      const token = await tokenProvider.getAccessToken();

      const { data } = await axios.get<MetricsResponse>(eventMetricsUrl.href, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          tenantId: tenant.id.toString(),
          interval: 'daily',
          criteria: JSON.stringify({
            metricLike: metric,
            intervalMax: date.toISO(),
            intervalMin: date.toISO(),
          }),
        },
      });

      const item = data[metric]?.values[0];
      logger.debug(
        `Fetched event metric ${metric} for tenant ${tenant.name} ${item ? 'with result' : 'without result'}.`,
        { context: 'getEventMetrics', tenantId: tenant.id.toString() }
      );
      return (
        item && {
          interval: item.interval,
          sum: Number(item.sum),
          avg: Number(item.avg),
          min: Number(item.min),
          max: Number(item.max),
          count: Number(item.count),
        }
      );
    } catch (err) {
      logger.error(`Error fetching event metrics for tenant ${tenant.name}: ${err}`, {
        context: 'getEventMetrics',
        tenantId: tenant.id.toString(),
      });
    }
  };
}
