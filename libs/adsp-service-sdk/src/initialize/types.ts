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
  /**
   * Realm: Tenant realm of the service.
   *
   * The realm determines OIDC provider the service will use to verify and request access tokens.
   *
   * @type {string}
   * @memberof PlatformOptions
   */
  realm: string;
  /**
   * Client secret: Client secret of the service.
   *
   * This credential is used to retrieve access tokens for the service account of this service.
   *
   * @type {string}
   * @memberof PlatformOptions
   */
  clientSecret: string;
  /**
   * Directory URL: URL to the Directory of Services.
   *
   * The directory is used to look up other service and API URLs.
   *
   * @type {URL}
   * @memberof PlatformOptions
   */
  directoryUrl: URL;
  /**
   * Access service URL: URL to the Access Service.
   *
   * @type {URL}
   * @memberof PlatformOptions
   */
  accessServiceUrl: URL;
  /**
   * Ignore service audience: Skip verification of Service ID in token audience.
   *
   * This is generally not necessary. In most cases, use an audience mapper to include the required
   * audience in the access token.
   *
   * @type {boolean}
   * @memberof PlatformOptions
   */
  ignoreServiceAud?: boolean;
  /**
   * Configuration converter: Converter function for configuration; converted value is cached.
   *
   * @type {ConfigurationConverter}
   * @memberof PlatformOptions
   */
  configurationConverter?: ConfigurationConverter;
  /**
   * Combine configuration: Combine function for merging tenant and core configuration.
   *
   * Configuration can be stored in both a tenant specific context and a core (cross-tenant) context.
   * Provide a function to merge configuration retrieved in the two contexts. For example, tenant
   * configuration could override parts of the core configuration for the effective configuration.
   *
   * @type {CombineConfiguration}
   * @memberof PlatformOptions
   */
  combineConfiguration?: CombineConfiguration;
}

export interface PlatformServices {
  /**
   * Directory: Directory of services.
   *
   * @type {ServiceDirectory}
   * @memberof PlatformServices
   */
  directory: ServiceDirectory;
  /**
   * Tenant service: Service for accessing tenant information.
   *
   * @type {TenantService}
   * @memberof PlatformServices
   */
  tenantService: TenantService;
  /**
   * Configuration service: Service for accessing configuration.
   *
   * @type {ConfigurationService}
   * @memberof PlatformServices
   */
  configurationService: ConfigurationService;
  /**
   * Event service: Service for emitting domain events.
   *
   * @type {EventService}
   * @memberof PlatformServices
   */
  eventService: EventService;
}

export interface PlatformCapabilities extends PlatformServices {
  /**
   * Token provider: Provides service account access token.
   *
   * @type {TokenProvider}
   * @memberof PlatformCapabilities
   */
  tokenProvider: TokenProvider;
  /**
   * Core strategy: PassportJS strategy for core access tokens.
   *
   * Use this strategy to validate access tokens issued by the core realm (cross tenant).
   *
   * @type {Strategy}
   * @memberof PlatformCapabilities
   */
  coreStrategy: Strategy;
  /**
   * Tenant strategy: PassportJS strategy for tenant access tokens.
   *
   * Use this strategy to validate access tokens issued by tenant realms.
   *
   * @type {Strategy}
   * @memberof PlatformCapabilities
   */
  tenantStrategy: Strategy;
  /**
   * Tenant handler: Express middleware that sets req.tenant.
   *
   * @type {RequestHandler}
   * @memberof PlatformCapabilities
   */
  tenantHandler: RequestHandler;
  /**
   * Configuration handler: Express middleware that sets req.configuration.
   *
   * @type {RequestHandler}
   * @memberof PlatformCapabilities
   */
  configurationHandler: RequestHandler;
  /**
   * Health check: Function to retrieve platform health.
   *
   * @type {PlatformHealthCheck}
   * @memberof PlatformCapabilities
   */
  healthCheck: PlatformHealthCheck;
  /**
   * Clear cached: Function to clear the cached configuration.
   *
   * Configuration is cached with a TTL to mitigate stale cache issues. If the service
   * has a mechanism to detect configuration updates, such as a websocket connection,
   * use this function to invalidate the cache.
   *
   * @memberof PlatformCapabilities
   */
  clearCached: (tenantId: AdspId, serviceId: AdspId) => void;
  /**
   * Metrics handler: Request handler that write micro-benches of request times to
   * value service.
   *
   * Note that metrics are only written if req.tenant is set by the tenantHandler before
   * response headers are written.
   *
   * @type {RequestHandler}
   * @memberof PlatformCapabilities
   */
  metricsHandler: RequestHandler;
  /**
   * Logger used by SDK components.
   *
   * @type {Logger}
   * @memberof PlatformCapabilities
   */
  logger: Logger;
}
