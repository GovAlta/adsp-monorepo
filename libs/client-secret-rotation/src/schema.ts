/** Configuration schema of the rotation service, registered by both the rotation job and the rotation API. */
export const ClientSecretRotationConfigurationSchema = {
  type: 'object',
  properties: {
    realmMode: {
      type: 'string',
      enum: ['off', 'selected', 'all'],
      description: 'Tenant realm rotation mode: off (default), selected clients (rotation-enabled role) or all.',
    },
    expiryDays: { type: 'number', minimum: 1, description: 'Secret lifetime for this tenant realm, in days.' },
    noticeWindowDays: {
      type: 'number',
      minimum: 1,
      description: 'Days before expiry that contacts of this tenant realm are notified.',
    },
    rotatedSecretOverlapDays: {
      type: 'number',
      minimum: 1,
      description: 'Days the previous secret keeps working after rotation in this tenant realm.',
    },
    clientSecretRotation: {
      type: 'object',
      properties: {
        coreRealmMode: { type: 'string', enum: ['off', 'selected', 'all'] },
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

/** Tenant-scoped configuration written by realm admins through the rotation API. */
export interface TenantRotationConfiguration {
  realmMode?: string;
  expiryDays?: number;
  noticeWindowDays?: number;
  rotatedSecretOverlapDays?: number;
}
