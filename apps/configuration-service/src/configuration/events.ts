import { AdspId, DomainEvent, DomainEventDefinition } from '@abgov/adsp-service-sdk';

export const ConfigurationUpdatedDefinition: DomainEventDefinition = {
  name: 'configuration-updated',
  description: 'Signalled when configuration is updated.',
  payloadSchema: {
    type: 'object',
    properties: {
      serviceId: {
        type: 'string',
      },
      revision: {
        type: 'number',
      },
    },
  },
};

export const RevisionCreatedDefinition: DomainEventDefinition = {
  name: 'revision-created',
  description: 'Signalled when configuration revision is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      serviceId: {
        type: 'string',
      },
      revision: {
        type: 'number',
      },
    },
  },
};

export const configurationUpdated = (tenantId: AdspId, serviceId: AdspId, revision: number): DomainEvent => ({
  name: 'configuration-updated',
  timestamp: new Date(),
  tenantId,
  context: {
    namespace: serviceId.namespace,
    name: serviceId.service,
  },
  payload: {
    serviceId: serviceId.toString(),
    revision,
  },
});

export const revisionCreated = (tenantId: AdspId, serviceId: AdspId, revision: number): DomainEvent => ({
  name: 'revision-created',
  timestamp: new Date(),
  tenantId,
  context: {
    namespace: serviceId.namespace,
    name: serviceId.service,
  },
  payload: {
    serviceId: serviceId.toString(),
    revision,
  },
});
