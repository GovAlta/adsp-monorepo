import * as fs from 'fs';
import * as cors from 'cors';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as healthCheck from 'express-healthcheck';
import * as passport from 'passport';
import * as swaggerUi from 'swagger-ui-express';
import { AdspId, adspId, initializePlatform } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { ConfigurationUpdatedDefinition, createConfigService } from './configuration-management';
import { createDirectoryService } from './directory';
import { connectMongo, disconnect } from './mongo/index';
import {
  createTenantRouter,
  createTenantV2Router,
  tenantService,
  TenantCreatedDefinition,
  TenantDeletedDefinition,
  configurationSchema,
} from './tenant';
import { bootstrapDirectory } from './directory';
import { logger } from './middleware/logger';
import { environment } from './environments/environment';

import { version } from '../../../package.json';
import * as directoryService from './directory/services';
import type { User } from '@abgov/adsp-service-sdk';
import { TenantServiceRoles } from './roles';
import { TenantMongoRepository } from './tenant/mongo';

async function initializeApp(): Promise<express.Application> {
  /* Connect to mongo db */
  await connectMongo();

  if (environment.DIRECTORY_BOOTSTRAP) {
    await bootstrapDirectory(logger, environment.DIRECTORY_BOOTSTRAP);
  }

  const app = express();
  app.use(express.json());
  app.use(cors());

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const { coreStrategy, tenantStrategy, directory, eventService, configurationHandler } = await initializePlatform(
    {
      serviceId,
      displayName: 'Tenant Service',
      description: 'Service for management of ADSP tenants.',
      clientSecret: environment.CLIENT_SECRET,
      directoryUrl: null,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
      ignoreServiceAud: true,
      configurationSchema,
      configurationConverter: (c) => Object.entries(c).map(([k, v]) => ({ serviceId: AdspId.parse(k), ...v })),
      events: [TenantCreatedDefinition, TenantDeletedDefinition, ConfigurationUpdatedDefinition],
      roles: [
        // Note: Tenant Admin role is a special composite role.
        {
          role: TenantServiceRoles.TenantAdmin,
          description: 'Administrator role for accessing the ADSP tenant admin.',
        },
      ],
    },
    { logger },
    {
      directory: directoryService,
      tenantService,
    }
  );

  passport.use('jwt', coreStrategy);
  passport.use('jwt-tenant', tenantStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());

  app.get('/welcome', (_req, res) => {
    res.send({ message: 'Welcome to tenant-management-api!' });
  });
  app.get('/version', (_req, res) => {
    res.send(`Version: ${version}`);
  });
  app.use('/health', healthCheck());

  // Q: log info should include user info?
  app.use('/', (req: Request, resp: Response, next: NextFunction) => {
    resp.on('finish', () => {
      if (resp.statusCode === 401) {
        logger.error('401 Unauthorized, Please set valid token in request', `${JSON.stringify(req.query)}`);
      } else if (resp.statusCode === 404) {
        logger.error('404 Not Found, Please input valid request resource', `${JSON.stringify(req.query)}`);
      }
    });
    logger.debug(`${req.method} ${req.path}`);
    next();
  });

  // TODO: For now these endpoints authenticate core realm as well as tenant realm, but
  // need to verify which endpoints require which type of authentication.
  const authenticate = passport.authenticate(['jwt', 'jwt-tenant'], { session: false });
  const authenticateCore = passport.authenticate(['jwt'], { session: false });

  const tenantRepository = new TenantMongoRepository();
  const tenantRouter = createTenantRouter({ tenantRepository, eventService });
  app.use('/api/tenant/v1', authenticate, configurationHandler, tenantRouter);

  const tenantV2Router = createTenantV2Router();
  app.use('/api/tenant/v2', authenticateCore, tenantV2Router);

  createConfigService(app, eventService);
  createDirectoryService(app);

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  // Start to define swagger. Might need it to a module
  const swaggerDocument = fs
    .readFileSync(__dirname + '/swagger.json', 'utf8')
    .replace(/<KEYCLOAK_ROOT>/g, environment.KEYCLOAK_ROOT_URL);

  const swaggerDocBaseUrl = 'swagger/docs/';

  const swaggerHosts = {
    tenantAPI: (await directory.getServiceUrl(adspId`urn:ads:platform:tenant-service`))?.href || '',
    fileService: (await directory.getServiceUrl(adspId`urn:ads:platform:file-service`))?.href || '',
  };

  const swaggerUITenantAPIOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      oauth2RedirectUrl: swaggerHosts.tenantAPI + swaggerDocBaseUrl + 'oauth2-redirect.html',
      url: `${swaggerHosts.tenantAPI}swagger/json/v1`,
    },
  };

  // Only allow swagger UI when ALLOW_SWAGGER_UI presents
  if (environment.ALLOW_SWAGGER_UI) {
    app.use('/' + swaggerDocBaseUrl, swaggerUi.serve, swaggerUi.setup(null, swaggerUITenantAPIOptions));
  }

  app.get('/swagger/json/v1', (req, res) => {
    const { tenant } = req.query;
    console.log(typeof swaggerDocument);
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
    const port = environment.PORT || 3333;

    const server = app.listen(port, () => {
      logger.info(`Listening at http://localhost:${port}/api`);
    });

    const handleExit = async (message: string, code: number, err: Error) => {
      await disconnect();
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
  })
  .catch((err) => logger.error(err));
