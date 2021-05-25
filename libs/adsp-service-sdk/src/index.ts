import { RequestHandler } from 'express';
import { Strategy } from 'passport';
import type { Logger } from 'winston';
import { createTenantStrategy, createTokenProvider, TokenProvider } from './access';
import { ConfigurationService, createConfigurationHandler, createConfigurationService } from './configuration';
import { createDirectory, ServiceDirectory } from './directory';
import { createTenantHandler, createTenantService, TenantService } from './tenant';
import { AdspId, createLogger } from './utils';

interface AdspOptions {
  /** Service ID: ADSP ID of the platform service. */
  serviceId: AdspId;
  /** Client Secret: Client secret of the service. */
  clientSecret: string;
  /** Directory URL: URL to the Directory of Services. */
  directoryUrl: URL;
  /** Access Service URL: URL to the Access Service. */
  accessServiceUrl: URL;
  /** Ignore Service Aud: Skip verification of Service ID in token audience. */
  ignoreServiceAud?: boolean;
}

interface PlatformServices {
  /** ServiceDirectory: Directory of services. */
  directory: ServiceDirectory;
  /** TenantService: Service for accessing tenant information. */
  tenantService: TenantService;
  /** ConfigurationService: Service for accessing tenant specific configuration. */
  configurationService: ConfigurationService;
}

interface Platform extends PlatformServices {
  /** TokenProvider: Provides service account access token. */
  tokenProvider: TokenProvider;
  /** TenantStrategy: PassportJS strategy for tenant access tokens. */
  tenantStrategy: Strategy;
  /** TenantHandler: Express request handler that sets req.tenant. */
  tenantHandler: RequestHandler;
  /** ConfigurationHandler: Express request handler that sets req.configuration. */
  configurationHandler: RequestHandler;
}

interface LogOptions {
  logger?: Logger;
  logLevel?: string;
}

export async function initializePlatform(
  { serviceId, clientSecret, directoryUrl, accessServiceUrl, ignoreServiceAud }: AdspOptions,
  logOptions?: LogOptions,
  service?: Partial<PlatformServices>
): Promise<Platform> {
  const logger = logOptions?.logger || createLogger(serviceId.toString(), logOptions?.logLevel);

  const tokenProvider = createTokenProvider({ logger, serviceId, clientSecret, accessServiceUrl });
  const directory = service?.directory || createDirectory({ logger, directoryUrl, tokenProvider });
  const tenantService = service?.tenantService || createTenantService({ logger, directory, tokenProvider });
  const tenantHandler = createTenantHandler(tenantService);
  const tenantStrategy = createTenantStrategy({ logger, serviceId, accessServiceUrl, tenantService, ignoreServiceAud });
  const configurationService =
    service?.configurationService || createConfigurationService({ logger, serviceId, directory });
  const configurationHandler = createConfigurationHandler(configurationService);

  return {
    tokenProvider,
    tenantService,
    tenantStrategy,
    tenantHandler,
    configurationService,
    configurationHandler,
    directory,
  };
}

export { adspId, AdspId } from './utils';
export { createCoreStrategy } from './access';
export type { Tenant } from './tenant';
