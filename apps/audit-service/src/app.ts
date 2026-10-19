import { AdspId, initializePlatform, instrumentAxios } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createLogger, createErrorHandler } from '@core-services/core-common';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { readFile } from 'fs';
import * as helmet from 'helmet';
import * as passport from 'passport';
import { promisify } from 'util';
import { environment } from './environments/environment';
import {
  AuditServiceRoles,
  CatalogService,
  configurationSchema,
  createAuditConfigurationConverter,
  combineAuditConfiguration,
  createAuditRouter,
  createAuditJsonParser,
  RetentionService,
  validateTenantContext,
  assertTenantContext,
} from './audit';
import { createDatabase } from './postgres';

const logger = createLogger('audit-service', environment.LOG_LEVEL);

export const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(createAuditJsonParser());
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  instrumentAxios(logger);

  const { isConnected } = await createDatabase({ logger, ...environment });

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const { coreStrategy, tenantStrategy, tenantHandler, configurationService, healthCheck, traceHandler } =
    await initializePlatform(
      {
        serviceId,
        displayName: 'Audit service',
        description: 'Tenant-scoped audit action catalogs and event ingestion.',
        roles: [
          {
            role: AuditServiceRoles.Reader,
            description: 'Read action catalogs and audit history within a tenant.',
            inTenantAdmin: true,
          },
          {
            role: AuditServiceRoles.Writer,
            description: 'Write audit events. Assign to application service accounts.',
          },
          {
            role: AuditServiceRoles.Admin,
            description: 'Administer failed audit events and access protected actor identity.',
          },
        ],
        configuration: {
          useNamespace: true,
          description: 'Audit action catalogs, tenant retention settings, and application retention overrides.',
          schema: configurationSchema,
        },
        configurationConverter: createAuditConfigurationConverter(logger),
        combineConfiguration: combineAuditConfiguration,
        enableConfigurationInvalidation: true,
        useLongConfigurationCacheTTL: false,
        events: [],
        clientSecret: environment.CLIENT_SECRET,
        accessServiceUrl,
        directoryUrl: new URL(environment.DIRECTORY_URL),
      },
      { logger },
    );

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.use(
    '/audit',
    passport.authenticate(['core', 'tenant'], { session: false }),
    assertAuthenticatedHandler,
    validateTenantContext,
    assertTenantContext,
    tenantHandler,
  );
  app.use(
    '/audit/v1',
    createAuditRouter({
      catalogs: new CatalogService(configurationService, logger),
      retention: new RetentionService(configurationService, logger),
      logger,
      serviceId,
    }),
  );

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({ ...platform, db: await isConnected() });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Audit service',
      description: 'Tenant-scoped audit action catalogs and event ingestion.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/audit/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};
