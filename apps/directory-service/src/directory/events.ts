import type { DomainEvent, DomainEventDefinition, User, Stream, AdspId } from '@abgov/adsp-service-sdk';
import type { mapResource, mapTag } from './mapper';

const ENTRY_UPDATED = 'entry-updated';
const ENTRY_DELETED = 'entry-deleted';
export const TAGGED_RESOURCE = 'tagged-resource';
const UNTAGGED_RESOURCE = 'untagged-resource';
const RESOURCE_RESOLUTION_FAILED = 'resource-resolution-failed';

type Tag = ReturnType<typeof mapTag>;
type Resource = ReturnType<typeof mapResource>;

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
          isNew: { type: 'boolean' },
        },
      },
      tag: {
        type: 'object',
        properties: {
          urn: { type: 'string' },
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
          urn: { type: 'string' },
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

export const ResourceResolutionFailedDefinition: DomainEventDefinition = {
  name: RESOURCE_RESOLUTION_FAILED,
  description: 'Signalled when a resource associated with a resource type could not be resolved.',
  payloadSchema: {
    type: 'object',
    properties: {
      resource: {
        type: 'object',
        properties: {
          urn: { type: 'string' },
        },
      },
      type: { type: ['string', 'null'] },
      error: { type: 'string' },
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

export const taggedResource = (
  tenantId: AdspId,
  resource: Resource,
  tag: Tag,
  updatedBy: User,
  isNewResource: boolean
): DomainEvent => ({
  name: TAGGED_RESOURCE,
  timestamp: new Date(),
  tenantId,
  correlationId: tag.value,
  context: {
    tag: tag.value,
    resources: resource.urn.toString(),
  },
  payload: {
    resource: {
      ...resource,
      isNew: isNewResource,
    },
    tag,
    updatedBy: {
      id: updatedBy.id,
      name: updatedBy.name,
    },
  },
});

export const untaggedResource = (tenantId: AdspId, resource: Resource, tag: Tag, updatedBy: User): DomainEvent => ({
  name: UNTAGGED_RESOURCE,
  timestamp: new Date(),
  tenantId,
  correlationId: tag.value,
  context: {
    tag: tag.value,
    resources: resource.urn.toString(),
  },
  payload: {
    resource,
    tag,
    updatedBy: {
      id: updatedBy.id,
      name: updatedBy.name,
    },
  },
});

export const resourceResolutionFailed = (tenantId: AdspId, urn: AdspId, type: string, error: string): DomainEvent => ({
  name: RESOURCE_RESOLUTION_FAILED,
  timestamp: new Date(),
  tenantId,
  correlationId: type,
  context: {
    resources: urn.toString(),
    type,
  },
  payload: {
    resource: {
      urn: urn.toString(),
    },
    type,
    error,
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
