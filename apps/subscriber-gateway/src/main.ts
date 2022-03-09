import * as express from 'express';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createSubscriberRouter } from './subscriber/router';
import { createConfigurationRouter } from './configuration/router';

const logger = createLogger('subscriber-gateway', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const { directory, tenantService, tokenProvider, healthCheck } = await initializePlatform(
    {
      serviceId,
      displayName: 'Subscriber gateway',
      description: 'Gateway to provide anonymous access to some subscription functionality.',
      roles: [],
      events: [],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  const subscriberRouter = createSubscriberRouter({ ...environment, logger, directory, tenantService, tokenProvider });
  const configurationRouter = createConfigurationRouter({
    ...environment,
    directory,
    tenantService,
    tokenProvider,
  });
  app.use('/subscriber/v1', subscriberRouter);
  app.use('/configuration/v1', configurationRouter);

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json(platform);
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      _links: {
        self: new URL(req.originalUrl, rootUrl).href,
        health: new URL('/health', rootUrl).href,
        subscriber: new URL('/subscriber/v1', rootUrl).href,
        configuration: new URL('/configuration/v1', rootUrl).href,
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3344;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
