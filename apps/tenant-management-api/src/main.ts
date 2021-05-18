import * as fs from 'fs';
import * as cors from 'cors';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as healthCheck from 'express-healthcheck';
import * as passport from 'passport';
import * as swaggerUi from 'swagger-ui-express';
import { AdspId, adspId, createCoreStrategy, initializePlatform } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, NotFoundError, InvalidOperationError } from '@core-services/core-common';
import { createConfigService } from './configuration-management';
import { connectMongo, disconnect } from './mongo/index';
import { tenantRouter } from './tenant';
import { directoryRouter } from './directory';
import { logger } from './middleware/logger';
import { environment } from './environments/environment';

import { version } from '../../../package.json';
import * as directoryService from './directory/services';
import * as tenantService from './tenant/services';
import { tenantV2Router } from './tenant/router';

async function initializeApp(): Promise<express.Application> {
  /* Connect to mongo db */
  await connectMongo();

  const app = express();
  app.use(express.json());
  app.use(cors());

  const serviceId = AdspId.parse(environment.CLIENT_SECRET);
  const { tenantStrategy, directory } = await initializePlatform(
    {
      serviceId,
      clientSecret: environment.CLIENT_SECRET,
      directoryUrl: null,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
    },
    { logger },
    {
      directory: directoryService,
      tenantService,
    }
  );

  passport.use(
    'jwt',
    createCoreStrategy({
      logger,
      serviceId,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
    })
  );
  passport.use('jwt-tenant', tenantStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user);
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
    logger.info(`${req.method}  ${req.path} Status Code : ${resp.statusCode}`);
    next();
  });

  // TODO: For now these endpoints authenticate core realm as well as tenant realm, but
  // need to verify which endpoints require which type of authentication.
  const authenticate = passport.authenticate(['jwt-tenant', 'jwt'], { session: false });
  const authenticateCore = passport.authenticate(['jwt'], { session: false });
  app.use('/api/tenant/v1', authenticate, tenantRouter);
  app.use('/api/discovery/v1', authenticate, directoryRouter);

  app.use('/api/tenant/v2', authenticateCore, tenantV2Router);

  createConfigService(app);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
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

  // Start to define swagger. Might need it to a module
  const swaggerDocument = fs
    .readFileSync(__dirname + '/swagger.json', 'utf8')
    .replace(/<KEYCLOAK_ROOT>/g, environment.KEYCLOAK_ROOT_URL);

  const swaggerDocBaseUrl = '/swagger/docs';

  const swaggerHosts = {
    tenantAPI: await directory.getServiceUrl(adspId`urn:ads:platform:tenant-service`),
    fileService: await directory.getServiceUrl(adspId`urn:ads:platform:file-service`),
  };

  const swaggerUITenantAPIOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      oauth2RedirectUrl: swaggerHosts.tenantAPI + swaggerDocBaseUrl + '/oauth2-redirect.html',
      url: `${swaggerHosts.tenantAPI}/swagger/json/v1`,
    },
  };

  // Only allow swagger UI when ALLOW_SWAGGER_UI presents
  if (environment.ALLOW_SWAGGER_UI) {
    app.use(swaggerDocBaseUrl, swaggerUi.serve, swaggerUi.setup(null, swaggerUITenantAPIOptions));
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
    const port = process.env.port || 3333;

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
