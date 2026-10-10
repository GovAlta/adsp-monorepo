import * as express from 'express';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, initializePlatform, instrumentAxios, ServiceMetricsValueDefinition } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { environment } from './environments/environment';
import {
  applyPlannerMiddleware,
  configurationSchema,
  PlannerServiceRoles,
  SolutionCreatedDefinition,
  SolutionDeletedDefinition,
  SolutionUpdatedDefinition,
} from './planner';
import { createRepositories } from './postgres';

const logger = createLogger('project-planner-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  instrumentAxios(logger);

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    coreStrategy,
    configurationHandler,
    eventService,
    metricsHandler,
    tenantHandler,
    tenantStrategy,
    healthCheck,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Project planner service',
      description:
        'Service that helps users describe a business problem, match it to known patterns, and plan which ADSP services to use.',
      roles: [
        {
          role: PlannerServiceRoles.Admin,
          description: 'Administrator role for the planner; can access all solutions in the tenant.',
          inTenantAdmin: true,
        },
        {
          role: PlannerServiceRoles.User,
          description: 'User role for creating and working on own planner solutions.',
        },
      ],
      events: [SolutionCreatedDefinition, SolutionUpdatedDefinition, SolutionDeletedDefinition],
      configuration: {
        schema: configurationSchema,
        description: 'Tenant-defined business patterns that extend the planner built-in pattern catalog.',
      },
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      tracing: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
      metrics: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
      values: [ServiceMetricsValueDefinition],
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
    '/planner',
    metricsHandler,
    passport.authenticate(['core', 'tenant'], { session: false }),
    tenantHandler,
    configurationHandler,
  );

  const repositories = await createRepositories({ logger, ...environment });
  applyPlannerMiddleware(app, {
    serviceId,
    logger,
    solutionRepository: repositories.solutionRepository,
    eventService,
  });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({ ...platform, db: await repositories.isConnected() });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Project planner service',
      description: 'Service that helps plan which ADSP services to use for a business problem.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/planner/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3381;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
