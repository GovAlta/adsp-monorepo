import { AdspId, initializePlatform, User } from '@abgov/adsp-service-sdk';
import {
  createLogger,
  createAmqpConfigUpdateService,
  createErrorHandler,
  UnauthorizedError,
} from '@core-services/core-common';
import { createAdapter as createIoAdapter } from '@socket.io/redis-adapter';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { readFile } from 'fs';
import * as helmet from 'helmet';
import { createServer, Server } from 'http';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { createClient as createRedisClient } from 'redis';
import { Server as IoServer, Socket } from 'socket.io';
import { promisify } from 'util';
import { createAmqpEventService } from './amqp';
import { createAmqpEventService as createAmqpEventServiceWebhooks } from '@core-services/core-common';
import { environment } from './environments/environment';
import {
  applyPushMiddleware,
  AppStatusWebhookEntity,
  configurationSchema,
  isAppStatusWebhook,
  PushServiceConfiguration,
  PushServiceRoles,
  Stream,
  StreamEntity,
  Webhook,
  WebhookEntity,
  WebhookTriggeredDefinition,
} from './push';
import { fromSocketHandshake, REQ_SOCKET_PROP } from './socket';

const logger = createLogger('push-service', environment.LOG_LEVEL || 'info');

const initializeApp = async (): Promise<Server> => {
  const app = express();
  const server = createServer(app);

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    tenantService,
    tenantStrategy,
    coreStrategy,
    configurationHandler,
    clearCached,
    healthCheck,
    configurationService,
    directory,
    tokenProvider,
    eventService,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Push service',
      description: 'Service for push mode connections.',
      roles: [
        {
          role: PushServiceRoles.StreamListener,
          description: 'Role used to allow an account to listen to all streams.',
          inTenantAdmin: true,
        },
      ],
      configuration: {
        description: 'Streams available by websocket with configuration of the included events.',
        schema: configurationSchema,
      },
      combineConfiguration: (tenant: PushServiceConfiguration, core: PushServiceConfiguration, tenantId) =>
        Object.entries({ ...tenant, ...core }).reduce((c, [k, s]) => {
          return k === 'webhooks'
            ? {
                ...c,
                webhooks: Object.entries(s as Record<string, Webhook>)
                  .filter(([_hk, hv]) => hv)
                  .reduce(
                    (hs, [hk, hv]) => ({
                      ...hs,
                      [hk]: isAppStatusWebhook(hv)
                        ? new AppStatusWebhookEntity(logger, hv)
                        : new WebhookEntity(logger, hv),
                    }),
                    {} as Record<string, WebhookEntity>
                  ),
              }
            : { ...c, [k]: new StreamEntity(logger, tenantId, s as Stream) };
        }, {}),
      events: [WebhookTriggeredDefinition],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      additionalExtractors: [fromSocketHandshake]
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
  passport.use('core', coreStrategy);
  passport.use(new AnonymousStrategy());
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.use('/stream', passport.authenticate(['core', 'jwt', 'anonymous'], { session: false }), configurationHandler);

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

  const wrapForIo = (handler: express.RequestHandler) => (socket: Socket, next) => {
    const request = socket.request as express.Request;
    request[REQ_SOCKET_PROP] = socket;

    handler(
      request,
      {
        // Passport JS calls end w/ 401 when all authenticators fail.
        end: () => next(new UnauthorizedError('User not authorized to connect.')),
      } as unknown as express.Response,
      next
    );
  };

  // Connections on default namespace for cross-tenant.
  const defaultIo = ioServer.of('/');
  defaultIo.use(wrapForIo(passport.initialize()));
  defaultIo.use(wrapForIo(passport.authenticate(['core', 'jwt'], { session: false })));
  defaultIo.use(wrapForIo(configurationHandler));

  // Connections on namespace correspond to tenants.
  const io = ioServer.of(/^\/[a-zA-Z0-9- ]+$/);
  io.use(wrapForIo(passport.initialize()));
  io.use(wrapForIo(passport.authenticate(['core', 'jwt', 'anonymous'], { session: false })));
  io.use(wrapForIo(configurationHandler));

  const eventServiceAmp = await createAmqpEventService({ ...environment, logger });

  const eventServiceAmpWebhooks = await createAmqpEventServiceWebhooks({
    ...environment,
    queue: 'webhooks',
    logger,
  });

  applyPushMiddleware(app, [defaultIo, io], {
    logger,
    eventServiceAmp,
    eventServiceAmpWebhooks,
    tenantService,
    configurationService,
    directory,
    tokenProvider,
    eventService,
    serviceId,
  });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
      msg: eventServiceAmp.isConnected(),
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Push service',
      description: 'Service for push mode connections.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/stream/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
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
