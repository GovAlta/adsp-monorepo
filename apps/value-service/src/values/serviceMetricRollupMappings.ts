import { ResourceRollupSource, ServiceMetricRollupMapping } from './types';

export const serviceMetricRollupMappings: ServiceMetricRollupMapping[] = [
  {
    service: 'pdf-service',
    initiated: { namespace: 'pdf-service', name: 'pdf-generation-queued' },
    succeeded: { namespace: 'pdf-service', name: 'pdf-generated' },
    failure_events: { namespace: 'pdf-service', name: 'pdf-generation-failed' },
    duration: { metric: 'pdf-service:pdf-generation:duration' },
    resource: {
      namespace: 'pdf-service',
      names: ['pdf-generation-queued', 'pdf-generated', 'pdf-generation-failed'],
      contextKey: 'templateId',
    },
  },
  {
    service: 'form-service',
    initiated: { namespace: 'form-service', name: 'form-created' },
    succeeded: { namespace: 'form-service', name: 'form-submitted' },
    duration: { metricLike: 'form-service:form-entry:%:duration' },
    resource: {
      namespace: 'form-service',
      names: ['form-created', 'form-submitted'],
      contextKey: 'definitionId',
    },
  },
  {
    service: 'notification-service',
    initiated: {
      namespace: 'notification-service',
      name: 'notifications-generated',
      payloadCountPath: ['payload', 'generatedCount'],
    },
    succeeded: { namespace: 'notification-service', name: 'notification-sent' },
    failure_events: { namespace: 'notification-service', name: 'notification-send-failed' },
    duration: { metric: 'notification-service:notification-send:duration' },
  },
];

// The resources the mappings name, rolled up per day by the event resource rollup job. Kept here so a
// report reading templates or definitions and the rollup that answers it are configured in one place.
export const eventResourceRollupSources: ResourceRollupSource[] = serviceMetricRollupMappings
  .map(({ resource }) => resource)
  .filter((resource): resource is ResourceRollupSource => !!resource);
