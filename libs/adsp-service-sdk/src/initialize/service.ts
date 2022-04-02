import type { Logger } from 'winston';
import { initializePlatform } from './platform';
import { LogOptions, PlatformCapabilities, PlatformOptions } from './types';

type Options = Omit<PlatformOptions, 'ignoreServiceAud' | 'roles'>;
type Capabilities = Omit<PlatformCapabilities, 'tenantService' | 'tenantHandler'>;

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
    tenantStrategy,
    configurationHandler,
    healthCheck,
    clearCached,
  } = await initializePlatform({ ...options }, logOptions);

  return {
    directory,
    configurationService,
    eventService,
    tokenProvider,
    coreStrategy,
    tenantStrategy,
    configurationHandler,
    healthCheck,
    clearCached,
  };
}
