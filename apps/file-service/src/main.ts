import * as express from 'express';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import { environment } from './environments/environment';
import { applyFileMiddleware, FileDeletedDefinition, FileUploadedDefinition, ServiceUserRoles } from './file';
import { createRepositories } from './mongo';
import * as cors from 'cors';
import * as fs from 'fs';
import type { User } from '@abgov/adsp-service-sdk';

const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');

async function initializeApp(): Promise<express.Application> {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const { coreStrategy, tenantStrategy, tenantHandler, healthCheck, eventService } = await initializePlatform(
    {
      serviceId,
      displayName: 'File Service',
      description: 'Service for upload and download of files.',
      roles: [
        {
          role: ServiceUserRoles.Admin,
          description: 'Administrator role for the file service.',
          inTenantAdmin: true,
        },
      ],
      configurationSchema: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            anonymousRead: { type: 'boolean' },
            readRoles: { type: 'array', items: { type: 'string' } },
            updateRoles: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'name', 'anonymousRead', 'readRoles', 'updateRoles'],
          additionalProperties: false,
        },
      },
      events: [FileUploadedDefinition, FileDeletedDefinition],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      ignoreServiceAud: true,
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

  app.use('/space', passport.authenticate(['jwt'], { session: false }), tenantHandler);
  app.use('/file-admin', passport.authenticate(['jwt-core'], { session: false }), tenantHandler);
  app.use('/file', passport.authenticate(['jwt', 'anonymous'], { session: false }), tenantHandler);
  app.use('/file-type', passport.authenticate(['jwt'], { session: false }), tenantHandler);

  const repositories = await createRepositories({ ...environment, logger });

  applyFileMiddleware(app, {
    logger,
    rootStoragePath: environment.FILE_PATH,
    avProvider: environment.AV_PROVIDER,
    avHost: environment.AV_HOST,
    avPort: environment.AV_PORT,
    eventService,
    ...repositories,
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
      db: repositories.isConnected(),
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  // Define swagger
  const swaggerDocument = fs
    .readFileSync(__dirname + '/swagger.json', 'utf8')
    .replace(/<KEYCLOAK_ROOT>/g, environment.KEYCLOAK_ROOT_URL);

  app.get('/swagger/json/v1', (req, res) => {
    const { tenant } = req.query;
    const swaggerObj = JSON.parse(swaggerDocument);
    const tenantAuthentication = swaggerObj?.components?.securitySchemes?.tenant?.flows.authorizationCode;
    if (tenant && tenantAuthentication) {
      tenantAuthentication.tokenUrl = tenantAuthentication.tokenUrl.replace('realms/autotest', `realms/${tenant}`);
      tenantAuthentication.authorizationUrl = tenantAuthentication.authorizationUrl.replace(
        'realms/autotest',
        `realms/${tenant}`
      );
      swaggerObj.components.securitySchemes.tenant.flows.authorizationCode = tenantAuthentication;
    }

    res.json(swaggerObj);
  });

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
      handleExit('Tenant management api exit, Byte', 1, null);
    });
    process.on('SIGTERM', async () => {
      handleExit('Tenant management api was termination, Byte', 1, null);
    });
    process.on('uncaughtException', async (err: Error) => {
      handleExit('Tenant management api Uncaught exception', 1, err);
    });
    server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
  })
  .catch((err) => console.log(err));
