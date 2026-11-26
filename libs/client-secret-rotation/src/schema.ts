/** Configuration schema of the rotation service, registered by both the rotation job and the rotation API. */
export const ClientSecretRotationConfigurationSchema = {
  type: 'object',
  properties: {
    realmMode: {
      type: 'string',
      enum: ['off', 'selected'],
      description: 'Tenant realm rotation mode: off (default) or selected clients (rotation-enabled role).',
    },
    noticePeriod: {
      type: 'number',
      minimum: 1,
      description: 'Seconds before expiry that contacts of this tenant realm are notified.',
    },
    clientSecretRotation: {
      type: 'object',
      properties: {
        coreRealmMode: { type: 'string', enum: ['off', 'selected'] },
        enabled: { type: 'boolean' },
        dryRun: { type: 'boolean' },
        noticeWindowDays: { type: 'number', minimum: 1 },
        expiryDays: { type: 'number', minimum: 1 },
        rotatedSecretOverlapDays: { type: 'number', minimum: 1 },
        minNoticeGapDays: { type: 'number', minimum: 0 },
        coreNotificationTenantId: { type: 'string' },
        coreContacts: { type: 'array', items: { type: 'string' } },
      },
    },
  },
};

/**
 * Tenant-scoped configuration written by realm admins through the rotation API. Only the notice period is stored
 * here; the expiration periods live in the realm's Keycloak rotation profile.
 */
export interface TenantRotationConfiguration {
  realmMode?: string;
  /** Seconds before expiry that contacts are notified. */
  noticePeriod?: number;
}
