// import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
// import axios from 'axios';
// import { EventLogCriteria, EventLogRepository } from '../model/eventLog';

// export class ValueServiceEventLogRepository implements EventLogRepository {
//   constructor(
//     private directory: ServiceDirectory,
//     private tokenProvider: TokenProvider,
//   ) {}

//   async countEvents(tenantId: AdspId, criteria: EventLogCriteria): Promise<number> {
//     const valueServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:value-service:v1`);
//     const countUrl = new URL('v1/event-service/values/event/count', valueServiceUrl);

//     // Event namespace and name are stored in the logged value's context, not its namespace/name.
//     const context: Record<string, string> = {};
//     if (criteria.namespace) {
//       context.namespace = criteria.namespace;
//     }
//     if (criteria.name) {
//       context.name = criteria.name;
//     }

//     const token = await this.tokenProvider.getAccessToken();
//     const { data } = await axios.get<{ count: number }>(countUrl.href, {
//       headers: { Authorization: `Bearer ${token}` },
//       params: {
//         tenantId: tenantId.toString(),
//         ...(Object.keys(context).length > 0 ? { context: JSON.stringify(context) } : {}),
//         ...(criteria.timestampMin ? { timestampMin: criteria.timestampMin.toISOString() } : {}),
//         ...(criteria.timestampMax ? { timestampMax: criteria.timestampMax.toISOString() } : {}),
//         ...(criteria.correlationId ? { correlationId: criteria.correlationId } : {}),
//       },
//     });

//     return data?.count ?? 0;
//   }
// }
