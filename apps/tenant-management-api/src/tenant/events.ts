import type { DomainEvent, DomainEventDefinition, Tenant, User } from '@abgov/adsp-service-sdk';

export const TenantCreatedDefinition: DomainEventDefinition = {
  name: 'tenant-created',
  description: 'Signalled when a tenant is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      tenant: {
        type: 'object',
      },
      createdBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
    required: ['tenant', 'createdBy'],
  },
};

export const TenantDeletedDefinition: DomainEventDefinition = {
  name: 'tenant-deleted',
  description: 'Signalled when a tenant is deleted.',
  payloadSchema: {
    type: 'object',
    properties: {
      tenant: {
        type: 'object',
      },
      deletedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
    required: ['tenant', 'deletedBy'],
  },
};

export function tenantCreated(user: User, tenant: Tenant): DomainEvent {
  return {
    name: 'tenant-created',
    timestamp: new Date(),
    correlationId: `${tenant.id}`,
    tenantId: tenant.id,
    payload: {
      tenant,
      createdBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function tenantDeleted(user: User, tenant: Tenant): DomainEvent {
  return {
    name: 'tenant-deleted',
    timestamp: new Date(),
    correlationId: `${tenant.id}`,
    tenantId: tenant.id,
    payload: {
      tenant,
      deletedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}
