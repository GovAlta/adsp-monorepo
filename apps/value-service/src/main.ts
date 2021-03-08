import * as express from 'express';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import {
  UnauthorizedError,
  NotFoundError,
  createKeycloakStrategy,
  InvalidOperationError,
} from '@core-services/core-common';
import { environment } from './environments/environment';
import { logger } from './logger';
import { applyValuesMiddleware } from './values';
import { createRepositories } from './timescale';

const app = express();

app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

passport.use('jwt', createKeycloakStrategy());
passport.use(new AnonymousStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(passport.initialize());
app.use(passport.authenticate(['jwt', 'anonymous'], { session: false }));

createRepositories(environment).then((repositories) => {
  applyValuesMiddleware(app, repositories);

  app.use((err: Error, req, res, next) => {
    if (err instanceof UnauthorizedError) {
      res.send(err.message).status(401);
    } else if (err instanceof NotFoundError) {
      res.send(err.message).status(404);
    } else if (err instanceof InvalidOperationError) {
      res.send(err.message).status(400);
    } else {
      logger.warn(`Unexpected error encountered in handler: ${err}`);
      res.sendStatus(500);
      next(err);
    }
  });

  const port = process.env.PORT || 3336;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) =>
    logger.error(`Error encountered in server: ${err}`)
  );
});
