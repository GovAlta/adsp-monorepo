import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import {
  ClientSecretRotationConfiguration,
  ClientSecretRotationConfigurationSchema,
  ClientSecretRotationEvents,
  resolveConfiguration,
  RotationKeycloakClient,
} from '@core-services/client-secret-rotation';
import { createErrorHandler, createLogger, createShutdownHandler } from '@core-services/core-common';
import type KcAdminClient from '@keycloak/keycloak-admin-client';
import * as cors from 'cors';
import * as express from 'express';
import { readFile } from 'fs';
import * as helmet from 'helmet';
import * as passport from 'passport';
import { promisify } from 'util';
import { environment } from './environments/environment';
import { ClientSecretRotationRoles, createRealmSettingsStore, createRotationRouter } from './rotation';

const logger = createLogger('client-secret-rotation-api', environment.LOG_LEVEL);

// The admin client package is ESM only; see tenant-management-api/src/keycloak/index.ts.
const dynamicImport = async (packageName: string) => new Function(`return import('${packageName}')`)();

// Keycloak client that acts with the signed-in admin's own token, so Keycloak enforces that admin's permissions.
async function createKeycloakFactory(): Promise<(realm: string, bearer: string) => RotationKeycloakClient> {
  const Client: typeof KcAdminClient = (await dynamicImport('@keycloak/keycloak-admin-client')).default;
  return (realm, bearer) => {
    const client = new Client({ baseUrl: `${environment.KEYCLOAK_ROOT_URL}/auth`, realmName: realm });
    client.setAccessToken(bearer);
    return new RotationKeycloakClient(client);
  };
}

const initializeApp = async () => {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const {
    coreStrategy,
    tenantStrategy,
    tenantHandler,
    configurationService,
    eventService,
    auditService,
    tokenProvider,
    directory,
    healthCheck,
    metricsHandler,
    traceHandler,
    shutdownTelemetry,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Client secret rotation service',
      description:
        'Lets tenant admins view, rotate and opt in Keycloak client secrets of their realm, and notifies of expiry.',
      roles: [
        {
          role: ClientSecretRotationRoles.ClientSecretAdmin,
          description: 'Client secret admin role that grants permission to manage client secret rotation in a realm.',
          // Tenant admins manage the rotation of their own realm.
          inTenantAdmin: true,
        },
      ],
      configuration: {
        description: 'Configuration of client secret rotation windows and the core realm notification tenant.',
        schema: ClientSecretRotationConfigurationSchema,
      },
      events: ClientSecretRotationEvents,
      // Authorization is the client-secret-admin role check in the router. Tenant tokens carry no audience for this
      // service unless they hold one of its roles, which would otherwise be rejected as 401 before that check.
      ignoreServiceAud: true,
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
      directoryUrl: new URL(environment.DIRECTORY_URL),
      tracing: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
      metrics: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
    },
    { logger },
  );

  const createKeycloak = await createKeycloakFactory();

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user as User));

  app.use(passport.initialize());
  app.use(traceHandler);

  const getConfiguration = async (): Promise<ClientSecretRotationConfiguration> => {
    const [configuration] = await configurationService.getServiceConfiguration<
      { clientSecretRotation?: Partial<ClientSecretRotationConfiguration> },
      [{ clientSecretRotation?: Partial<ClientSecretRotationConfiguration> }]
    >();
    return resolveConfiguration(configuration?.clientSecretRotation);
  };

  app.use(
    '/rotation/v1',
    metricsHandler,
    passport.authenticate(['core', 'tenant'], { session: false }),
    tenantHandler,
    createRotationRouter({
      logger,
      createKeycloak,
      settingsStore: createRealmSettingsStore(directory, tokenProvider, serviceId),
      eventService,
      getConfiguration,
      skipClientIds: [],
    }),
  );

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    res.json(await healthCheck());
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Client secret rotation service',
      description: 'Manage Keycloak client secret rotation for a realm.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/rotation/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  app.use(createErrorHandler(logger));

  return { app, auditService, shutdownTelemetry };
};

initializeApp().then(({ app, auditService, shutdownTelemetry }) => {
  const port = environment.PORT || 3350;
  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));

  const shutdown = createShutdownHandler({
    serviceName: 'Client secret rotation service',
    server,
    auditService,
    shutdownTelemetry,
    logger,
  });
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
});
