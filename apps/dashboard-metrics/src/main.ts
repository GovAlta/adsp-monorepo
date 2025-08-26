import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { readFile } from 'fs';
import * as helmet from 'helmet';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { promisify } from 'util';
import { environment } from './environments/environment';
import { applyMetricsMiddleware, MetricsRepository } from './metrics';
import { createRedisRepository } from './redis';

const logger = createLogger('dashboard-metrics', environment.LOG_LEVEL);

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
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const { healthCheck, traceHandler, directory, tokenProvider, tenantService } = await initializePlatform(
    {
      serviceId,
      displayName: 'Dashboard metrics',
      description: 'Put a description of the service here.',
      roles: [],
      events: [],
      values: [],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  passport.use('anonymous', new AnonymousStrategy());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.use('/dashboard', passport.authenticate('anonymous', { session: false }));

  const cache = {};
  let repository: MetricsRepository;
  if (environment.REDIS_PASSWORD) {
    repository = createRedisRepository(environment);
  } else {
    logger.warn('No Redis cache configured. Using in-memory cache for local development.');
    repository = {
      writeMetrics: function (key: string, metrics: Record<string, unknown>): Promise<boolean> {
        cache[key] = metrics;
        return Promise.resolve(true);
      },
      readMetrics: function (key: string): Promise<Record<string, unknown>> {
        return Promise.resolve(cache[key]);
      },
    };
  }

  applyMetricsMiddleware(app, {
    initializeJobs: environment.IS_JOB_POD,
    logger,
    directory,
    tokenProvider,
    tenantService,
    repository,
  });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json(platform);
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Dashboard metrics',
      description: 'Put a description of the service here.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/dashboard/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3400;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
