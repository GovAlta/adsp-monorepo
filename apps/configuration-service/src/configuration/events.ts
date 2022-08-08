import { AdspId, DomainEvent, DomainEventDefinition, Stream, User } from '@abgov/adsp-service-sdk';
import { ConfigurationServiceRoles } from './roles';

const CONFIGURATION_UPDATED = 'configuration-updated';
export const ConfigurationUpdatedDefinition: DomainEventDefinition = {
  name: CONFIGURATION_UPDATED,
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
      lastUpdated: {
        type: 'string',
        format: 'date-time',
      },
      update: {
        type: 'object',
        properties: {
          operation: { type: 'string' },
          data: {},
        },
      },
      updatedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

const REVISION_CREATED = 'revision-created';
export const RevisionCreatedDefinition: DomainEventDefinition = {
  name: REVISION_CREATED,
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
      created: {
        type: 'string',
        format: 'date-time',
      },
      createdBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

export const configurationUpdated = (
  updatedBy: User,
  tenantId: AdspId,
  namespace: string,
  name: string,
  revision: number,
  lastUpdated: string,
  update: { operation: string; data: unknown }
): DomainEvent => ({
  name: CONFIGURATION_UPDATED,
  timestamp: new Date(),
  tenantId,
  correlationId: `${namespace}:${name}`,
  context: {
    namespace,
    name,
  },
  payload: {
    namespace,
    name,
    revision,
    lastUpdated,
    update,
    updatedBy: {
      name: updatedBy.name,
      id: updatedBy.id,
    },
  },
});

export const revisionCreated = (
  createdBy: User,
  tenantId: AdspId,
  namespace: string,
  name: string,
  created: string,
  revision: number
): DomainEvent => ({
  name: REVISION_CREATED,
  timestamp: new Date(),
  tenantId,
  correlationId: `${namespace}:${name}`,
  context: {
    namespace,
    name,
  },
  payload: {
    namespace,
    name,
    created,
    revision,
    createdBy: {
      name: createdBy.name,
      id: createdBy.id,
    },
  },
});

export const ConfigurationUpdatesStream: Stream = {
  id: 'configuration-updates',
  name: 'Configuration updates',
  description: 'Provides configuration update events for cache invalidation.',
  subscriberRoles: [`urn:ads:platform:configuration-service:${ConfigurationServiceRoles.ConfiguredService}`],
  publicSubscribe: false,
  events: [
    {
      namespace: 'configuration-service',
      name: CONFIGURATION_UPDATED,
    },
    {
      namespace: 'configuration-service',
      name: REVISION_CREATED,
    },
  ],
};
