import { AdspId, initializePlatform, User } from '@abgov/adsp-service-sdk';
import {
  createLogger,
  createAmqpEventService,
  createAmqpConfigUpdateService,
  createErrorHandler,
} from '@core-services/core-common';
import * as compression from 'compression';
import * as createRedisStore from 'connect-redis';
import * as cors from 'cors';
import * as express from 'express';
import * as session from 'express-session';
import * as expressWs from 'express-ws';
import * as helmet from 'helmet';
import { createServer, Server } from 'http';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { createClient as createRedisClient } from 'redis';
import { Server as IoServer } from 'socket.io';
import { environment } from './environments/environment';
import { applyPushMiddleware, configurationSchema, Stream, StreamEntity } from './push';

const logger = createLogger('push-service', environment.LOG_LEVEL || 'info');

const initializeApp = async (): Promise<Server> => {
  const app = express();
  const server = createServer(app);
  const ioServer = new IoServer(server, { path: '/socket.io/v1', serveClient: false, cors: {} });
  const wsApp = expressWs(app, null, { leaveRouterUntouched: true });

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const { tenantStrategy, configurationHandler, clearCached, healthCheck } = await initializePlatform(
    {
      serviceId,
      displayName: 'Push Service',
      description: 'Service for push mode connections.',
      roles: [],
      configurationSchema,
      configurationConverter: (config: Record<string, Stream>, tenantId): Record<string, StreamEntity> =>
        config
          ? Object.entries(config).reduce((c, [k, s]) => ({ ...c, [k]: new StreamEntity(tenantId, s) }), {})
          : null,
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      accessTokenInQuery: true,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  const configurationSync = await createAmqpConfigUpdateService({
    ...environment,
    logger,
  });

  configurationSync.getItems().subscribe(({ item, done }) => {
    clearCached(item.tenantId, item.serviceId);
    done();
  });

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

  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = environment;
  const credentials = REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : '';
  const redisClient = createRedisClient(`redis://${credentials}${REDIS_HOST}:${REDIS_PORT}/0`);
  const RedisStore = createRedisStore(session);

  ioServer.use((socket, next) =>
    session({
      store: new RedisStore({ client: redisClient }),
      saveUninitialized: false,
      secret: environment.SESSION_SECRET,
      resave: false,
    })(socket.request as express.Request, {} as express.Response, next as express.NextFunction)
  );
  ioServer.use((socket, next) =>
    passport.initialize()(socket.request as express.Request, {} as express.Response, next as express.NextFunction)
  );
  ioServer.use((socket, next) => passport.authenticate(['session', 'jwt', 'anonymous'])(socket.request, {}, next));
  ioServer.use((socket, next) =>
    configurationHandler(socket.request as express.Request, {} as express.Response, next as express.NextFunction)
  );

  const eventService = await createAmqpEventService({ ...environment, queue: 'event-push', logger });

  applyPushMiddleware(app, wsApp, ioServer, { logger, eventService });

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
