import { AdspId, initializePlatform, instrumentAxios, ServiceMetricsValueDefinition } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import {
  AjvValidationService,
  createAmqpConfigUpdateService,
  createLogger,
  createErrorHandler,
} from '@core-services/core-common';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { readFile } from 'fs';
import * as helmet from 'helmet';
import * as passport from 'passport';
import { promisify } from 'util';
import { environment } from './environments/environment';
import { createEventService } from './amqp';
import { applyEventMiddleware, configurationSchema, EventServiceRoles, Namespace, NamespaceEntity } from './event';

const logger = createLogger('event-service', environment.LOG_LEVEL);

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

  const eventService = await createEventService({
    amqpHost: environment.AMQP_HOST,
    amqpUser: environment.AMQP_USER,
    amqpPassword: environment.AMQP_PASSWORD,
    amqpUrl: environment.AMQP_URL,
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
    configurationService,
    clearCached,
    healthCheck,
    metricsHandler,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Event service',
      description: 'Service for sending of domain events.',
      roles: [EventServiceRoles.sender],
      configuration: {
        description: 'Definitions of events including payload schema.',
        schema: configurationSchema,
      },
      configurationConverter: (config: Record<string, Namespace>, tenantId) => {
        return config
          ? Object.getOwnPropertyNames(config).reduce(
              (namespaces, namespace) => ({
                ...namespaces,
                [namespace]: new NamespaceEntity(new AjvValidationService(logger), config[namespace], tenantId),
              }),
              {}
            )
          : null;
      },
      combineConfiguration: (tenantConfig: Record<string, Namespace>, coreConfig: Record<string, Namespace>) => ({
        ...tenantConfig,
        ...coreConfig,
      }),
      useLongConfigurationCacheTTL: true,
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      values: [
        ServiceMetricsValueDefinition,
        {
          id: 'event',
          name: 'Event log',
          description: 'Values representing entries in the event log.',
          jsonSchema: {
            type: 'object',
            properties: {
              payload: { type: 'object' },
            },
            required: ['payload'],
          },
        },
      ],
    },
    { logger }
  );

  // This update connection is per instance (when horizontally scaled) rather than
  // a shared work queue like the regular event queue (for logging, etc.)
  const configurationSync = await createAmqpConfigUpdateService({
    ...environment,
    logger,
  });

  configurationSync.getItems().subscribe(({ item, done }) => {
    clearCached(item.tenantId, item.serviceId);
    done();
  });

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
    '/event',
    (req, res, next) => {
      const { namespace } = req.body || {};
      // Skip metrics for value service events; otherwise we're in a loop with the value write events.
      if (namespace !== 'value-service') {
        metricsHandler(req, res, next);
      } else {
        next();
      }
    },
    passport.authenticate(['core', 'tenant'], { session: false }),
    tenantHandler,
    configurationHandler
  );

  applyEventMiddleware(app, {
    serviceId,
    logger,
    directory,
    tokenProvider,
    configurationService,
    eventService,
  });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
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
      name: 'Event service',
      description: 'Service for sending of domain events.',
      _links: {
        self: {
          href: new URL(req.originalUrl, rootUrl).href,
        },
        health: {
          href: new URL('/health', rootUrl).href,
        },
        api: { href: new URL('/event/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3334;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
