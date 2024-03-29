import * as express from 'express';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, initializePlatform, ServiceMetricsValueDefinition } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler, AjvValidationService } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createRepositories } from './mongo';
import { ServiceRoles, bootstrapDirectory, applyDirectoryV2Middleware } from './directory';
import { getServiceUrlById, getResourceUrlById } from './directory/router/util/getNamespaceEntries';
import { EntryUpdatedDefinition, EntryDeletedDefinition, EntryUpdatesStream } from './directory/events';
const logger = createLogger('directory-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const validationService = new AjvValidationService(logger);
  const repositories = await createRepositories({ ...environment, validationService, logger });
  if (environment.DIRECTORY_BOOTSTRAP) {
    await bootstrapDirectory(logger, environment.DIRECTORY_BOOTSTRAP, repositories.directoryRepository);
  }

  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const { coreStrategy, eventService, healthCheck, tenantStrategy, tenantService, metricsHandler, traceHandler } =
    await initializePlatform(
      {
        serviceId,
        displayName: 'Directory service',
        description: 'Service that provides a register of services and APIs for service discovery.',
        roles: [
          {
            role: ServiceRoles.DirectoryAdmin,
            description: 'Administrator role for the directory service.',
            inTenantAdmin: true,
          },
        ],
        events: [EntryUpdatedDefinition, EntryDeletedDefinition],
        clientSecret: environment.CLIENT_SECRET,
        accessServiceUrl,
        directoryUrl: new URL(environment.DIRECTORY_URL),
        eventStreams: [EntryUpdatesStream],
        values: [ServiceMetricsValueDefinition],
      },
      { logger },
      {
        // TODO: This needs to be implemented so that the directory doesn't make re-entrant request to
        // itself via the SDK. Re-entrancy on start up can be a problem.
        directory: {
          getResourceUrl: (serviceId: AdspId) => getResourceUrlById(serviceId, repositories.directoryRepository),
          getServiceUrl: (serviceId: AdspId) => getServiceUrlById(serviceId, repositories.directoryRepository),
        },
      }
    );

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);
  passport.use('anonymous', new AnonymousStrategy());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.use('/directory', metricsHandler, passport.authenticate(['core', 'tenant', 'anonymous'], { session: false }));
  applyDirectoryV2Middleware(app, { ...repositories, logger, tenantService, eventService });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({ ...platform, db: repositories.isConnected() });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Directory service',
      description: 'Service that provides a register of services and APIs for service discovery.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/directory/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3331;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
