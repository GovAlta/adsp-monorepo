export const ROTATION_ROLE = 'rotation-enabled';

// The realm's client policy and profile. Matches the policy the rotation trials created by hand on Dev, so existing
// realms are adopted rather than given a second policy.
export const ROTATION_PROFILE = 'secret-rotation-profile';
export const ROTATION_POLICY = 'secret-rotation';

// Keycloak client policy executor and condition provider IDs.
export const ROTATION_EXECUTOR = 'secret-rotation';
export const CONDITION_ACCESS_TYPE = 'client-access-type';
export const CONDITION_CLIENT_ROLES = 'client-roles';

export const TENANT_SERVICE_CLIENT_ID = 'urn:ads:platform:tenant-service';
export const TENANT_ADMIN_ROLE = 'tenant-admin';

// Namespace of the rotation domain events, which is the service name of the tenant service ID that hosts the API.
export const ROTATION_NAMESPACE = 'tenant-service';
export const CLIENT_SECRET_ADMIN_ROLE = 'client-secret-admin';
// The notification type ID is the type's name, which is how the SDK registers it.
export const NOTIFICATION_TYPE_ID = 'client-secret-rotation';

export const ATTRIBUTES = {
  expiry: 'client.secret.expiration.time',
  rotatedExpiry: 'client.secret.rotated.expiration.time',
  contact: 'rotation-contact',
  noticeSentFor: 'rotation-notice-sent-for',
  noticeSentAt: 'rotation-notice-sent-at',
  lastRotated: 'rotation-last-rotated',
  revokedNoticeSentFor: 'rotation-revoked-notice-sent-for',
} as const;
