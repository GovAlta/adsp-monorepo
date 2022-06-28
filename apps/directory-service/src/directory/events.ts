import type { DomainEvent, DomainEventDefinition, User, Stream } from '@abgov/adsp-service-sdk';
import { ServiceRoles } from './roles';

const EVENTS = {
  updated: 'entry-updated',
  deleted: 'entry-deleted',
};

export const EntryUpdatedDefinition: DomainEventDefinition = {
  name: EVENTS.updated,
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
  name: EVENTS.deleted,
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
  name: EVENTS.updated,
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
  name: EVENTS.deleted,
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

export const EntryUpdatesStream: Stream = {
  id: 'directory-entry-updates',
  name: 'Directory updates',
  description: 'Provides update events for directory service.',
  subscriberRoles: [`urn:ads:platform:tenant-service:${ServiceRoles.StreamSubscription}`],
  publicSubscribe: false,
  events: [
    {
      namespace: 'directory-service',
      name: EVENTS.updated,
    },
    {
      namespace: 'directory-service',
      name: EVENTS.deleted,
    },
  ],
};
