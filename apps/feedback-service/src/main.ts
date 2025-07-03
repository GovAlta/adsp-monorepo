import { AdspId, ServiceMetricsValueDefinition, initializePlatform, instrumentAxios } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import { readFile } from 'fs/promises';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { environment } from './environments/environment';
import { createFeedbackQueueService } from './amqp';
import {
  ServiceRoles,
  FeedbackValueDefinition,
  applyFeedbackMiddleware,
  configurationSchema,
  combineConfiguration,
} from './feedback';
import { createPiiService } from './pii';
import { createValueService } from './value';

const logger = createLogger('feedback-service', environment.LOG_LEVEL);

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
    configurationHandler,
    directory,
    tenantHandler,
    tenantService,
    tenantStrategy,
    tokenProvider,
    healthCheck,
    metricsHandler,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Feedback service',
      description: 'Feedback service allows users to submit feedback regarding a service interaction.',
      configuration: {
        schema: configurationSchema,
        description: 'Sites and associated configuration of the supported context for feedback.',
      },
      combineConfiguration,
      enableConfigurationInvalidation: true,
      useLongConfigurationCacheTTL: true,
      roles: [
        {
          role: ServiceRoles.FeedbackProvider,
          description: 'Provider role that allows user to send feedback.',
        },
        {
          role: ServiceRoles.FeedbackReader,
          description: 'Allows user to access feedback submitted by end-users.',
        },
      ],
      values: [FeedbackValueDefinition, ServiceMetricsValueDefinition],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  passport.use('tenant', tenantStrategy);
  passport.use('anonymous', new AnonymousStrategy());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());

  app.use(metricsHandler);
  app.use(traceHandler);

  app.use(
    '/feedback',
    passport.authenticate(['tenant', 'anonymous'], { session: false }),
    tenantHandler,
    configurationHandler
  );

  const queueService = await createFeedbackQueueService({ ...environment, logger });
  const piiService = createPiiService({ logger, directory, tokenProvider });
  const valueService = createValueService({ logger, directory, tokenProvider });
  await applyFeedbackMiddleware(app, { logger, queueService, piiService, tenantService, valueService });

  const swagger = JSON.parse(await readFile(`${__dirname}/swagger.json`, 'utf8'));
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
      name: 'Feedback service',
      description: 'Put a description of the service here.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/feedback/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3342;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
