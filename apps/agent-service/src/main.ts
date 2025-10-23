import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler, UnauthorizedError } from '@core-services/core-common';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { readFile } from 'fs';
import * as helmet from 'helmet';
import { createServer, Server } from 'http';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { Server as IoServer, Socket } from 'socket.io';
import { promisify } from 'util';
import { environment } from './environments/environment';
import { applyAgentMiddleware, ServiceRoles } from './agent';
import { fromSocketHandshake, REQ_SOCKET_PROP } from './socket';

const logger = createLogger('agent-service', environment.LOG_LEVEL);

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
    coreStrategy,
    tenantStrategy,
    directory,
    tokenProvider,
    tenantService,
    configurationHandler,
    healthCheck,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Agent service',
      description: 'Service for AI agents.',
      roles: [
        {
          role: ServiceRoles.AgentUser,
          description: 'Role for users with access to agents.',
          inTenantAdmin: true,
        },
        {
          role: ServiceRoles.AgentTool,
          description:
            'Agent tool role assigned to agent service service account. Used to grant resource access to agent tools.',
        },
      ],
      events: [],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      additionalExtractors: [fromSocketHandshake],
    },
    { logger }
  );

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);
  passport.use(new AnonymousStrategy());
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.use('/agent', passport.authenticate(['core', 'tenant'], { session: false }));

  const ioServer = new IoServer(server, {
    serveClient: false,
    cors: {
      credentials: true,
      origin: true,
    },
  });

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
  defaultIo.use(wrapForIo(passport.authenticate(['core', 'tenant'], { session: false })));
  defaultIo.use(wrapForIo(configurationHandler));

  // Connections on namespace correspond to tenants.
  const io = ioServer.of(/^\/[a-zA-Z0-9- ]+$/);
  io.use(wrapForIo(passport.initialize()));
  io.use(wrapForIo(passport.authenticate(['core', 'tenant', 'anonymous'], { session: false })));
  io.use(wrapForIo(configurationHandler));

  await applyAgentMiddleware(app, [defaultIo, io], { logger, directory, tokenProvider, tenantService });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json(platform);
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Agent service',
      description: 'Put a description of the service here.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/agent/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return server;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3380;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
