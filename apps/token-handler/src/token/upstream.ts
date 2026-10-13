import { AdspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Logger } from 'winston';

import { isAllowedUpstream } from './upstream-domains';

// Rejections are logged once for a period for each upstream and host, so that repeated requests do not flood the log.
const LOG_INTERVAL = 10 * 60 * 1000;
const MAX_LOGGED = 1000;

// Only platform administrators can register entries in the platform namespace, and these can be cluster internal URLs.
const PLATFORM_NAMESPACE = 'platform';

/**
 * Wraps the service directory so that the URLs that it resolves must be for allowed domains.
 *
 * Upstream URLs come from the directory, where tenant administrators can register entries for their own namespace,
 * so the allowed domains are set by the operator of the service and not by tenants. Entries in the platform
 * namespace are trusted and not checked, since only platform administrators can register them. If no domains are
 * provided, the directory is returned as is.
 */
export function createRestrictedDirectory(
  directory: ServiceDirectory,
  allowedDomains: string[],
  logger: Logger
): ServiceDirectory {
  if (allowedDomains.length < 1) {
    return directory;
  }

  const logged = new Map<string, number>();

  const verify = (id: AdspId, url: URL) => {
    if (id.namespace !== PLATFORM_NAMESPACE && !isAllowedUpstream(url, allowedDomains)) {
      const key = `${id}|${url.host}`;
      const now = Date.now();
      if (now - (logged.get(key) ?? 0) > LOG_INTERVAL) {
        if (logged.size >= MAX_LOGGED) {
          logged.clear();
        }
        logged.set(key, now);
        logger.warn(`Upstream ${id} resolved to host '${url.host}', which is not an allowed upstream domain.`, {
          context: 'RestrictedServiceDirectory',
        });
      }

      throw new InvalidOperationError(`Upstream ${id} is not permitted.`);
    }

    return url;
  };

  return {
    getServiceUrl: async (id: AdspId) => verify(id, await directory.getServiceUrl(id)),
    getResourceUrl: async (id: AdspId) => verify(id, await directory.getResourceUrl(id)),
  };
}
