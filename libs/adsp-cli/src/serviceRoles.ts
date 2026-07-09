import { getConfiguration } from './configuration';
import { getServiceUrls } from './directory';

export interface ServiceRoleEntry {
  serviceId: string;
  serviceName: string;
  role: string;
  description: string;
  inTenantAdmin?: boolean;
}

const CONFIGURATION_SERVICE_URN = 'urn:ads:platform:configuration-service:v2';

export class ServiceNotInDirectoryError extends Error {
  constructor(urn: string) {
    super(
      `${urn} was not found in the directory for the configured environment. Check ADSP_ENV/ADSP_DIRECTORY_SERVICE_URL.`
    );
  }
}

interface TenantServiceRole {
  role: string;
  description: string;
  inTenantAdmin?: boolean;
}

interface TenantServiceConfiguration {
  [serviceClientUrn: string]: {
    roles?: TenantServiceRole[];
  };
}

function deriveServiceName(urn: string): string {
  const parts = urn.split(':');
  return parts[parts.length - 1];
}

/**
 * Reads every platform service's registered roles from tenant-service's own configuration
 * (the same document ServiceRegistration.roles PATCHes into at service startup — see
 * libs/adsp-service-sdk/src/registration/registration.ts), and flattens it into one list.
 */
export async function getServiceRoles(accessToken: string, directoryServiceUrl: string): Promise<ServiceRoleEntry[]> {
  const serviceUrls = await getServiceUrls(directoryServiceUrl);
  const configurationServiceUrl = serviceUrls[CONFIGURATION_SERVICE_URN];
  if (!configurationServiceUrl) {
    throw new ServiceNotInDirectoryError(CONFIGURATION_SERVICE_URN);
  }

  const configuration = await getConfiguration<TenantServiceConfiguration>(
    accessToken,
    configurationServiceUrl,
    'platform',
    'tenant-service'
  );

  return Object.entries(configuration ?? {}).flatMap(([serviceId, value]) =>
    (value?.roles ?? []).map((role) => ({
      serviceId,
      serviceName: deriveServiceName(serviceId),
      role: role.role,
      description: role.description,
      inTenantAdmin: role.inTenantAdmin,
    }))
  );
}
