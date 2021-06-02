import axios from 'axios';
import { Logger } from 'winston';
import { ServiceDirectory } from './directory';
import { adspId } from './utils';

export interface PlatformHealthCheck {
  (): Promise<{
    directory: boolean;
    tenant: boolean;
    access: boolean;
    configuration: boolean;
    event: boolean;
  }>;
}

export const checkServiceHealth = async (logger: Logger, healthUrl: URL): Promise<boolean> => {
  try {
    const { status } = await axios.get(healthUrl.href);
    return status >= 200 && status < 300;
  } catch (err) {
    logger.debug(`Encountered error in health check. ${err}`, { context: 'checkHealth' });
    return false;
  }
};

export const createHealthCheck = (
  logger: Logger,
  accessServiceUrl: URL,
  directoryUrl: URL,
  directory: ServiceDirectory
): PlatformHealthCheck => async () => {
  const accessHealthUrl = new URL('/auth/realms/core/.well-known/openid-configuration', accessServiceUrl);
  const accessHealth = await checkServiceHealth(logger, accessHealthUrl);

  const directoryHealthUrl = new URL('/health', directoryUrl);
  const directoryHealth = await checkServiceHealth(logger, directoryHealthUrl);

  const tenantUrl = await directory.getServiceUrl(adspId`urn:ads:platform:tenant-service`);
  const tenantHealthUrl = new URL('/health', tenantUrl);
  const tenantHealth = await checkServiceHealth(logger, tenantHealthUrl);

  const configurationUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
  const configurationHealthUrl = new URL('/health', configurationUrl);
  const configurationHealth = await checkServiceHealth(logger, configurationHealthUrl);

  const eventUrl = await directory.getServiceUrl(adspId`urn:ads:platform:event-service`);
  const eventHealthUrl = new URL('/health', eventUrl);
  const eventHealth = await checkServiceHealth(logger, eventHealthUrl);

  return {
    access: accessHealth,
    directory: directoryHealth,
    tenant: tenantHealth,
    configuration: configurationHealth,
    event: eventHealth,
  };
};
