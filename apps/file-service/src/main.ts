import * as express from 'express';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { createLogger, createErrorHandler, createAmqpConfigUpdateService } from '@core-services/core-common';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import { environment } from './environments/environment';
import {
  applyFileMiddleware,
  configurationSchema,
  FileDeletedDefinition,
  FileType,
  FileTypeEntity,
  FileUploadedDefinition,
  ServiceUserRoles,
} from './file';
import { createRepositories } from './mongo';
import * as cors from 'cors';
import * as fs from 'fs';
import type { User } from '@abgov/adsp-service-sdk';
import { FileSystemStorageProvider } from './storage/file-system';
import { createScanService } from './scan';
import { AzureBlobStorageProvider } from './storage';
import { createFileQueueService } from './amqp';

const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');

async function initializeApp(): Promise<express.Application> {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    coreStrategy,
    tenantStrategy,
    tenantHandler,
    tokenProvider,
    configurationHandler,
    configurationService,
    clearCached,
    healthCheck,
    eventService,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'File service',
      description: 'Service for upload and download of files.',
      roles: [
        {
          role: ServiceUserRoles.Admin,
          description: 'Administrator role for the file service.',
          inTenantAdmin: true,
        },
      ],
      configurationSchema,
      configurationConverter: (configuration: Record<string, FileType>, tenantId: AdspId) =>
        Object.entries(configuration).reduce(
          (types, [id, type]) => ({ ...types, [id]: new FileTypeEntity({ ...type, tenantId }) }),
          {}
        ),
      events: [FileUploadedDefinition, FileDeletedDefinition],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  passport.use('jwt', tenantStrategy);
  passport.use('jwt-core', coreStrategy);
  passport.use(new AnonymousStrategy());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());

  app.use(
    '/file',
    passport.authenticate(['jwt-core', 'jwt', 'anonymous'], { session: false }),
    tenantHandler,
    configurationHandler
  );

  const storageProvider =
    environment.STORAGE_PROVIDER === 'blob'
      ? new AzureBlobStorageProvider(logger, environment)
      : new FileSystemStorageProvider(logger, environment.FILE_PATH);

  const repositories = await createRepositories({
    ...environment,
    serviceId,
    logger,
    tokenProvider,
    configurationService,
    storageProvider,
  });

  const scanService = createScanService(environment.AV_PROVIDER, {
    host: environment.AV_HOST,
    port: environment.AV_PORT,
  });

  const queueService = await createFileQueueService({ ...environment, logger });

  const configurationSync = await createAmqpConfigUpdateService({
    ...environment,
    logger,
  });

  configurationSync.getItems().subscribe(({ item, done }) => {
    clearCached(item.tenantId, item.serviceId);
    done();
  });

  applyFileMiddleware(app, {
    serviceId,
    logger,
    storageProvider,
    scanService,
    eventService,
    queueService,
    ...repositories,
  });

  let swagger = null;
  app.use('/swagger/docs/v1', (_req, res) => {
    if (swagger) {
      res.json(swagger);
    } else {
      fs.readFile(`${__dirname}/swagger.json`, 'utf8', (err, data) => {
        if (err) {
          res.sendStatus(404);
        } else {
          swagger = JSON.parse(data);
          res.json(swagger);
        }
      });
    }
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
      db: repositories.isConnected(),
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      _links: {
        self: new URL(req.originalUrl, rootUrl).href,
        health: new URL('/health', rootUrl).href,
        api: new URL('/file/v1', rootUrl).href,
        doc: new URL('/swagger/docs/v1', rootUrl).href,
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
}

initializeApp()
  .then((app) => {
    const port = environment.PORT || 3337;

    const server = app.listen(port, () => {
      logger.info(`Listening at http://localhost:${port}`);
    });

    const handleExit = async (message, code, err) => {
      server.close();
      err === null ? logger.info(message) : logger.error(message, err);
      process.exit(code);
    };

    process.on('SIGINT', async () => {
      handleExit('File service exit, Byte', 1, null);
    });
    process.on('SIGTERM', async () => {
      handleExit('File service was termination, Byte', 1, null);
    });
    process.on('uncaughtException', async (err: Error) => {
      handleExit('File service Uncaught exception', 1, err);
    });
    server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
  })
  .catch((err) => console.log(err));
