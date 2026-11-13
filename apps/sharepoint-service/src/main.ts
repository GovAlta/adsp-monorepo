import * as express from 'express';
import * as passport from 'passport';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, initializePlatform, instrumentAxios, ServiceMetricsValueDefinition } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { environment } from './environments/environment';
import { connectMongo } from './mongo';
import {
  configurationSchema,
  createSharePointRouter,
  CredentialStore,
  FileServiceSource,
  GraphClient,
  GraphFileClient,
  GraphTokenProvider,
  LocalFileSource,
  parseEncryptionKey,
  ServiceRoles,
  SharePointFileService,
  SharePointPusher,
} from './sharepoint';

const logger = createLogger('sharepoint-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const encryptionKey = parseEncryptionKey(environment.CREDENTIALS_KEY, environment.CREDENTIALS_KEY_VERSION);

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
  const {
    coreStrategy,
    configurationHandler,
    directory,
    healthCheck,
    metricsHandler,
    tenantHandler,
    tenantStrategy,
    tokenProvider,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'SharePoint service',
      description: 'Service that pushes data to SharePoint lists owned by tenant teams.',
      roles: [
        {
          role: ServiceRoles.Admin,
          description: 'Administrator role for setting SharePoint connection credentials and testing destinations.',
          inTenantAdmin: true,
        },
        {
          role: ServiceRoles.Writer,
          description: 'Role for services that push data to SharePoint destinations.',
        },
      ],
      configuration: {
        schema: configurationSchema,
        description: 'SharePoint connections and destinations. Connection secrets are not stored here.',
      },
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
      directoryUrl: new URL(environment.DIRECTORY_URL),
      tracing: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
      metrics: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
      values: [ServiceMetricsValueDefinition],
      enableConfigurationInvalidation: true,
    },
    { logger },
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

  const { credentialRepository, isConnected } = await connectMongo({ ...environment, logger });
  const credentialStore = new CredentialStore(credentialRepository, encryptionKey);
  const tokens = new GraphTokenProvider(environment.ENTRA_AUTHORITY_URL, credentialStore);
  const pusher = new SharePointPusher(tokens, new GraphClient(environment.GRAPH_URL));

  if (environment.DEV_FILES_DIRECTORY) {
    logger.warn(`Reading files for upload from local directory '${environment.DEV_FILES_DIRECTORY}'.`);
  }
  const fileSource = environment.DEV_FILES_DIRECTORY
    ? new LocalFileSource(environment.DEV_FILES_DIRECTORY)
    : new FileServiceSource(directory, tokenProvider);
  const fileService = new SharePointFileService(
    tokens,
    new GraphFileClient(environment.GRAPH_URL),
    fileSource,
    pusher,
    environment.FILE_UPLOAD_CONCURRENCY,
  );

  app.use(
    '/sharepoint/v1',
    metricsHandler,
    passport.authenticate(['core', 'tenant'], { session: false }),
    tenantHandler,
    configurationHandler,
    createSharePointRouter({ logger, credentialStore, tokens, pusher, fileService }),
  );

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({ ...platform, db: isConnected() });
  });

  app.get('/', (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'SharePoint service',
      description: 'Service that pushes data to SharePoint lists owned by tenant teams.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/sharepoint/v1', rootUrl).href },
      },
    });
  });

  app.use(createErrorHandler(logger));

  return app;
};

initializeApp()
  .then((app) => {
    const server = app.listen(environment.PORT, () => {
      logger.info(`Listening at http://localhost:${environment.PORT}`);
    });
    server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
  })
  .catch((err) => {
    logger.error(`Failed to start service: ${err}`);
    process.exit(1);
  });
