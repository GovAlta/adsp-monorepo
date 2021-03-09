import * as express from 'express';
import * as passport from 'passport';
import * as compression from 'compression';
import * as helmet from 'helmet';
import {
  createLogger,
  createKeycloakStrategy,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
  ValueServiceClient,
  getKeycloakTokenRequestProps,
} from '@core-services/core-common';
import { environment } from './environments/environment';
import { createEventService } from './amqp';
import { applyEventMiddleware } from './event';
import { createRepositories } from './mongo';

const logger = createLogger('event-service', environment.LOG_LEVEL || 'info');

const app = express();

app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

passport.use('jwt', createKeycloakStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(passport.initialize());
app.use('/namespace', passport.authenticate(['jwt'], { session: false }));
app.use('/event-admin', passport.authenticate(['jwt'], { session: false }));
app.use('/event', passport.authenticate(['jwt'], { session: false }));

Promise.all([
  createRepositories({ ...environment, logger }),
  createEventService({ ...environment, logger }),
]).then(([repositories, eventService]) => {
  app.get('/health', (_req, res) =>
    res.json({
      db: repositories.isConnected(),
      msg: eventService.isConnected(),
    })
  );

  applyEventMiddleware(app, {
    ...repositories,
    logger,
    eventService,
    valueService: new ValueServiceClient(
      logger,
      getKeycloakTokenRequestProps(environment),
      environment.VALUE_SERVICE_URL
    ),
    events: eventService.getEvents(),
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

  const port = environment.PORT || 3334;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) =>
    logger.error(`Error encountered in server: ${err}`)
  );
});
