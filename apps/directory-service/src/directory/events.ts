import type { DomainEvent, DomainEventDefinition, User, Stream } from '@abgov/adsp-service-sdk';
import { Resource, Tag } from './types';

const ENTRY_UPDATED = 'entry-updated';
const ENTRY_DELETED = 'entry-deleted';
const TAGGED_RESOURCE = 'tagged-resource';
const UNTAGGED_RESOURCE = 'untagged-resource';

export const EntryUpdatedDefinition: DomainEventDefinition = {
  name: ENTRY_UPDATED,
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
  name: ENTRY_DELETED,
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

export const TaggedResourceDefinition: DomainEventDefinition = {
  name: TAGGED_RESOURCE,
  description: 'Signalled when a tag is added to a resource.',
  payloadSchema: {
    type: 'object',
    properties: {
      resource: {
        type: 'object',
        properties: {
          urn: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
      tag: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
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

export const UntaggedResourceDefinition: DomainEventDefinition = {
  name: UNTAGGED_RESOURCE,
  description: 'Signalled when a tag is removed from a resource.',
  payloadSchema: {
    type: 'object',
    properties: {
      resource: {
        type: 'object',
        properties: {
          urn: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
      tag: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
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

export const entryUpdated = (
  updatedBy: User,
  namespace: string,
  service: string,
  api: string,
  URL: string
): DomainEvent => ({
  name: ENTRY_UPDATED,
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
  name: ENTRY_DELETED,
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

export const taggedResource = (resource: Resource, tag: Tag, updatedBy: User): DomainEvent => ({
  name: TAGGED_RESOURCE,
  timestamp: new Date(),
  tenantId: resource.tenantId,
  payload: {
    resource: {
      urn: resource.urn,
      name: resource.name,
      description: resource.description,
    },
    tag: {
      label: tag.label,
      value: tag.value,
    },
    updatedBy: {
      id: updatedBy.id,
      name: updatedBy.name,
    },
  },
});

export const untaggedResource = (resource: Resource, tag: Tag, updatedBy: User): DomainEvent => ({
  name: UNTAGGED_RESOURCE,
  timestamp: new Date(),
  tenantId: resource.tenantId,
  payload: {
    resource: {
      urn: resource.urn,
      name: resource.name,
      description: resource.description,
    },
    tag: {
      label: tag.label,
      value: tag.value,
    },
    updatedBy: {
      id: updatedBy.id,
      name: updatedBy.name,
    },
  },
});

export const EntryUpdatesStream: Stream = {
  id: 'directory-entry-updates',
  name: 'Directory updates',
  description: 'Provides update events for directory service.',
  subscriberRoles: ['urn:ads:platform:tenant-service:platform-service'],
  publicSubscribe: false,
  events: [
    {
      namespace: 'directory-service',
      name: ENTRY_UPDATED,
    },
    {
      namespace: 'directory-service',
      name: ENTRY_DELETED,
    },
  ],
};
