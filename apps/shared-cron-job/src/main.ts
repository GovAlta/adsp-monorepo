import { AdspId, initializePlatform, User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer, Server } from 'http';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { environment } from './environments/environment';
import { CronJobServiceRoles, applyCronJobMiddleware, configurationSchema, CronJobServiceImpl } from './cron-job';
import { CronJobTriggeredEventDefinition } from './events';
const logger = createLogger('cron-job-service', environment.LOG_LEVEL || 'info');

const initializeApp = async (): Promise<Server> => {
  const app = express();
  const server = createServer(app);

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    tenantService,
    tenantStrategy,
    coreStrategy,
    configurationHandler,
    healthCheck,
    configurationService,
    directory,
    tokenProvider,
    eventService,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Cron job service',
      description: 'Service for cron job.',
      roles: [
        {
          role: CronJobServiceRoles.CronJobAdmin,
          description: 'Role used to manage the tenant level cron job',
          inTenantAdmin: true,
        },
      ],
      events: [CronJobTriggeredEventDefinition],
      configuration: {
        description: 'Configuration for the ',
        schema: configurationSchema,
      },
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger },
  );

  const cronJobService = new CronJobServiceImpl(
    configurationService,
    tenantService,
    serviceId,
    tokenProvider,
    eventService,
    logger,
  );
  await cronJobService.load();

  passport.use('jwt', tenantStrategy);
  passport.use('core', coreStrategy);
  passport.use(new AnonymousStrategy());
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.use('/cron-job', passport.authenticate(['core', 'jwt', 'anonymous'], { session: false }), configurationHandler);

  applyCronJobMiddleware(app, {
    logger,
    tenantService,
    configurationService,
    tokenProvider,
    eventService,
    serviceId,
    directory,
    cronJobService,
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
    });
  });

  app.get('/', async (req, res) => {
    res.json({
      name: 'Cron job service',
      description: 'Service for cron job',
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return server;
};

initializeApp().then((server) => {
  const port = environment.PORT || 3333;
  server.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
