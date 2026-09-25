import { createErrorHandler, createLogger } from '@core-services/core-common';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { readFile } from 'fs';
import * as helmet from 'helmet';
import { promisify } from 'util';
import { environment } from './environments/environment';
import { applyReportsMiddleware } from './reports';

const logger = createLogger('tenant-management-gateway', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(cors());
  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  applyReportsMiddleware(app, {
    logger,
    valueServiceUrl: environment.VALUE_SERVICE_URL,
  });

  app.get('/health', async (_req, res) => {
    res.json({ healthy: true });
  });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Tenant management gateway',
      description: 'BFF for tenant-facing APIs including service usage reports.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/api/tenant/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  app.use(createErrorHandler(logger));

  return app;
};

initializeApp()
  .then((app) => {
    const port = environment.PORT;
    const server = app.listen(port, () => {
      logger.info(`Tenant management gateway listening at http://localhost:${port}`);
    });
    server.on('error', (err) => {
      logger.error(`Error starting server: ${err}`);
    });
  })
  .catch((err) => {
    logger.error(`Error initializing tenant management gateway: ${err}`);
  });
