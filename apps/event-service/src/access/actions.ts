import { adspId, AuditCategories, AuditSeverities, BuiltInRetentionClasses } from '@abgov/adsp-service-sdk';
import type { AuditAction, AuditSeverity } from '@abgov/adsp-service-sdk';

export const ACCESS_SERVICE_ID = adspId`urn:ads:platform:access-service`;

export const AccessResourceTypes = {
  User: 'user',
  ServiceAccount: 'service-account',
  Realm: 'realm',
} as const;

const securityAction = (
  name: string,
  severity: AuditSeverity,
  description: string,
  resourceType?: string,
): AuditAction => ({
  name,
  version: 1,
  category: AuditCategories.Security,
  severity,
  retentionClass: BuiltInRetentionClasses.Security,
  ...(resourceType && { resourceType }),
  description,
});

export const UserCreatedAuditAction = securityAction(
  'access.user.created',
  AuditSeverities.Info,
  'A user is created in the tenant realm.',
  AccessResourceTypes.User,
);

export const UserUpdatedAuditAction = securityAction(
  'access.user.updated',
  AuditSeverities.Info,
  'A user is updated in the tenant realm.',
  AccessResourceTypes.User,
);

export const UserDeletedAuditAction = securityAction(
  'access.user.deleted',
  AuditSeverities.Critical,
  'A user is deleted from the tenant realm.',
  AccessResourceTypes.User,
);

export const UserRoleAssignedAuditAction = securityAction(
  'access.user.role-assigned',
  AuditSeverities.Warning,
  'Client roles are assigned to a user.',
  AccessResourceTypes.User,
);

export const UserRoleRemovedAuditAction = securityAction(
  'access.user.role-removed',
  AuditSeverities.Warning,
  'Client roles are removed from a user.',
  AccessResourceTypes.User,
);

export const ServiceAccountCreatedAuditAction = securityAction(
  'access.service-account.created',
  AuditSeverities.Warning,
  'A client is created in the tenant realm.',
  AccessResourceTypes.ServiceAccount,
);

export const ServiceAccountCredentialRotatedAuditAction = securityAction(
  'access.service-account.credential-rotated',
  AuditSeverities.Critical,
  'The secret of a client is regenerated.',
  AccessResourceTypes.ServiceAccount,
);

export const ServiceAccountDeletedAuditAction = securityAction(
  'access.service-account.deleted',
  AuditSeverities.Critical,
  'A client is deleted from the tenant realm.',
  AccessResourceTypes.ServiceAccount,
);

export const RealmConfigurationChangedAuditAction = securityAction(
  'access.realm.configuration-changed',
  AuditSeverities.Critical,
  'The configuration of the tenant realm is changed.',
  AccessResourceTypes.Realm,
);

export const UserLoginFailedAuditAction = securityAction(
  'access.user.login-failed',
  AuditSeverities.Warning,
  'A sign in attempt to the tenant realm fails.',
);

export const AccessAuditActions: AuditAction[] = [
  UserCreatedAuditAction,
  UserUpdatedAuditAction,
  UserDeletedAuditAction,
  UserRoleAssignedAuditAction,
  UserRoleRemovedAuditAction,
  ServiceAccountCreatedAuditAction,
  ServiceAccountCredentialRotatedAuditAction,
  ServiceAccountDeletedAuditAction,
  RealmConfigurationChangedAuditAction,
  UserLoginFailedAuditAction,
];
