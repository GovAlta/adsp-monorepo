import * as express from 'express';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import {
  createLogger,
  createKeycloakStrategy,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
  DomainEventService
} from '@core-services/core-common';
import { environment } from './environments/environment';
import { applyConfigMiddleware } from './configuration';
import { createRepositories } from './mongo';
import { createEventService } from './amqp';

const logger = createLogger(
  'file-service',
  environment.LOG_LEVEL || 'info'
);

const app = express();

app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

passport.use('jwt', createKeycloakStrategy(environment));
passport.use(new AnonymousStrategy());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(passport.initialize());
app.use('/space', passport.authenticate(['jwt'], { session: false }));
app.use('/file-admin', passport.authenticate(['jwt'], { session: false }));
app.use('/file', passport.authenticate(['jwt', 'anonymous'], { session: false }));

Promise.all([
  createRepositories({...environment, logger}),
  (
    environment.AMQP_HOST ?
      createEventService({...environment, logger}) :
      Promise.resolve<DomainEventService>({
        send: (event) => logger.debug(
          `Event sink received event '${event.namespace}:${event.name}'`
        ),
        isConnected: () => true
      })
  )
]).then(([repositories, eventService]) => {

  applyConfigMiddleware(app, {
    logger,
    rootStoragePath: environment.FILE_PATH,
    avProvider: environment.AV_PROVIDER,
    avHost: environment.AV_HOST,
    avPort: environment.AV_PORT,
    eventService,
    ...repositories
  });

  app.get(
    '/health',
    (req, res) => res.json({
      db: repositories.isConnected(),
      msg: eventService.isConnected()
    })
  );

  /*eslint-disable */
  app.use((err, req, res, next) => {
    /*eslint-enable */
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

  const port = environment.PORT || 3337;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error',
    (err) => logger.error(`Error encountered in server: ${err}`));
});
