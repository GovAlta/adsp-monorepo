import * as express from 'express';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import {
  createLogger,
  createKeycloakStrategy,
  createAmqpEventService,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
  createAmqpQueueService,
  EventServiceClient,
  getKeycloakTokenRequestProps,
} from '@core-services/core-common';
import { environment } from './environments/environment';
import {
  applyNotificationMiddleware,
  Channel,
  Notification,
} from './notification';
import { createRepositories } from './mongo';
import { createABNotifySmsProvider, createGoAEmailProvider } from './provider';
import { templateService } from './handlebars';

const logger = createLogger(
  'notification-service',
  environment.LOG_LEVEL || 'info'
);

const app = express();

app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

passport.use('jwt', createKeycloakStrategy());
passport.use(new AnonymousStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(passport.initialize());
app.use('/space', passport.authenticate(['jwt'], { session: false }));
app.use(
  '/notification-admin',
  passport.authenticate(['jwt'], { session: false })
);
app.use(
  '/subscription',
  passport.authenticate(['jwt', 'anonymous'], { session: false })
);

Promise.all([
  createRepositories({ ...environment, logger }),
  createAmqpEventService({
    ...environment,
    queue: 'event-notification',
    logger,
  }),
  createAmqpQueueService<Notification>({
    ...environment,
    queue: 'notification-send',
    logger,
  }),
]).then(([repositories, eventSubscriber, queueService]) => {
  app.get('/health', (req, res) =>
    res.json({
      db: repositories.isConnected(),
      msg: eventSubscriber.isConnected(),
    })
  );

  applyNotificationMiddleware(app, {
    ...repositories,
    logger,
    templateService,
    eventService: new EventServiceClient(
      logger,
      getKeycloakTokenRequestProps(environment),
      environment.EVENT_SERVICE_URL
    ),
    eventSubscriber,
    queueService,
    providers: {
      [Channel.email]: createGoAEmailProvider(environment),
      [Channel.sms]: createABNotifySmsProvider(environment),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const port = environment.PORT || 3335;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) =>
    logger.error(`Error encountered in server: ${err}`)
  );
});
