import { AdspId, ServiceMetricsValueDefinition, initializePlatform, instrumentAxios } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as helmet from 'helmet';
import * as passport from 'passport';
import { createClient } from 'redis';

import { environment } from './environments/environment';
import { ServiceRoles, applyGatewayMiddleware } from './gateway';
import { configurePassport } from './access';
import { createAddressRouter } from './address';

const logger = createLogger('form-gateway', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  instrumentAxios(logger);

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);

  const redisClient = environment.REDIS_HOST
    ? createClient({
        host: environment.REDIS_HOST,
        port: environment.REDIS_PORT,
        password: environment.REDIS_PASSWORD,
      })
    : null;

  const {
    directory,
    healthCheck,
    metricsHandler,
    tenantHandler,
    tenantService,
    tenantStrategy,
    tokenProvider,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Form gateway',
      description: 'Gateway to provide anonymous and session access to some form functionality.',
      roles: [
        {
          role: ServiceRoles.Applicant,
          description: 'Applicant role that allows users to complete form applications via the gateway.',
        },
      ],
      values: [ServiceMetricsValueDefinition],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  configurePassport(app, passport, { sessionSecret: environment.SESSION_SECRET, redisClient, tenantStrategy });

  app.use(metricsHandler);
  app.use(traceHandler);

  app.use('/gateway', passport.authenticate(['tenant', 'session', 'anonymous'], { session: false }), tenantHandler);
  await applyGatewayMiddleware(app, {
    logger,
    directory,
    tokenProvider,
    tenantService,
    RECAPTCHA_SECRET: environment.RECAPTCHA_SECRET,
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json(platform);
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Form gateway',
      description: 'Gateway to provide anonymous and session access to some form functionality.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/gateway/v1', rootUrl).href },
      },
    });
  });
  const addressRouter = createAddressRouter({
    environment,
    logger,
  });
  app.use('/gateway/v1/address/v1', addressRouter);
  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3348;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
