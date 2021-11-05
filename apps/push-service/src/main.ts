import { AdspId, initializePlatform, User } from '@abgov/adsp-service-sdk';
import { createLogger, createAmqpConfigUpdateService, createErrorHandler } from '@core-services/core-common';
import { createAdapter as createIoAdapter } from '@socket.io/redis-adapter';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as helmet from 'helmet';
import { createServer, Server } from 'http';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { createClient as createRedisClient } from 'redis';
import { Server as IoServer, Socket } from 'socket.io';
import { createAmqpEventService } from './amqp';
import { environment } from './environments/environment';
import { applyPushMiddleware, configurationSchema, PushServiceRoles, Stream, StreamEntity } from './push';

const logger = createLogger('push-service', environment.LOG_LEVEL || 'info');

const initializeApp = async (): Promise<Server> => {
  const app = express();
  const server = createServer(app);

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
      roles: [
        {
          role: PushServiceRoles.StreamListener,
          description: 'Role used to allow an account to listen to all streams.',
          inTenantAdmin: true,
        },
      ],
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

  const ioServer = new IoServer(server, {
    serveClient: false,
    cors: {
      credentials: true,
      origin: true,
    },
  });
  ioServer.adapter(createIoAdapter(redisClient, redisClient.duplicate()));

  // No connection on default namespace.
  ioServer.of('/').on('connection', async (socket) => socket.disconnect(true));

  // Connections on namespace correspond to tenants.
  const io = ioServer.of(/^\/[a-z0-9]{24}$/);

  const wrapForIo = (handler: express.RequestHandler) => (socket: Socket, next) =>
    handler(socket.request as express.Request, {} as express.Response, next);

  io.use(wrapForIo(passport.initialize()));
  io.use(wrapForIo(passport.authenticate(['jwt', 'anonymous'])));
  io.use(wrapForIo(configurationHandler));

  const eventService = await createAmqpEventService({ ...environment, logger });

  applyPushMiddleware(app, io, { logger, eventService });

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
