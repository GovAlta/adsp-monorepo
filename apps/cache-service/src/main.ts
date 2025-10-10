import { AdspId, initializePlatform, ServiceMetricsValueDefinition } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import * as cors from 'cors';
import * as express from 'express';
import { readFile } from 'fs';
import * as helmet from 'helmet';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { createClient } from 'redis';
import { promisify } from 'util';
// import * as compression from 'compression';
import { environment } from './environments/environment';
import {
  applyCacheMiddleware,
  CacheServiceConfiguration,
  configurationSchema,
  ConfigurationValue,
  ServiceRoles,
} from './cache';
import { createRedisCacheProvider } from './redis';
import { createAnonymousTenantHandler } from './tenant';
import { createCacheQueueService } from './amqp';
import { accessApiId } from './cache/model';

const logger = createLogger('cache-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  // app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

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

  const cacheProvider = createRedisCacheProvider({ logger, client: redisClient });

  const {
    configurationHandler,
    configurationService,
    coreStrategy,
    directory,
    tenantHandler,
    tenantService,
    tenantStrategy,
    healthCheck,
    metricsHandler,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Cache service',
      description: 'Cache service provides a read through http request cache.',
      roles: [
        {
          role: ServiceRoles.CacheReader,
          description: 'Cache reader role that grants permission to make a request through the cache.',
        },
      ],
      events: [],
      configuration: {
        schema: configurationSchema,
        description: 'Upstream targets for cache read through requests.',
      },
      combineConfiguration: function (config: ConfigurationValue, coreConfig: ConfigurationValue, tenantId: AdspId) {
        return new CacheServiceConfiguration(
          logger,
          directory,
          tenantService,
          cacheProvider,
          {
            targets: {
              ...config?.targets,
              ...coreConfig?.targets,
            },
          },
          tenantId
        );
      },
      enableConfigurationInvalidation: true,
      useLongConfigurationCacheTTL: true,
      values: [ServiceMetricsValueDefinition],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      serviceConfigurations: [
        {
          serviceId,
          configuration: {
            targets: {
              [accessApiId.toString()]: {
                // TTL of 2592000 seconds (30 days).
                ttl: 2592000,
              },
            },
          },
        },
      ],
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

  const queueService = await createCacheQueueService({ logger, ...environment });

  const anonymousTenantHandler = createAnonymousTenantHandler(tenantService);
  app.use(
    '/cache',
    metricsHandler,
    passport.authenticate(['core', 'tenant', 'anonymous'], { session: false }),
    tenantHandler,
    anonymousTenantHandler,
    configurationHandler
  );

  applyCacheMiddleware(app, { logger, configurationService, queueService });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
      db: cacheProvider.isConnected(),
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Cache service',
      description: 'Cache service provides a read through http request cache.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/cache/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3347;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
