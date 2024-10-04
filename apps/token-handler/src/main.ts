import { AdspId, ServiceMetricsValueDefinition, initializePlatform } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import * as compression from 'compression';
import * as express from 'express';
import { readFile } from 'fs';
import * as helmet from 'helmet';
import * as passport from 'passport';
import { createClient } from 'redis';
import { promisify } from 'util';

import { environment } from './environments/environment';
import { configurePassport } from './token/access';
import {
  ClientRegisteredEventDefinition,
  ServiceRoles,
  TokenHandlerConfiguration,
  applyTokenHandlerMiddleware,
  configurationSchema,
} from './token';
import { createRedisRepository } from './redis';

const logger = createLogger('token-handler', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());

  // NOTE: CORS is not enabled as this is intended to be used behind a web server / proxy for the frontend.
  // app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);

  const redisClient = createClient({
    host: environment.REDIS_HOST,
    port: environment.REDIS_PORT,
    password: environment.REDIS_PASSWORD,
  });
  redisClient.on('error', (err) => {
    logger.error(`Redis client encountered error: ${err}`);
  });

  const repository = createRedisRepository({
    logger,
    redisClient,
    storeSecret: environment.STORE_SECRET,
  });

  const {
    configurationHandler,
    directory,
    eventService,
    healthCheck,
    metricsHandler,
    tenantHandler,
    tenantService,
    tenantStrategy,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Token handler',
      description: 'Token handler pattern as a service.',
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      roles: [
        {
          role: ServiceRoles.Admin,
          description: 'Administrator role for token handler allowed to register clients.',
          inTenantAdmin: true,
        },
      ],
      configuration: {
        description: 'Clients allowed to access the token handler and upstream targets for requests.',
        schema: configurationSchema,
      },
      combineConfiguration: function (tenant, core, tenantId) {
        return new TokenHandlerConfiguration(
          accessServiceUrl,
          logger,
          directory,
          repository,
          tenantId,
          tenantId
            ? {
                clients: {
                  ...tenant?.['clients'],
                  ...core?.['clients'],
                },
              }
            : {}
        );
      },
      enableConfigurationInvalidation: true,
      useLongConfigurationCacheTTL: true,
      events: [ClientRegisteredEventDefinition],
      values: [ServiceMetricsValueDefinition],
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  const sessionStore = configurePassport(app, passport, {
    tenantStrategy,
    sessionSecret: environment.SESSION_SECRET,
    storeSecret: environment.STORE_SECRET,
    redisClient,
  });
  app.use(traceHandler);
  app.use(metricsHandler);

  applyTokenHandlerMiddleware(app, {
    logger,
    configurationHandler,
    eventService,
    passport,
    sessionStore,
    tenantHandler,
    tenantService,
  });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({ ...platform, db: repository.isConnected() });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Token handler',
      description: 'Token handler pattern as a service.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/token-handler/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3600;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
