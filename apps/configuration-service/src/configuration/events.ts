import { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';

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

export const ActiveRevisionSetDefinition: DomainEventDefinition = {
  name: 'active-revision-set',
  description: 'Signalled when the active revision of configuration is set.',
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
      from: {
        type: 'number',
      },
      setBy: {
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
  update: { operation: string; data: unknown }
): DomainEvent => ({
  name: 'configuration-updated',
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
  revision: number
): DomainEvent => ({
  name: 'revision-created',
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
    createdBy: {
      name: createdBy.name,
      id: createdBy.id,
    },
  },
});

export const activeRevisionSet = (
  createdBy: User,
  tenantId: AdspId,
  namespace: string,
  name: string,
  revision: number,
  from: number
): DomainEvent => ({
  name: 'active-revision-set',
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
    from,
    setBy: {
      name: createdBy.name,
      id: createdBy.id,
    },
  },
});
