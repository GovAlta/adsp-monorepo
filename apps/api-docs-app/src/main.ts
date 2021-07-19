import * as express from 'express';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import { createLogger, UnauthorizedError, NotFoundError, InvalidOperationError } from '@core-services/core-common';
import { environment } from './environments/environment';
import path = require('path');
import { applyDocsMiddleware } from './docs';

const logger = createLogger('verify-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const { directory, tokenProvider, tenantService } = await initializePlatform(
    {
      serviceId,
      displayName: 'API Docs App',
      description: 'ADSP API documentation application.',
      roles: [],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  app.use('/assets', express.static(path.join(__dirname, 'assets')));
  await applyDocsMiddleware(app, { logger, accessServiceUrl, directory, tenantService, tokenProvider });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
  const port = environment.PORT || 3340;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
