import { AdspId, initializePlatform, User } from '@abgov/adsp-service-sdk';
import { ClientSecretRotationEvents, resolveConfiguration } from '@core-services/client-secret-rotation';
import { createErrorHandler } from '@core-services/core-common';
import * as cors from 'cors';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as express from 'express';
import * as healthCheck from 'express-healthcheck';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { environment } from './environments/environment';
import { createRepositories, disconnect } from './mongo';
import { logger } from './middleware/logger';
import {
  TenantAuditActions,
  TenantCreatedDefinition,
  TenantDeletedDefinition,
  TenantArchivedDefinition,
  TenantRestoredDefinition,
  TenantNameUpdatedDefinition,
  configurationSchema,
  applyTenantMiddleware,
  TenantServiceImpl,
  TenantServiceRoles,
  scheduleTenantPurgeJob,
  scheduleTenantProvisioningRecoveryJob,
  ProvisioningTracker,
} from './tenant';
import { createKeycloakRealmService } from './keycloak';
import { applyRotationMiddleware, ClientSecretRotationRoles, createRotationKeycloakFactory } from './rotation';
import { createShutdownHandler } from './shutdown';

// Shared by tenant creation and shutdown, so shutdown can wait for realms still being provisioned.
const provisioning = new ProvisioningTracker();

async function initializeApp(): Promise<express.Application> {
  const repositories = await createRepositories({ ...environment, logger });

  const app = express();
  app.use(compression());
  app.use(helmet());
  app.use(express.json());
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const {
    coreStrategy,
    tenantStrategy,
    tenantHandler,
    eventService,
    auditService,
    configurationHandler,
    directory,
    tokenProvider,
    traceHandler,
  } = await initializePlatform(
      {
        serviceId,
        displayName: 'Tenant service',
        description: 'Service for management of ADSP tenants.',
        clientSecret: environment.CLIENT_SECRET,
        directoryUrl: new URL(environment.DIRECTORY_URL),
        accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
        configuration: {
          description:
            'Service roles with name, description, and whether the role is part of the tenant administrator role.',
          schema: configurationSchema,
        },
        // Only urn entries register service roles; other keys are realm rotation settings.
        configurationConverter: (c) =>
          Object.entries(c)
            .filter(([k]) => k.startsWith('urn:'))
            .map(([k, v]) => ({ serviceId: AdspId.parse(k), ...v })),
        events: [
          TenantCreatedDefinition,
          TenantDeletedDefinition,
          TenantArchivedDefinition,
          TenantRestoredDefinition,
          TenantNameUpdatedDefinition,
          ...ClientSecretRotationEvents,
        ],
        auditActions: TenantAuditActions,
        roles: [
          // Note: Tenant Admin role is a special composite role.
          {
            role: TenantServiceRoles.TenantAdmin,
            description: 'Administrator role for accessing the ADSP tenant admin.',
          },
          {
            role: TenantServiceRoles.PlatformService,
            description: 'Service role for backend services for reading tenants.',
          },
          {
            role: ClientSecretRotationRoles.ClientSecretAdmin,
            description: 'Client secret admin role that grants permission to manage client secret rotation in a realm.',
            // Tenant admins manage the rotation of their own realm.
            inTenantAdmin: true,
          },
        ],
      },
      { logger },
      {
        tenantService: new TenantServiceImpl(repositories.tenantRepository),
      },
    );

  passport.use('jwt', coreStrategy);
  passport.use('jwt-tenant', tenantStrategy);
  passport.use('anonymous', new AnonymousStrategy());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  const realmService = createKeycloakRealmService({ logger, KEYCLOAK_ROOT_URL: environment.KEYCLOAK_ROOT_URL });
  applyTenantMiddleware(app, {
    ...repositories,
    logger,
    eventService,
    auditService,
    realmService,
    configurationHandler,
    provisioning,
  });

  const createKeycloak = await createRotationKeycloakFactory(environment.KEYCLOAK_ROOT_URL);
  applyRotationMiddleware(app, {
    logger,
    serviceId,
    directory,
    tokenProvider,
    tenantHandler,
    eventService,
    createKeycloak,
    // Rotation windows use the platform defaults; tenants set their own schedule per realm.
    getConfiguration: async () => resolveConfiguration(undefined),
  });

  if (environment.TENANT_PURGE_ENABLED) {
    scheduleTenantPurgeJob({
      serviceId,
      logger,
      tenantRepository: repositories.tenantRepository,
      realmService,
      eventService,
      auditService,
      retentionDays: environment.TENANT_RETENTION_DAYS,
      cron: environment.TENANT_PURGE_SCHEDULE,
    });
  }

  if (environment.TENANT_PROVISIONING_RECOVERY_ENABLED) {
    scheduleTenantProvisioningRecoveryJob({
      serviceId,
      logger,
      tenantRepository: repositories.tenantRepository,
      realmService,
      auditService,
      staleAfterMinutes: environment.TENANT_PROVISIONING_STALE_MINUTES,
      cron: environment.TENANT_PROVISIONING_RECOVERY_SCHEDULE,
    });
  }

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Tenant service',
      description: 'Service for management of ADSP tenants.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  app.use('/health', healthCheck());

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  return app;
}

initializeApp()
  .then((app) => {
    const port = environment.PORT || 3333;

    const server = app.listen(port, () => {
      logger.info(`Listening at http://localhost:${port}/api`);
    });

    const handleExit = createShutdownHandler({
      logger,
      server,
      provisioning,
      timeoutMs: environment.TENANT_PROVISIONING_SHUTDOWN_TIMEOUT_MS,
      disconnect,
      exit: (code) => process.exit(code),
    });

    process.on('SIGINT', async () => {
      handleExit('Tenant management api exit, Byte', 1, null);
    });
    process.on('SIGTERM', async () => {
      handleExit('Tenant management api was termination, Byte', 1, null);
    });
    process.on('uncaughtException', async (err: Error) => {
      handleExit('Tenant management api Uncaught exception', 1, err);
    });
  })
  .catch((err) => logger.error(err));
