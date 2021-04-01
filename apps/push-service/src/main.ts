import * as cors from 'cors';
import * as express from 'express';
import * as expressWs from 'express-ws';
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
} from '@core-services/core-common';
import { environment } from './environments/environment';
import { applyPushMiddleware } from './push';
import { createRepositories } from './mongo';

const logger = createLogger('push-service', environment.LOG_LEVEL || 'info');

const app = express();
const wsApp = expressWs(app, null, { leaveRouterUntouched: true });

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
app.use('/push-admin', passport.authenticate(['jwt'], { session: false }));
app.use('/stream', passport.authenticate(['jwt', 'anonymous'], { session: false }));

app.use('/stream', cors());

Promise.all([
  createRepositories({ ...environment, logger }),
  createAmqpEventService({ ...environment, queue: 'event-push', logger }),
]).then(([repositories, eventService]) => {
  app.get('/health', (req, res) =>
    res.json({
      db: repositories.isConnected(),
      msg: eventService.isConnected(),
    })
  );

  applyPushMiddleware(app, wsApp, {
    ...repositories,
    logger,
    eventService,
  });

  app.use((err, req, res, _next) => {
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

  const port = environment.PORT || 3333;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
