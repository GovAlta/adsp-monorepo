import { createContext, useContext, useMemo, type ReactNode } from 'react';

export type AdspCapability = 'file.upload' | 'file.download';

// Roles that grant each capability. Under a provider, a capability left out of the map is granted only to File service admins.
export type AdspCapabilityRoleMap = Partial<Record<AdspCapability, string[]>>;

// The File service administrator role, as a realm role or as a client role on the File service client.
export const FILE_SERVICE_ADMIN_ROLES: readonly string[] = Object.freeze([
  'file-service-admin',
  'urn:ads:platform:file-service:file-service-admin',
]);

// Without a provider every capability is allowed, and File service still authorizes each request.
const AdspCapabilityContext = createContext<(capability: AdspCapability) => boolean>(() => true);
AdspCapabilityContext.displayName = 'AdspCapabilityContext';

export interface AdspCapabilityProviderProps {
  /** The current user's roles, as the application read them from its token. */
  roles: string[];
  /** Roles that grant each capability, usually the File Type's `readRoles` (download) and `updateRoles` (upload). */
  capabilities?: AdspCapabilityRoleMap;
  children?: ReactNode;
}

export function resolveCapability(
  capability: AdspCapability,
  roles: string[],
  capabilities: AdspCapabilityRoleMap = {},
): boolean {
  const granting = capabilities[capability] ?? [];
  return roles.some((role) => granting.includes(role) || FILE_SERVICE_ADMIN_ROLES.includes(role));
}

export function AdspCapabilityProvider({ roles, capabilities, children }: AdspCapabilityProviderProps) {
  const resolve = useMemo(
    () => (capability: AdspCapability) => resolveCapability(capability, roles, capabilities),
    [roles, capabilities],
  );

  return <AdspCapabilityContext.Provider value={resolve}>{children}</AdspCapabilityContext.Provider>;
}

// An explicit override from a component prop always wins over the provider.
export function useCapability(capability: AdspCapability, override?: boolean): boolean {
  const resolve = useContext(AdspCapabilityContext);
  return override ?? resolve(capability);
}
