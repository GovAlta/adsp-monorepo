export const ClientSecretRotationRoles = {
  ClientSecretAdmin: 'client-secret-admin',
  // Tenant admins of realms that predate this service's client and role.
  TenantAdmin: 'urn:ads:platform:tenant-service:tenant-admin',
} as const;
