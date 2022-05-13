import type { Logger } from 'winston';
import { createTenantConfigurationHandler } from '../configuration/configurationHandler';
import { AdspId } from '../utils';
import { initializePlatform } from './platform';
import { LogOptions, PlatformCapabilities, PlatformOptions } from './types';

type Options = Omit<PlatformOptions, 'ignoreServiceAud' | 'roles'>;
type Capabilities = Omit<PlatformCapabilities, 'tenantService' | 'tenantHandler' | 'clearCached'> & {
  clearCached: (serviceId: AdspId) => void;
};

/**
 * initializeService
 * Initializes ADSP SDK capabilities for a tenant specific service.
 * @export
 * @param {Options} options
 * @param {(Logger | LogOptions)} logOptions
 * @returns {Promise<Capabilities>}
 */
export async function initializeService(options: Options, logOptions: Logger | LogOptions): Promise<Capabilities> {
  const {
    directory,
    configurationService,
    eventService,
    tokenProvider,
    coreStrategy,
    tenantService,
    tenantStrategy,
    healthCheck,
    clearCached,
  } = await initializePlatform({ ...options }, logOptions);

  // In the case of a tenant service, it will only have access to one tenant (its own).
  const [tenant] = await tenantService.getTenants();
  const configurationHandler = createTenantConfigurationHandler(
    tokenProvider,
    configurationService,
    options.serviceId,
    tenant?.id
  );

  return {
    directory,
    configurationService,
    eventService,
    tokenProvider,
    configurationHandler,
    coreStrategy,
    tenantStrategy,
    healthCheck,
    clearCached: (serviceId) => clearCached(tenant?.id, serviceId),
  };
}
