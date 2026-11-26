import type { DomainEventDefinition } from '@abgov/adsp-service-sdk';

const base = {
  realm: { type: 'string' },
  clientId: { type: 'string' },
};

export const ClientSecretRotationDueDefinition: DomainEventDefinition = {
  name: 'client-secret-rotation-due',
  description: 'A client secret will expire and be rotated within the notice window.',
  payloadSchema: {
    type: 'object',
    properties: {
      ...base,
      expiry: { type: 'string' },
      daysRemaining: { type: 'number' },
      portalUrl: { type: 'string' },
    },
  },
};

export const ClientSecretRotatedDefinition: DomainEventDefinition = {
  name: 'client-secret-rotated',
  description: 'A client secret was rotated. The previous secret works until overlapEndsAt.',
  payloadSchema: {
    type: 'object',
    properties: {
      ...base,
      newExpiry: { type: 'string' },
      overlapEndsAt: { type: 'string' },
      emergency: { type: 'boolean' },
      portalUrl: { type: 'string' },
    },
  },
};

export const ClientSecretRevokedDefinition: DomainEventDefinition = {
  name: 'client-secret-revoked',
  description: 'The previous client secret stopped working at the end of the overlap period.',
  payloadSchema: {
    type: 'object',
    properties: { ...base, revokedAt: { type: 'string' } },
  },
};

export const ClientSecretRotationFailedDefinition: DomainEventDefinition = {
  name: 'client-secret-rotation-failed',
  description: 'A step of client secret rotation failed. Never contains a secret.',
  payloadSchema: {
    type: 'object',
    properties: { ...base, reason: { type: 'string' } },
  },
};

export const ClientSecretRotationEvents = [
  ClientSecretRotationDueDefinition,
  ClientSecretRotatedDefinition,
  ClientSecretRevokedDefinition,
  ClientSecretRotationFailedDefinition,
];
