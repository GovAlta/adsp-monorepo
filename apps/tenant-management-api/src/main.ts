import * as fs from 'fs';
import * as express from 'express';
import * as healthCheck from 'express-healthcheck';
import { createConfigService } from './configuration-management';
import { connectMongo, disconnect } from './mongo/index';
import * as swaggerUi from 'swagger-ui-express';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as passport from 'passport';
import { createKeycloakStrategy } from '@core-services/core-common';
import { apiRouter } from './app/router';

import { logger } from './middleware/logger';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, NotFoundError, InvalidOperationError } from '@core-services/core-common';
import * as cors from 'cors';
import { version } from '../../../package.json';

const app = express();
app.use(express.json());
/* Connect to mongo db */
connectMongo();

app.use(cors());

passport.use('jwt', createKeycloakStrategy());

passport.use(new AnonymousStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(passport.initialize());

app.get('/welcome', (req, res) => {
  res.send({ message: 'Welcome to tenant-management-api!' });
});
app.get('/version', (req, res) => {
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

app.use('/api', apiRouter);
createConfigService(app);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
let swaggerDocument = fs.readFileSync(__dirname + '/swagger.json', 'utf8');
const swaggerDocBaseUrl = '/swagger/docs';

const swaggerHosts = {
  tenantAPI: process.env.TENANT_MANAGEMENT_API_HOST || 'http://localhost:3333',
  fileService: process.env.FILE_SERVICE_HOST || 'http://localhost:3337',
};

const swaggerUITenantAPIOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    oauth2RedirectUrl: process.env.TENANT_MANAGEMENT_API_HOST + swaggerDocBaseUrl + '/oauth2-redirect.html',
    url: `${swaggerHosts.tenantAPI}/swagger/json/v1`,
  },
};

app.use(swaggerDocBaseUrl, swaggerUi.serve, swaggerUi.setup(null, swaggerUITenantAPIOptions));

app.get('/swagger/json/v1', (req, res) => {
  const { tenant } = req.query;
  const keycloakRootTag = '<KEYCLOAK_ROOT>';

  swaggerDocument = swaggerDocument.replace(keycloakRootTag, process.env.KEYCLOAK_ROOT_URL);
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

const port = process.env.port || 3333;

const server = app.listen(port, () => {
  logger.info(`Listening at http://localhost:${port}/api`);
});

const handleExit = async (message, code, err) => {
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
