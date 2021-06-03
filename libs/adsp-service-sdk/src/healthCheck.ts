import axios from 'axios';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { ServiceDirectory } from './directory';
import { adspId } from './utils';

interface HealthCheckResult {
  directory?: boolean;
  tenant?: boolean;
  access?: boolean;
  configuration?: boolean;
  event?: boolean;
}

export interface PlatformHealthCheck {
  (): Promise<HealthCheckResult>;
}

export const checkServiceHealth = async (logger: Logger, healthUrl: URL): Promise<boolean> => {
  try {
    const { status } = await axios.get(healthUrl.href, { timeout: 100 });
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
  directory: ServiceDirectory,
  exclude: Record<string, boolean>
): PlatformHealthCheck => {
  // This cache is a dead-band on health check requests.
  const resultCache = new NodeCache({ stdTTL: 120 });

  return async () => {
    let results = resultCache.get<HealthCheckResult>('health');

    if (!results) {
      const accessHealthUrl = new URL('/auth/realms/core/.well-known/openid-configuration', accessServiceUrl);
      const accessHealth = exclude.access || (await checkServiceHealth(logger, accessHealthUrl));

      const directoryHealthUrl = new URL('/health', directoryUrl);
      const directoryHealth = exclude.directory || (await checkServiceHealth(logger, directoryHealthUrl));

      const tenantUrl = await directory.getServiceUrl(adspId`urn:ads:platform:tenant-service`);
      const tenantHealthUrl = new URL('/health', tenantUrl);
      const tenantHealth = exclude.tenant || (await checkServiceHealth(logger, tenantHealthUrl));

      const configurationUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
      const configurationHealthUrl = new URL('/health', configurationUrl);
      const configurationHealth = exclude.configuration || (await checkServiceHealth(logger, configurationHealthUrl));

      const eventUrl = await directory.getServiceUrl(adspId`urn:ads:platform:event-service`);
      const eventHealthUrl = new URL('/health', eventUrl);
      const eventHealth = exclude.event || (await checkServiceHealth(logger, eventHealthUrl));

      results = {
        access: accessHealth,
        directory: directoryHealth,
        tenant: tenantHealth,
        configuration: configurationHealth,
        event: eventHealth,
      };

      Object.getOwnPropertyNames(exclude).forEach((excludeKey) => {
        if (exclude[excludeKey]) {
          delete results[excludeKey];
        }
      });

      resultCache.set('health', results);
    }

    return results;
  };
};
