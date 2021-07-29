import * as cors from 'cors';
import * as express from 'express';
import * as expressWs from 'express-ws';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import {
  createLogger,
  createAmqpEventService,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
} from '@core-services/core-common';
import { environment } from './environments/environment';
import { applyPushMiddleware, Stream, StreamEntity } from './push';
import { AdspId, initializePlatform, User } from '@abgov/adsp-service-sdk';

const logger = createLogger('push-service', environment.LOG_LEVEL || 'info');

const initializeApp = async (): Promise<express.Application> => {
  const app = express();
  const wsApp = expressWs(app, null, { leaveRouterUntouched: true });

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const { tenantStrategy, configurationHandler, healthCheck } = await initializePlatform(
    {
      serviceId,
      displayName: 'Push Service',
      description: 'Service for push mode connections.',
      roles: [],
      configurationConverter: (config: Record<string, Stream>): Record<string, StreamEntity> =>
        config ? Object.entries(config).reduce((c, [k, s]) => ({ ...c, [k]: new StreamEntity(s) }), {}) : null,
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  passport.use('jwt', tenantStrategy);
  passport.use(new AnonymousStrategy());
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });
  app.use(passport.initialize());

  app.use('/stream', passport.authenticate(['jwt', 'anonymous'], { session: false }), configurationHandler);
  const eventService = await createAmqpEventService({ ...environment, queue: 'event-push', logger });

  applyPushMiddleware(app, wsApp, { logger, eventService });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
      msg: eventService.isConnected(),
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      _links: {
        self: new URL(req.originalUrl, rootUrl).href,
        health: new URL('/health', rootUrl).href,
        api: new URL('/stream/v1', rootUrl).href,
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
};

initializeApp().then((app) => {
  const port = environment.PORT || 3333;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
