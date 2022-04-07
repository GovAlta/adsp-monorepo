import { RequestHandler } from 'express';
import { Strategy } from 'passport';
import type { Logger } from 'winston';
import { TokenProvider } from '../access';
import { CombineConfiguration, ConfigurationConverter, ConfigurationService } from '../configuration';
import { ServiceDirectory } from '../directory';
import { EventService } from '../event';
import { PlatformHealthCheck } from '../healthCheck';
import { ServiceRegistration } from '../registration';
import { TenantService } from '../tenant';
import { AdspId } from '../utils';

export interface LogOptions {
  logger?: Logger;
  logLevel?: string;
}

export interface PlatformOptions extends ServiceRegistration {
  /** Realm: Tenant realm of the service. */
  realm: string;
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
  /** Combine Configuration: Combine function for merging tenant and core configuration. */
  combineConfiguration?: CombineConfiguration;
}

export interface PlatformServices {
  /** ServiceDirectory: Directory of services. */
  directory: ServiceDirectory;
  /** TenantService: Service for accessing tenant information. */
  tenantService: TenantService;
  /** ConfigurationService: Service for accessing tenant specific configuration. */
  configurationService: ConfigurationService;
  /** EventService: Service for emitting domain events. */
  eventService: EventService;
}

export interface PlatformCapabilities extends PlatformServices {
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
  /** Clear Cached Configuration: Function to clear the cached configuration. */
  clearCached: (tenantId: AdspId, serviceId: AdspId) => void;
}
