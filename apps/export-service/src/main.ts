import { AdspId, initializePlatform, instrumentAxios } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler, createAmqpQueueService } from '@core-services/core-common';
import { createFileService, createJobRepository, FileResult } from '@core-services/job-common';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { readFile } from 'fs';
import * as helmet from 'helmet';
import * as passport from 'passport';
import { promisify } from 'util';
import { environment } from './environments/environment';
import {
  applyExportMiddleware,
  ExportCompletedDefinition,
  ExportFailedDefinition,
  ExportFileType,
  ExportGenerationUpdatesStream,
  ExportQueuedDefinition,
  ExportServiceWorkItem,
  ServiceRoles,
} from './export';

const logger = createLogger('export-service', environment.LOG_LEVEL);

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
  const {
    coreStrategy,
    tenantStrategy,
    directory,
    tokenProvider,
    eventService,
    healthCheck,
    tenantHandler,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Export service',
      description: 'Export service provides exports of resources to files using jobs.',
      roles: [
        {
          role: ServiceRoles.Exporter,
          description: 'Exporter role that allows creation of export jobs.',
          inTenantAdmin: true,
        },
        {
          role: ServiceRoles.ExportJob,
          description: 'Export job role assigned to the export service service account.',
        },
      ],
      events: [ExportQueuedDefinition, ExportCompletedDefinition, ExportFailedDefinition],
      eventStreams: [ExportGenerationUpdatesStream],
      fileTypes: [ExportFileType],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.use('/export', passport.authenticate(['core', 'tenant'], { session: false }), tenantHandler);

  const { repository, ...repositories } = createJobRepository<FileResult>({ logger, ...environment });
  const queueService = await createAmqpQueueService<ExportServiceWorkItem>({
    logger,
    queue: 'export-service-work',
    ...environment,
  });
  const fileService = createFileService({ logger, tokenProvider, directory });

  applyExportMiddleware(app, {
    serviceId,
    logger,
    directory,
    tokenProvider,
    eventService,
    repository,
    queueService,
    fileService,
  });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({ ...platform, repository: repositories.isConnected() });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Export service',
      description: 'Export service provides exports of resources to files using jobs.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/export/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

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
