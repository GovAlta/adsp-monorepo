import * as express from 'express';
import * as passport from 'passport';
import * as compression from 'compression';
import * as helmet from 'helmet';
import {
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
  AjvValidationService,
  assertAuthenticatedHandler,
} from '@core-services/core-common';
import { environment } from './environments/environment';
import { logger } from './logger';
import { applyValuesMiddleware, Namespace, NamespaceEntity, ServiceUserRoles } from './values';
import { createRepositories } from './timescale';
import { AdspId, initializePlatform, UnauthorizedUserError } from '@abgov/adsp-service-sdk';

const initializeApp = async () => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  const repositories = await createRepositories({ ...environment, logger });

  const {
    coreStrategy,
    tenantStrategy,
    tenantHandler,
    configurationHandler,
    eventService,
    healthCheck,
  } = await initializePlatform(
    {
      serviceId: AdspId.parse(environment.CLIENT_ID),
      displayName: 'Value Service',
      description: 'Service for time-series values.',
      roles: [ServiceUserRoles.Reader, ServiceUserRoles.Writer],
      configurationSchema: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            definitions: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  jsonSchema: { type: 'object' },
                },
                required: ['name', 'description', 'jsonSchema'],
                additionalProperties: false,
              },
            },
          },
          required: ['name', 'definitions'],
        },
      },
      events: [
        {
          name: 'value-written',
          description: 'Signalled when a value is written to',
          payloadSchema: {
            type: 'object',
            properties: {
              namespace: { type: 'string' },
              name: { type: 'string' },
              value: { type: 'object' },
            },
          },
        },
      ],
      clientSecret: environment.CLIENT_SECRET,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
      configurationConverter: (config: Record<string, Namespace>, tenantId) => {
        return config
          ? Object.getOwnPropertyNames(config).reduce(
              (namespaces, namespace) => ({
                ...namespaces,
                [namespace]: new NamespaceEntity(
                  new AjvValidationService(logger),
                  repositories.valueRepository,
                  config[namespace],
                  tenantId
                ),
              }),
              {}
            )
          : null;
      },
    },
    { logger }
  );

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  app.use(passport.initialize());
  app.use(
    '/value',
    passport.authenticate(['core', 'tenant'], { session: false }),
    assertAuthenticatedHandler,
    tenantHandler,
    configurationHandler
  );

  applyValuesMiddleware(app, { logger, repository: repositories.valueRepository, eventService });

  app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof UnauthorizedError) {
      res.send(err.message).status(401);
    } else if (err instanceof UnauthorizedUserError) {
      res.send(err.message).status(401);
    } else if (err instanceof NotFoundError) {
      res.send(err.message).status(404);
    } else if (err instanceof InvalidOperationError) {
      res.send(err.message).status(400);
    } else {
      logger.warn(`Unexpected error encountered in handler: ${err}`);
      res.sendStatus(500);
      next(err);
    }
  });

  app.use('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      db: await repositories.isConnected(),
      ...platform,
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      _links: {
        self: new URL(req.originalUrl, rootUrl).href,
        health: new URL('/health', rootUrl).href,
        api: new URL('/value/v1', rootUrl).href,
        doc: new URL('/swagger/docs/v1', rootUrl).href,
      },
    });
  });

  return app;
};

initializeApp().then((app) => {
  const port = process.env.PORT || 3336;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
