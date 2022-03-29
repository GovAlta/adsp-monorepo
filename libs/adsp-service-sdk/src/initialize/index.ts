import { Logger } from 'winston';
import { initializePlatform as baseInitialize } from './platform';
import { LogOptions, PlatformCapabilities, PlatformOptions, PlatformServices } from './types';

type Options = Omit<PlatformOptions, 'realm'>;

/**
 * initializePlatform
 * Initializes ADSP SDK capabilities for a multi-tenant platform service.
 * @export
 * @param {Options} options
 * @param {(Logger | LogOptions)} logOptions
 * @param {PlatformServices} services
 * @returns {Promise<PlatformCapabilities>}
 */
export async function initializePlatform(
  options: Options,
  logOptions: Logger | LogOptions,
  services?: Partial<PlatformServices>
): Promise<PlatformCapabilities> {
  return await baseInitialize({ ...options, realm: 'core' }, logOptions, services);
}

export { initializeService } from './service';
