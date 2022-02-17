import { AdspId, adspId, initializePlatform, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import * as cors from 'cors';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as healthCheck from 'express-healthcheck';
import * as fs from 'fs';
import * as passport from 'passport';
import * as swaggerUi from 'swagger-ui-express';
import { version } from '../../../package.json';
import { environment } from './environments/environment';
import { applyConfigMiddleware, ConfigurationUpdatedDefinition } from './configuration';
import { applyDirectoryMiddleware, bootstrapDirectory, directoryService } from './directory';
import { applyDirectoryV2Middleware } from './directoryV2';
import { createRepositories, disconnect } from './mongo';
import { logger } from './middleware/logger';
import { TenantServiceRoles } from './roles';
import {
  tenantService,
  TenantCreatedDefinition,
  TenantDeletedDefinition,
  configurationSchema,
  applyTenantMiddleware,
} from './tenant';

async function initializeApp(): Promise<express.Application> {
  const repositories = await createRepositories({ ...environment, logger });
  if (environment.DIRECTORY_BOOTSTRAP) {
    await bootstrapDirectory(logger, environment.DIRECTORY_BOOTSTRAP, repositories.directoryRepository);
  }

  const app = express();
  app.use(express.json());
  app.use(cors());

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const { coreStrategy, tenantStrategy, directory, eventService, configurationHandler } = await initializePlatform(
    {
      serviceId,
      displayName: 'Tenant service',
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
      directory: {
        getServiceUrl: (serviceId) => directoryService.getServiceUrl(repositories.directoryRepository, serviceId),
        getResourceUrl: (resourceId) => directoryService.getResourceUrl(repositories.directoryRepository, resourceId),
      },
      tenantService: {
        getTenant: (tenantId) => tenantService.getTenant(repositories.tenantRepository, tenantId),
        getTenants: () => tenantService.getTenants(repositories.tenantRepository),
        // Note: There is no need for an implementation of this capability in tenant admin service itself for now.
        getTenantByName: async (name: string) => {
          const tenants = await tenantService.getTenants(repositories.tenantRepository, { nameEquals: name });
          return tenants[0];
        },
      },
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

  applyTenantMiddleware(app, { ...repositories, logger, eventService, configurationHandler });
  applyConfigMiddleware(app, { ...repositories, logger, eventService });
  applyDirectoryMiddleware(app, { ...repositories, logger });
  applyDirectoryV2Middleware(app, { ...repositories, logger });

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
      await disconnect(logger);
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
