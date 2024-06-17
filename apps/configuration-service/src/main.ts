import * as express from 'express';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, initializePlatform, ServiceMetricsValueDefinition } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler, AjvValidationService } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createRepositories } from './mongo';
import {
  applyConfigurationMiddleware,
  RevisionCreatedDefinition,
  ActiveRevisionSetDefinition,
  ConfigurationServiceRoles,
  ConfigurationUpdatedDefinition,
  ConfigurationUpdatesStream,
} from './configuration';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';

const logger = createLogger('configuration-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const { coreStrategy, tenantStrategy, tenantHandler, eventService, healthCheck, metricsHandler, traceHandler } =
    await initializePlatform(
      {
        serviceId,
        displayName: 'Configuration service',
        description: 'Service for managing configuration',
        roles: [
          {
            role: ConfigurationServiceRoles.Reader,
            description: 'Reader role that grants access to configuration.',
          },
          {
            role: ConfigurationServiceRoles.ConfigurationAdmin,
            description: 'Administrator role that grants access to and modification of configuration.',
            inTenantAdmin: true,
          },
          {
            role: ConfigurationServiceRoles.ConfiguredService,
            description: 'Service role that grants service accounts access to configuration.',
          },
        ],
        events: [ConfigurationUpdatedDefinition, RevisionCreatedDefinition, ActiveRevisionSetDefinition],
        eventStreams: [ConfigurationUpdatesStream],
        clientSecret: environment.CLIENT_SECRET,
        accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
        directoryUrl: new URL(environment.DIRECTORY_URL),
        // Configuration service registers against itself and Keycloak doesn't include aud in that case.
        ignoreServiceAud: true,
        values: [ServiceMetricsValueDefinition],
      },
      { logger }
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
  app.use(
    '/configuration',
    metricsHandler,
    passport.authenticate(['core', 'tenant', 'anonymous'], { session: false }),
    tenantHandler
  );

  const validationService = new AjvValidationService(logger);
  const repositories = await createRepositories({ ...environment, validationService, logger });
  await applyConfigurationMiddleware(app, { ...repositories, eventService, serviceId, logger });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
      db: repositories.isConnected(),
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Configuration service',
      description: 'Service for managing configuration',
      _links: {
        self: {
          href: new URL(req.originalUrl, rootUrl).href,
        },
        health: {
          href: new URL('/health', rootUrl).href,
        },
        api: {
          href: new URL('/configuration/v2', rootUrl).href,
        },
        docs: {
          href: new URL('/swagger/docs/v1', rootUrl).href,
        },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3339;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
