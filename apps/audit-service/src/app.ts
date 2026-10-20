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
  createAuditMetrics,
  FailedEventRepository,
  FailedEventService,
} from './audit';
import { AuditWriteBuffer } from './audit/buffer';
import { createDatabase, PostgresEventRepository } from './postgres';

const logger = createLogger('audit-service', environment.LOG_LEVEL);

export interface AuditApplication extends express.Application {
  drain: () => Promise<void>;
  shutdown: () => Promise<void>;
}

export const initializeApp = async ({
  failedEventRepository,
}: { failedEventRepository?: FailedEventRepository } = {}): Promise<AuditApplication> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(createAuditJsonParser());
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  instrumentAxios(logger);

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    coreStrategy,
    tenantStrategy,
    tenantHandler,
    configurationService,
    healthCheck,
    traceHandler,
    metricsHandler,
    meterProvider,
    shutdownTelemetry,
  } = await initializePlatform(
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
      metrics: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
    },
    { logger },
  );
  const auditMetrics = createAuditMetrics(meterProvider?.getMeter('audit-service'), failedEventRepository, logger);
  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  const { knex, isConnected } = await createDatabase({ logger, ...environment });
  const repository = new PostgresEventRepository(knex, logger);
  const buffer = new AuditWriteBuffer(repository, logger);

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
    metricsHandler,
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
      submitter: buffer,
      reader: repository,
      logger,
      failedEvents: new FailedEventService(failedEventRepository, serviceId.toString(), auditMetrics),
    }),
  );

  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    const db = await isConnected();
    const ready = db && buffer.isReady;
    res.status(ready ? 200 : 503).json({ ...platform, db, ready });
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

  let shutdown: Promise<void>;
  return Object.assign(app, {
    drain: () => buffer.close(),
    shutdown: () => {
      shutdown ??= (async () => {
        try {
          await buffer.close();
        } finally {
          try {
            await knex.destroy();
          } finally {
            await shutdownTelemetry();
          }
        }
      })();
      return shutdown;
    },
  });
};
