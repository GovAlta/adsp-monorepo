import * as express from 'express';
import * as passport from 'passport';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import {
  AjvValidationService,
  createLogger,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
} from '@core-services/core-common';
import { environment } from './environments/environment';
import { createEventService } from './amqp';
import { applyEventMiddleware, EventServiceRoles, Namespace, NamespaceEntity } from './event';

const logger = createLogger('event-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  const eventService = await createEventService({
    amqpHost: environment.AMQP_HOST,
    amqpUser: environment.AMQP_USER,
    amqpPassword: environment.AMQP_PASSWORD,
    logger,
  });

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    coreStrategy,
    directory,
    tenantStrategy,
    tenantHandler,
    tokenProvider,
    configurationHandler,
    healthCheck,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Event Service',
      description: 'Service for sending of domain events.',
      roles: [EventServiceRoles.sender],
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
                  payloadSchema: { type: 'object' },
                },
                required: ['name', 'description', 'payloadSchema'],
                additionalProperties: false,
              },
            },
          },
          required: ['name', 'definitions'],
          additionalProperties: false,
        },
      },
      configurationConverter: (config: Record<string, Namespace>, tenantId) => {
        return config
          ? Object.getOwnPropertyNames(config).reduce(
              (namespaces, namespace) => ({
                ...namespaces,
                [namespace]: new NamespaceEntity(
                  new AjvValidationService(logger),
                  config[namespace],
                  tenantId
                ),
              }),
              {}
            )
          : null;
      },
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
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
    done(null, user);
  });

  app.use(passport.initialize());
  app.use('/event', passport.authenticate(['core', 'tenant'], { session: false }), tenantHandler, configurationHandler);

  applyEventMiddleware(app, {
    logger,
    directory,
    tokenProvider,
    eventService,
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      msg: eventService.isConnected(),
      ...platform,
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      _links: {
        self: new URL(req.originalUrl, rootUrl).href,
        health: new URL('/health', rootUrl).href,
        api: new URL('/event/v1', rootUrl).href,
        doc: new URL('/swagger/docs/v1', rootUrl).href,
      },
    });
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof UnauthorizedError) {
      res.status(401).send(err.message);
    } else if (err instanceof NotFoundError) {
      res.status(404).send(err.message);
    } else if (err instanceof InvalidOperationError) {
      res.status(400).send(err.message);
    } else {
      logger.warn(`Unexpected error encountered in handler: ${err}`);
      res.sendStatus(500);
    }
  });

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3334;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
