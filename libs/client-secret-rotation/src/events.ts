import type { DomainEventDefinition } from '@abgov/adsp-service-sdk';

export const ClientSecretRotationEventNames = {
  due: 'client-secret-rotation-due',
  rotated: 'client-secret-rotated',
  revoked: 'client-secret-revoked',
  enabled: 'client-secret-rotation-enabled',
  disabled: 'client-secret-rotation-disabled',
  failed: 'client-secret-rotation-failed',
  digest: 'client-secret-rotation-digest',
  realmEnabled: 'client-secret-rotation-realm-enabled',
  realmDisabled: 'client-secret-rotation-realm-disabled',
  scheduleUpdated: 'client-secret-rotation-schedule-updated',
  contactsUpdated: 'client-secret-rotation-contacts-updated',
} as const;

// The signed-in user who made the change. Absent on events the scheduled job sends.
const updatedBy = {
  type: 'object',
  properties: { id: { type: 'string' }, name: { type: 'string' } },
};

const base = {
  realm: { type: 'string' },
  clientId: { type: 'string' },
  portalUrl: { type: 'string' },
  keycloakUrl: { type: 'string' },
  runbookUrl: { type: 'string' },
  updatedBy,
};

export const ClientSecretRotationDueDefinition: DomainEventDefinition = {
  name: ClientSecretRotationEventNames.due,
  description: 'A client secret will expire within the notice window. It is not rotated automatically.',
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
  name: ClientSecretRotationEventNames.rotated,
  description: 'A client secret was rotated. The previous secret works until overlapEndsAt.',
  payloadSchema: {
    type: 'object',
    properties: {
      ...base,
      newExpiry: { type: 'string' },
      overlapEndsAt: { type: 'string' },
    },
  },
};

export const ClientSecretRevokedDefinition: DomainEventDefinition = {
  name: ClientSecretRotationEventNames.revoked,
  description: 'The previous client secret stopped working at the end of the overlap period.',
  payloadSchema: {
    type: 'object',
    properties: { ...base, revokedAt: { type: 'string' } },
  },
};

export const ClientSecretRotationEnabledDefinition: DomainEventDefinition = {
  name: ClientSecretRotationEventNames.enabled,
  description: 'Secret expiry was turned on for a client.',
  payloadSchema: { type: 'object', properties: base },
};

export const ClientSecretRotationDisabledDefinition: DomainEventDefinition = {
  name: ClientSecretRotationEventNames.disabled,
  description: 'Secret expiry was turned off for a client.',
  payloadSchema: { type: 'object', properties: base },
};

export const ClientSecretRotationFailedDefinition: DomainEventDefinition = {
  name: ClientSecretRotationEventNames.failed,
  description: 'A step of client secret rotation failed. Never contains a secret.',
  payloadSchema: {
    type: 'object',
    properties: { ...base, reason: { type: 'string' } },
  },
};

export const ClientSecretRotationDigestDefinition: DomainEventDefinition = {
  name: ClientSecretRotationEventNames.digest,
  description:
    'Summary of client secrets in a realm that expire soon or whose previous secret stopped working. Sent to realm admins by the scheduled notifier.',
  payloadSchema: {
    type: 'object',
    properties: {
      realm: { type: 'string' },
      runbookUrl: { type: 'string' },
      due: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
            expiry: { type: 'string' },
            daysRemaining: { type: 'number' },
            keycloakUrl: { type: 'string' },
          },
        },
      },
      revoked: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
            revokedAt: { type: 'string' },
            keycloakUrl: { type: 'string' },
          },
        },
      },
    },
  },
};

export const ClientSecretRotationRealmEnabledDefinition: DomainEventDefinition = {
  name: ClientSecretRotationEventNames.realmEnabled,
  description: 'Client secret rotation was turned on for the realm.',
  payloadSchema: { type: 'object', properties: { realm: { type: 'string' }, updatedBy } },
};

export const ClientSecretRotationRealmDisabledDefinition: DomainEventDefinition = {
  name: ClientSecretRotationEventNames.realmDisabled,
  description: 'Client secret rotation was turned off for the realm.',
  payloadSchema: { type: 'object', properties: { realm: { type: 'string' }, updatedBy } },
};

export const ClientSecretRotationScheduleUpdatedDefinition: DomainEventDefinition = {
  name: ClientSecretRotationEventNames.scheduleUpdated,
  description:
    'The secret expiration, previous-secret expiration or notice period of the realm was changed. Periods are in seconds.',
  payloadSchema: {
    type: 'object',
    properties: {
      realm: { type: 'string' },
      expirationPeriod: { type: 'number' },
      rotatedExpirationPeriod: { type: 'number' },
      noticePeriod: { type: 'number' },
      updatedBy,
    },
  },
};

export const ClientSecretRotationContactsUpdatedDefinition: DomainEventDefinition = {
  name: ClientSecretRotationEventNames.contactsUpdated,
  description: 'The contacts of a client were changed. Only the number of contacts is recorded, never the addresses.',
  payloadSchema: {
    type: 'object',
    properties: {
      realm: { type: 'string' },
      clientId: { type: 'string' },
      contactCount: { type: 'number' },
      updatedBy,
    },
  },
};

export const ClientSecretRotationEvents = [
  ClientSecretRotationDigestDefinition,
  ClientSecretRotationDueDefinition,
  ClientSecretRotatedDefinition,
  ClientSecretRevokedDefinition,
  ClientSecretRotationEnabledDefinition,
  ClientSecretRotationDisabledDefinition,
  ClientSecretRotationFailedDefinition,
  ClientSecretRotationRealmEnabledDefinition,
  ClientSecretRotationRealmDisabledDefinition,
  ClientSecretRotationScheduleUpdatedDefinition,
  ClientSecretRotationContactsUpdatedDefinition,
];
