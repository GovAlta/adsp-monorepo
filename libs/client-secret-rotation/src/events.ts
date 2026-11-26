import type { DomainEventDefinition } from '@abgov/adsp-service-sdk';

const base = {
  realm: { type: 'string' },
  clientId: { type: 'string' },
  portalUrl: { type: 'string' },
  keycloakUrl: { type: 'string' },
  runbookUrl: { type: 'string' },
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

export const ClientSecretRotationEnabledDefinition: DomainEventDefinition = {
  name: 'client-secret-rotation-enabled',
  description: 'Automatic secret rotation was turned on for a client.',
  payloadSchema: { type: 'object', properties: base },
};

export const ClientSecretRotationDisabledDefinition: DomainEventDefinition = {
  name: 'client-secret-rotation-disabled',
  description: 'Automatic secret rotation was turned off for a client.',
  payloadSchema: { type: 'object', properties: base },
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
  ClientSecretRotationEnabledDefinition,
  ClientSecretRotationDisabledDefinition,
  ClientSecretRotationFailedDefinition,
];
