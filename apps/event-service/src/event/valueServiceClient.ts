import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { EventLogCountResponse, EventLogCriteria } from './model/eventLog';
import axios from 'axios';

export const countEvents = async (
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  tenantId: AdspId,
  criteria: EventLogCriteria,
): Promise<EventLogCountResponse> => {
  const valueServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:value-service:v1`);
  const countUrl = new URL('v1/event-service/values/event/count', valueServiceUrl);

  // Event namespace and name are stored in the logged value's context, not its namespace/name.
  const context: Record<string, string | number | boolean> = { ...criteria.context };
  if (!context.namespace && criteria.namespace) {
    context.namespace = criteria.namespace;
  }
  if (!context.name && criteria.name) {
    context.name = criteria.name;
  }

  const token = await tokenProvider.getAccessToken();
  const { data } = await axios.get<EventLogCountResponse>(countUrl.href, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      tenantId: tenantId.toString(),
      ...(Object.keys(context).length > 0 ? { context: JSON.stringify(context) } : {}),
      ...(criteria.timestampMin ? { timestampMin: criteria.timestampMin.toISOString() } : {}),
      ...(criteria.timestampMax ? { timestampMax: criteria.timestampMax.toISOString() } : {}),
      ...(criteria.correlationId ? { correlationId: criteria.correlationId } : {}),
    },
  });

  return { ...data, count: data?.count ?? 0 };
};
