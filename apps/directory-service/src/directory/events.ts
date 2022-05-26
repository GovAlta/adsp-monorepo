import type { DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';

export const EntryUpdatedDefinition: DomainEventDefinition = {
  name: 'entry-updated',
  description: 'Signalled when a directory entry is updated.',
  payloadSchema: {
    type: 'object',
    properties: {
      namespace: {
        type: 'string',
      },
      service: {
        type: 'string',
      },
      api: {
        type: 'string',
      },
      URL: {
        type: 'string',
      },
      updatedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
    required: ['namespace', 'service', 'updatedBy'],
  },
};

export const EntryDeletedDefinition: DomainEventDefinition = {
  name: 'entry-deleted',
  description: 'Signalled when a directory entry is deleted.',
  payloadSchema: {
    type: 'object',
    properties: {
      namespace: {
        type: 'string',
      },
      service: {
        type: 'string',
      },
      api: {
        type: 'string',
      },
      URL: {
        type: 'string',
      },
      deletedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
    required: ['namespace', 'service', 'deletedBy'],
  },
};

export const entryUpdated = (
  updatedBy: User,
  namespace: string,
  service: string,
  api: string,
  URL: string
): DomainEvent => ({
  name: 'entry-updated',
  timestamp: new Date(),
  tenantId: updatedBy.tenantId,
  correlationId: `${namespace}:${service}`,
  context: {
    namespace,
  },
  payload: {
    namespace,
    service,
    api,
    URL,
    updatedBy: {
      name: updatedBy.name,
      id: updatedBy.id,
    },
  },
});

export const entryDeleted = (
  deletedBy: User,
  namespace: string,
  service: string,
  api: string,
  URL: string
): DomainEvent => ({
  name: 'entry-deleted',
  timestamp: new Date(),
  tenantId: deletedBy.tenantId,
  correlationId: `${namespace}:${service}`,
  context: {
    namespace,
  },
  payload: {
    namespace,
    service,
    api,
    URL,
    deletedBy: {
      name: deletedBy.name,
      id: deletedBy.id,
    },
  },
});
