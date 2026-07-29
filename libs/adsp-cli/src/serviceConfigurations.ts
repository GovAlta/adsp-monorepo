import { getConfiguration } from './configuration';
import { getServiceUrls } from './directory';
import { ServiceNotInDirectoryError } from './serviceRoles';

const CONFIGURATION_SERVICE_URN = 'urn:ads:platform:configuration-service:v2';

export interface ServiceConfigurationSchema {
  /** Key as stored in the configuration-service document (e.g. "form-service" or "platform:form-service"). */
  key: string;
  configurationSchema: Record<string, unknown>;
  description?: string;
}

interface ConfigurationServiceConfiguration {
  [key: string]: {
    configurationSchema?: Record<string, unknown>;
    description?: string;
    anonymousRead?: boolean;
  };
}

/**
 * Reads every platform service's registered configuration schema from configuration-service's own
 * configuration document (the same document ServiceRegistration PATCHes into at service startup).
 * Optionally filters to the service whose name matches the last segment of the provided URN.
 */
export async function getServiceConfigurationSchemas(
  accessToken: string,
  directoryServiceUrl: string,
  serviceId?: string
): Promise<ServiceConfigurationSchema[]> {
  const serviceUrls = await getServiceUrls(directoryServiceUrl);
  const configurationServiceUrl = serviceUrls[CONFIGURATION_SERVICE_URN];
  if (!configurationServiceUrl) {
    throw new ServiceNotInDirectoryError(CONFIGURATION_SERVICE_URN);
  }

  const configuration = await getConfiguration<ConfigurationServiceConfiguration>(
    accessToken,
    configurationServiceUrl,
    'platform',
    'configuration-service'
  );

  const entries = Object.entries(configuration ?? {})
    .filter(([, value]) => value?.configurationSchema != null)
    .map(([key, value]) => ({
      key,
      configurationSchema: value.configurationSchema,
      description: value.description,
    }));

  if (!serviceId) {
    return entries;
  }

  const name = serviceId.split(':').pop();
  return entries.filter(({ key }) => key === name || key.endsWith(`:${name}`));
}
