import * as express from 'express';
import * as fs from 'fs';
import * as passport from 'passport';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler, AjvValidationService } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createRepositories } from './mongo';
import {
  applyConfigurationMiddleware,
  RevisionCreatedDefinition,
  ConfigurationServiceRoles,
  ConfigurationUpdatedDefinition,
} from './configuration';

const logger = createLogger('configuration-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const { coreStrategy, tenantStrategy, eventService, healthCheck } = await initializePlatform(
    {
      serviceId,
      displayName: 'Configuration Service',
      description: 'Service for managing configuration',
      roles: [
        {
          role: ConfigurationServiceRoles.Reader,
          description: 'Reader role that grants access to configuration.',
        },
        {
          role: ConfigurationServiceRoles.ConfigurationAdmin,
          description: 'Administrator role that grants access and modification of configuration.',
          inTenantAdmin: true,
        },
      ],
      events: [ConfigurationUpdatedDefinition, RevisionCreatedDefinition],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
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
  app.use('/configuration', passport.authenticate(['core', 'tenant'], { session: false }));

  const validationService = new AjvValidationService(logger);
  const repositories = await createRepositories({ ...environment, validationService, logger });
  await applyConfigurationMiddleware(app, { ...repositories, eventService, serviceId, logger });

  let swagger = null;
  app.use('/swagger/docs/v1', (_req, res) => {
    if (swagger) {
      res.json(swagger);
    } else {
      fs.readFile(`${__dirname}/swagger.json`, 'utf8', (err, data) => {
        if (err) {
          res.sendStatus(404);
        } else {
          swagger = JSON.parse(data);
          res.json(swagger);
        }
      });
    }
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
      _links: {
        self: new URL(req.originalUrl, rootUrl).href,
        health: new URL('/health', rootUrl).href,
        api: new URL('/configuration/v2', rootUrl).href,
        doc: new URL('/swagger/docs/v1', rootUrl).href,
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
