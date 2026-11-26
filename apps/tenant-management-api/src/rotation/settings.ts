import type { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import type { TenantRotationConfiguration } from '@core-services/client-secret-rotation';
import { ConfigurationClient } from '@core-services/core-common';
import type { RealmSettingsStore } from './router';

/**
 * Stores each realm's rotation settings in the tenant-scoped configuration of the rotation service, where the
 * rotation job reads them. Writing needs the configuration-admin role on the service account.
 */
export function createRealmSettingsStore(
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  serviceId: AdspId,
): RealmSettingsStore {
  const client = new ConfigurationClient<TenantRotationConfiguration>(
    directory,
    tokenProvider,
    serviceId.namespace,
    serviceId.service,
  );
  return {
    get: (tenantId) => client.getTenantConfiguration(tenantId),
    update: async (tenantId, values) => {
      await client.updateEntries(tenantId, values);
    },
  };
}
