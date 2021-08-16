import { AdspId, DomainEvent, DomainEventDefinition } from '@abgov/adsp-service-sdk';

export const ConfigurationUpdatedDefinition: DomainEventDefinition = {
  name: 'configuration-updated',
  description: 'Signalled when configuration is updated.',
  payloadSchema: {
    type: 'object',
    properties: {
      namespace: {
        type: 'string',
      },
      name: {
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
      namespace: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      revision: {
        type: 'number',
      },
    },
  },
};

export const configurationUpdated = (
  tenantId: AdspId,
  namespace: string,
  name: string,
  revision: number
): DomainEvent => ({
  name: 'configuration-updated',
  timestamp: new Date(),
  tenantId,
  context: {
    namespace,
    name,
  },
  payload: {
    namespace,
    name,
    revision,
  },
});

export const revisionCreated = (tenantId: AdspId, namespace: string, name: string, revision: number): DomainEvent => ({
  name: 'revision-created',
  timestamp: new Date(),
  tenantId,
  context: {
    namespace,
    name,
  },
  payload: {
    namespace,
    name,
    revision,
  },
});
