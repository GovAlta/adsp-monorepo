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

export const TenantArchivedDefinition: DomainEventDefinition = {
  name: 'tenant-archived',
  description: 'Signalled when a tenant is archived.',
  payloadSchema: {
    type: 'object',
    properties: {
      tenant: {
        type: 'object',
      },
      archivedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
    required: ['tenant', 'archivedBy'],
  },
};

export const TenantRestoredDefinition: DomainEventDefinition = {
  name: 'tenant-restored',
  description: 'Signalled when an archived tenant is restored.',
  payloadSchema: {
    type: 'object',
    properties: {
      tenant: {
        type: 'object',
      },
      restoredBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
    required: ['tenant', 'restoredBy'],
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

export function tenantArchived(user: User, tenant: Tenant): DomainEvent {
  return {
    name: 'tenant-archived',
    timestamp: new Date(),
    correlationId: `${tenant.id}`,
    tenantId: tenant.id,
    payload: {
      tenant,
      archivedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function tenantRestored(user: User, tenant: Tenant): DomainEvent {
  return {
    name: 'tenant-restored',
    timestamp: new Date(),
    correlationId: `${tenant.id}`,
    tenantId: tenant.id,
    payload: {
      tenant,
      restoredBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function tenantNameUpdated(user: User, tenant: Tenant): DomainEvent {
  return {
    name: 'tenant-name-updated',
    timestamp: new Date(),
    correlationId: `${tenant.id}`,
    tenantId: tenant.id,
    payload: {
      tenant,
      updatedBy: {
        id: user?.id,
        name: user?.name,
      },
    },
  };
}
