import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { EventLogCriteria } from './model/eventLog';
import axios from 'axios';

export const countEvents = async (
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  tenantId: AdspId,
  criteria: EventLogCriteria,
): Promise<number> => {
  const valueServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:value-service:v1`);
  const valueServiceCountUrl = new URL('v1/event-service/values/event/count', valueServiceUrl);

  // Event namespace and name are stored in the logged value's context, not its namespace/name.
  const context: Record<string, string> = { ...criteria.context };

  const token = await tokenProvider.getAccessToken();
  const { data } = await axios.get<{ count: number }>(valueServiceCountUrl.href, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      tenantId: tenantId.toString(),
      ...(Object.keys(context).length > 0 ? { context: JSON.stringify(context) } : {}),
      ...(criteria.timestampMin ? { timestampMin: criteria.timestampMin.toISOString() } : {}),
      ...(criteria.timestampMax ? { timestampMax: criteria.timestampMax.toISOString() } : {}),
      ...(criteria.correlationId ? { correlationId: criteria.correlationId } : {}),
    },
  });

  return data?.count ?? 0;
};
