import { RequestHandler } from 'express';
import { Strategy } from 'passport';
import type { Logger } from 'winston';
import { createCoreStrategy, createTenantStrategy, createTokenProvider, TokenProvider } from './access';
import {
  ConfigurationConverter,
  ConfigurationService,
  createConfigurationHandler,
  createConfigurationService,
} from './configuration';
import { createDirectory, ServiceDirectory } from './directory';
import { createEventService, EventService } from './event';
import { createHealthCheck, PlatformHealthCheck } from './healthCheck';
import { createServiceRegistrar, ServiceRegistration } from './registration';
import { createTenantHandler, createTenantService, TenantService } from './tenant';
import { createLogger } from './utils';

interface AdspOptions extends ServiceRegistration {
  /** Client Secret: Client secret of the service. */
  clientSecret: string;
  /** Directory URL: URL to the Directory of Services. */
  directoryUrl: URL;
  /** Access Service URL: URL to the Access Service. */
  accessServiceUrl: URL;
  /** Ignore Service Aud: Skip verification of Service ID in token audience. */
  ignoreServiceAud?: boolean;
  /** Configuration Converter: Converter function for configuration; converted value is cached. */
  configurationConverter?: ConfigurationConverter;
}

interface PlatformServices {
  /** ServiceDirectory: Directory of services. */
  directory: ServiceDirectory;
  /** TenantService: Service for accessing tenant information. */
  tenantService: TenantService;
  /** ConfigurationService: Service for accessing tenant specific configuration. */
  configurationService: ConfigurationService;
  /** EventService: Service for emitting domain events. */
  eventService: EventService;
}

interface Platform extends PlatformServices {
  /** TokenProvider: Provides service account access token. */
  tokenProvider: TokenProvider;
  /** CoreStrategy: PassportJS strategy for core access tokens. */
  coreStrategy: Strategy;
  /** TenantStrategy: PassportJS strategy for tenant access tokens. */
  tenantStrategy: Strategy;
  /** TenantHandler: Express request handler that sets req.tenant. */
  tenantHandler: RequestHandler;
  /** ConfigurationHandler: Express request handler that sets req.configuration. */
  configurationHandler: RequestHandler;
  /** HealthCheck: Function to retrieve platform health. */
  healthCheck: PlatformHealthCheck;
}

interface LogOptions {
  logger?: Logger;
  logLevel?: string;
}

export async function initializePlatform(
  {
    serviceId,
    clientSecret,
    directoryUrl,
    accessServiceUrl,
    ignoreServiceAud,
    configurationConverter,
    ...registration
  }: AdspOptions,
  logOptions: Logger | LogOptions,
  service?: Partial<PlatformServices>
): Promise<Platform> {
  const logger =
    ('debug' in logOptions ? logOptions : logOptions?.logger) ||
    createLogger(serviceId.toString(), (logOptions as LogOptions)?.logLevel);

  const tokenProvider = createTokenProvider({ logger, serviceId, clientSecret, accessServiceUrl });
  const directory = service?.directory || createDirectory({ logger, directoryUrl, tokenProvider });

  // Initialization is not dependent on registration, so registration completes asynchronously.
  const registrar = createServiceRegistrar({ logger, directory, tokenProvider });
  registrar
    .register({ ...registration, serviceId })
    .catch((err) => logger.warn(`Error encountered during service registration. ${err}`));

  const coreStrategy = createCoreStrategy({ logger, serviceId, accessServiceUrl, ignoreServiceAud });

  const tenantService = service?.tenantService || createTenantService({ logger, directory, tokenProvider });
  const tenantHandler = createTenantHandler(tenantService);
  const tenantStrategy = createTenantStrategy({ logger, serviceId, accessServiceUrl, tenantService, ignoreServiceAud });

  const configurationService =
    service?.configurationService ||
    createConfigurationService({ logger, directory, converter: configurationConverter });
  const configurationHandler = createConfigurationHandler(tokenProvider, configurationService, serviceId);

  const eventService =
    service?.eventService ||
    createEventService({
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
  };
}

export { adspId, AdspId, AdspIdFormatError, GoAError } from './utils';
export { AssertCoreRole, AssertRole, UnauthorizedUserError } from './access';
export type { TokenProvider, User } from './access';
export type { GoAErrorExtra } from './utils';
export type { ServiceDirectory } from './directory';
export type { Tenant, TenantService } from './tenant';
export type { ConfigurationService } from './configuration';
export type { DomainEvent, DomainEventDefinition, EventService } from './event';
export type { ServiceRegistration, ServiceRole } from './registration';
