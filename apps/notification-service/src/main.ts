import {
  AdspId,
  initializePlatform,
  instrumentAxios,
  ServiceMetricsValueDefinition,
  User,
} from '@abgov/adsp-service-sdk';
import {
  createLogger,
  createAmqpEventService,
  createAmqpQueueService,
  createErrorHandler,
  createAmqpConfigUpdateService,
} from '@core-services/core-common';
import * as express from 'express';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { environment } from './environments/environment';
import {
  applyNotificationMiddleware,
  configurationSchema,
  NotificationConfiguration,
  NotificationGenerationFailedDefinition,
  NotificationSendFailedDefinition,
  NotificationSentDefinition,
  NotificationsGeneratedDefinition,
  NotificationType,
  NotificationWorkItem,
  ServiceUserRoles,
  SubscriberCreatedDefinition,
  SubscriberDeletedDefinition,
  SubscriberUpdatedDefinition,
  SubscriptionDeletedDefinition,
  SubscriptionSetDefinition,
} from './notification';
import { createRepositories } from './mongo';
import { initializeProviders } from './provider';
import { createTemplateService } from './handlebars';
import { createVerifyService } from './verify';
import { createFileService } from './file';

const logger = createLogger('notification-service', environment.LOG_LEVEL || 'info');

async function initializeApp() {
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
  const {
    coreStrategy,
    tenantStrategy,
    tenantHandler,
    tokenProvider,
    tenantService,
    configurationHandler,
    configurationService,
    clearCached,
    directory,
    eventService,
    healthCheck,
    metricsHandler,
    traceHandler,
  } = await initializePlatform(
    {
      displayName: 'Notification service',
      description: 'Service for subscription based notifications.',
      serviceId,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
      clientSecret: environment.CLIENT_SECRET,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      configuration: {
        description:
          'Notification types with configuration of subscriber role, available channels, trigger events, and templates.',
        schema: configurationSchema,
      },
      combineConfiguration: (
        tenantConfig: Record<string, NotificationType>,
        coreConfig: Record<string, NotificationType>,
        tenantId: AdspId
      ) => new NotificationConfiguration(logger, templateService, fileService, tenantConfig, coreConfig, tenantId),
      events: [
        NotificationsGeneratedDefinition,
        NotificationSentDefinition,
        NotificationSendFailedDefinition,
        NotificationGenerationFailedDefinition,
        SubscriberCreatedDefinition,
        SubscriberUpdatedDefinition,
        SubscriberDeletedDefinition,
        SubscriptionSetDefinition,
        SubscriptionDeletedDefinition,
      ],
      roles: [
        {
          role: ServiceUserRoles.SubscriptionAdmin,
          description: 'Administrator role for managing subscriptions',
          inTenantAdmin: true,
        },
        {
          role: ServiceUserRoles.SubscriptionApp,
          description: 'Role for service accounts that allows update of subscribers and subscriptions.',
        },
        {
          role: ServiceUserRoles.CodeSender,
          description: 'Role for sending and checking verify codes to subscribers',
        },
      ],
      values: [ServiceMetricsValueDefinition],
      useLongConfigurationCacheTTL: true,
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
  app.use(traceHandler);

  app.use(
    '/subscription',
    metricsHandler,
    passport.authenticate(['core', 'tenant'], { session: false }),
    tenantHandler,
    configurationHandler
  );

  const { botRepository, ...repositories } = await createRepositories({ ...environment, logger });

  const eventSubscriber = await createAmqpEventService({
    ...environment,
    queue: 'event-notification',
    logger,
  });

  const queueService = await createAmqpQueueService<NotificationWorkItem>({
    ...environment,
    queue: 'notification-send',
    logger,
    consumerOptions: { priority: environment.AMQP_CONSUMER_PRIORITY },
  });

  const configurationSync = await createAmqpConfigUpdateService({
    ...environment,
    logger,
  });

  configurationSync.getItems().subscribe(({ item, done }) => {
    clearCached(item.tenantId, item.serviceId);
    done();
  });

  const templateService = createTemplateService();
  const fileService = createFileService(directory, tokenProvider);
  const providers = initializeProviders(logger, app, botRepository, environment);

  const verifyService = createVerifyService({
    providers,
    templateService,
    directory,
    tokenProvider,
  });

  applyNotificationMiddleware(app, {
    ...repositories,
    serviceId,
    logger,
    tokenProvider,
    configurationService,
    directory,
    eventService,
    tenantService,
    eventSubscriber,
    queueService,
    verifyService,
    providers,
  });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
      db: repositories.isConnected(),
      msg: eventSubscriber.isConnected(),
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Notification service',
      description: 'Service for subscription based notifications.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/subscription/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
}

initializeApp().then((app) => {
  const port = environment.PORT || 3335;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
