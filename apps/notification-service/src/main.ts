import * as express from 'express';
import * as passport from 'passport';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { AdspId, initializePlatform, User } from '@abgov/adsp-service-sdk';
import {
  createLogger,
  createAmqpEventService,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
  createAmqpQueueService,
} from '@core-services/core-common';
import { environment } from './environments/environment';
import { applyNotificationMiddleware, Channel, Notification, NotificationType, ServiceUserRoles } from './notification';
import { createRepositories } from './mongo';
import { createABNotifySmsProvider, createEmailProvider } from './provider';
import { templateService } from './handlebars';
import { NotificationConfiguration } from './notification/configuration';

const logger = createLogger('notification-service', environment.LOG_LEVEL || 'info');

async function initializeApp() {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const {
    tenantStrategy,
    tenantHandler,
    tokenProvider,
    configurationHandler,
    configurationService,
    healthCheck,
  } = await initializePlatform(
    {
      displayName: 'Notification Service',
      description: 'Service for subscription based notifications.',
      serviceId,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
      clientSecret: environment.CLIENT_SECRET,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      configurationConverter: (config: Record<string, NotificationType>, tenantId?: AdspId) =>
        new NotificationConfiguration(config, tenantId),
      events: [
        {
          name: 'notification-sent',
          description: 'Signalled when a notification is sent.',
          payloadSchema: {},
        },
      ],
      roles: [
        {
          role: ServiceUserRoles.SubscriptionAdmin,
          description: 'Administrator role for managing subscriptions',
          inTenantAdmin: true,
        },
      ],
    },
    { logger }
  );

  passport.use('jwt', tenantStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use('/subscription', passport.authenticate(['jwt'], { session: false }), tenantHandler, configurationHandler);

  const repositories = await createRepositories({ ...environment, logger });

  const eventSubscriber = await createAmqpEventService({
    ...environment,
    queue: 'event-notification',
    logger,
  });

  const queueService = await createAmqpQueueService<Notification>({
    ...environment,
    queue: 'notification-send',
    logger,
  });

  applyNotificationMiddleware(app, {
    ...repositories,
    serviceId,
    logger,
    tokenProvider,
    configurationService,
    templateService,
    eventSubscriber,
    queueService,
    providers: {
      [Channel.email]: createEmailProvider(environment),
      [Channel.sms]: createABNotifySmsProvider(environment),
    },
  });

  app.get('/health', async (req, res) => {
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
      _links: {
        self: new URL(req.originalUrl, rootUrl).href,
        health: new URL('/health', rootUrl).href,
        api: new URL('/subscription/v1', rootUrl).href,
        doc: new URL('/swagger/docs/v1', rootUrl).href,
      },
    });
  });

  app.use((err, _req, res, _next) => {
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
}

initializeApp().then((app) => {
  const port = environment.PORT || 3335;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
