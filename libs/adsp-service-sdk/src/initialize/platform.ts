import type { Logger } from 'winston';
import { createRealmStrategy, createTenantStrategy, createTokenProvider } from '../access';
import { createConfigurationHandler, createConfigurationService } from '../configuration';
import { createDirectory } from '../directory';
import { createEventService } from '../event';
import { createHealthCheck } from '../healthCheck';
import { createMetricsHandler } from '../metrics';
import { createServiceRegistrar } from '../registration';
import { createTenantHandler, createTenantService } from '../tenant';
import { createTraceHandler } from '../trace';
import { LogOptions, PlatformCapabilities, PlatformOptions, PlatformServices } from './types';
import { AdspId, assertAdspId, createLogger } from '../utils';

export async function initializePlatform(
  {
    realm,
    serviceId,
    clientSecret,
    directoryUrl,
    accessServiceUrl,
    ignoreServiceAud,
    configurationConverter,
    combineConfiguration,
    enableConfigurationInvalidation,
    useLongConfigurationCacheTTL,
    additionalExtractors,
    ...registration
  }: PlatformOptions,
  logOptions: Logger | LogOptions,
  service?: Partial<PlatformServices>
): Promise<PlatformCapabilities> {
  assertAdspId(serviceId, null, 'service');

  const logger =
    ('debug' in logOptions ? logOptions : logOptions?.logger) ||
    createLogger(serviceId.toString(), (logOptions as LogOptions)?.logLevel);

  const tokenProvider = createTokenProvider({ logger, serviceId, clientSecret, accessServiceUrl, realm });
  const directory = service?.directory || createDirectory({ logger, directoryUrl });

  // Initialization is not dependent on registration, so registration completes asynchronously.
  const registrar = createServiceRegistrar({ logger, directory, tokenProvider });
  registrar
    .register({ ...registration, serviceId })
    .catch((err) => logger.warn(`Error encountered during service registration. ${err}`));

  const tenantService = service?.tenantService || createTenantService({ logger, directory, tokenProvider });
  const tenantHandler = createTenantHandler(tenantService);

  const coreStrategy = await createRealmStrategy({
    realm: 'core',
    logger,
    serviceId,
    accessServiceUrl,
    tenantService,
    ignoreServiceAud,
    additionalExtractors,
  });

  const tenantStrategy =
    realm === 'core'
      ? createTenantStrategy({
          logger,
          serviceId,
          accessServiceUrl,
          tenantService,
          ignoreServiceAud,
          additionalExtractors,
        })
      : await createRealmStrategy({
          realm,
          logger,
          serviceId,
          accessServiceUrl,
          tenantService,
          ignoreServiceAud,
          additionalExtractors,
        });

  let configurationService = service?.configurationService;
  let clearCached = function (_tenantId: AdspId, _serviceId: AdspId) {
    // no-op implementation for when configuration is externally provided.
  };
  if (!configurationService) {
    const configServiceImpl = createConfigurationService({
      serviceId,
      logger,
      directory,
      tokenProvider,
      useNamespace: registration.configuration?.useNamespace || false,
      useActive: registration.configuration?.useActive || false,
      converter: configurationConverter,
      combine: combineConfiguration,
      enableConfigurationInvalidation,
      useLongConfigurationCacheTTL,
    });
    configurationService = configServiceImpl;

    clearCached = function (tenantId: AdspId, serviceId: AdspId) {
      configServiceImpl.clearCached(tenantId, serviceId.namespace, serviceId.service);
    };
  }

  const configurationHandler = createConfigurationHandler(tokenProvider, configurationService, serviceId);

  const eventService =
    service?.eventService ||
    createEventService({
      isCore: realm === 'core',
      logger,
      serviceId,
      directory,
      tokenProvider,
      events: registration.events,
    });

  // Skip health checks on anything that's injected or anything not configured (assumed not used).
  const healthCheck = createHealthCheck(logger, accessServiceUrl, directoryUrl, directory, {
    directory: !!service?.directory,
    tenant: !!service?.tenantService,
    configuration: !!service?.configurationService || !registration.configurationSchema,
    event: !!service?.eventService || !registration.events || !registration.events.length,
  });

  const metricsHandler = await createMetricsHandler(serviceId, logger, tokenProvider, directory);

  // Note: Sample rate is not currently used in the SDK.
  const traceHandler = createTraceHandler({ logger, sampleRate: 0 });

  return {
    tokenProvider,
    coreStrategy,
    tenantService,
    tenantStrategy,
    tenantHandler,
    configurationService,
    configurationHandler,
    eventService,
    directory,
    healthCheck,
    clearCached,
    metricsHandler,
    traceHandler,
    logger,
  };
}
